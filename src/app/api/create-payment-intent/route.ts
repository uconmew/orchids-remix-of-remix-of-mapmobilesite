import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function formatTimeWindow(time: string): string {
  const [start] = time.split('-').map(t => t.trim());
  const hour = parseInt(start);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${formattedHour}:00 ${ampm} - ${formattedHour + 2}:00 ${ampm}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.' }, { status: 503 });
    }
    const body = await request.json();
    const { cartItems, bookingId, guestEmail, guestName, metadata: bodyMetadata, arrivalFeeOnly, amount: directAmount } = body;
    
      // Colorado Retail Delivery Fee (current rate until June 30, 2025)
      const CO_RETAIL_DELIVERY_FEE_CENTS = 29;

      if (arrivalFeeOnly) {
        const arrivalFeeCents = 1000;
        
        if (!bookingId) {
          return NextResponse.json({ error: 'Booking ID required for arrival fee' }, { status: 400 });
        }

        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            *,
            service:services(name),
            vehicle:vehicles(make, model, year),
            address:addresses(street, city, state)
          `)
          .eq('id', bookingId)
          .single();

        if (bookingError || !booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const isColorado = booking.address?.state?.toUpperCase() === 'CO' || 
                          booking.address?.state?.toLowerCase() === 'colorado';

        // Check expiration
        if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
          return NextResponse.json({ error: 'Checkout session expired. Please try again.' }, { status: 410 });
        }

        const serviceName = booking.service?.name || 'Mobile Installation Service';
        const vehicleInfo = booking.vehicle
          ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`
          : 'Vehicle TBD';
        const remainingBalance = Number(booking.total_amount) - 10;

        // Arrival fees for CO also trigger RDF if it's the first delivery-related payment
        // But usually RDF is once per "retail delivery". 
        // We'll add it to the main booking payment instead to avoid double charging if possible,
        // but if arrival fee is the only payment or the first one, it might apply.
        // For simplicity and following "enforcement", we'll check if it's CO.
        const totalAmountCents = arrivalFeeCents + (isColorado ? CO_RETAIL_DELIVERY_FEE_CENTS : 0);

        const paymentIntent = await stripe.paymentIntents.create({
          amount: totalAmountCents,
          currency: 'usd',
          automatic_payment_methods: { enabled: true },
          metadata: {
            type: 'arrival_fee',
            booking_id: bookingId,
            service_name: serviceName,
            vehicle: vehicleInfo,
            remaining_balance: String(remainingBalance),
            total_booking_amount: String(booking.total_amount),
            co_retail_delivery_fee: isColorado ? 'true' : 'false',
          },
        });

        return NextResponse.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: totalAmountCents / 100,
          serviceName,
          remainingBalance,
        });
      }

      if (bookingId) {
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            *,
            service:services(name, description, base_price),
            vehicle:vehicles(make, model, year),
            address:addresses(street, city, state)
          `)
          .eq('id', bookingId)
          .single();

        if (bookingError || !booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const isColorado = booking.address?.state?.toUpperCase() === 'CO' || 
                          booking.address?.state?.toLowerCase() === 'colorado';

        // Check expiration
        if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
          return NextResponse.json({ error: 'Checkout session expired. Please try again.' }, { status: 410 });
        }

        if (booking.payment_status === 'paid') {
          return NextResponse.json({ error: 'Booking already paid' }, { status: 400 });
        }

        let bookingAmountCents = Math.round(Number(booking.total_amount) * 100);
        
        // Add CO Retail Delivery Fee if applicable
        if (isColorado) {
          bookingAmountCents += CO_RETAIL_DELIVERY_FEE_CENTS;
        }

        if (bookingAmountCents < 50) {
          return NextResponse.json({ error: 'Minimum amount is $0.50' }, { status: 400 });
        }

        const serviceName = booking.service?.name || 'Mobile Installation Service';
        const vehicleInfo = booking.vehicle
          ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`
          : 'Vehicle TBD';
        const locationInfo = booking.address
          ? `${booking.address.street}, ${booking.address.city}`
          : 'Location TBD';
        const isNoInstall = booking.scheduled_time === 'No Installation';
        const appointmentDate = booking.booking_date ? formatDate(booking.booking_date) : 'Purchase Only';
        const timeWindow = isNoInstall 
          ? 'Product Only' 
          : booking.scheduled_time
            ? formatTimeWindow(booking.scheduled_time)
            : 'Time TBD';

        const paymentIntent = await stripe.paymentIntents.create({
          amount: bookingAmountCents,
          currency: 'usd',
          automatic_payment_methods: { enabled: true },
          receipt_email: (booking.metadata as any)?.guest_email || undefined,
          metadata: {
            type: isNoInstall ? 'cart_purchase' : 'cart_with_install',
            booking_id: bookingId,
            service_name: serviceName,
            vehicle: vehicleInfo,
            location: locationInfo,
            appointment_date: appointmentDate,
            time_window: timeWindow,
            is_no_install: String(isNoInstall),
            booking_amount: String(Math.round(Number(booking.total_amount) * 100) / 100),
            co_retail_delivery_fee: isColorado ? 'true' : 'false',
            guest_email: (booking.metadata as any)?.guest_email || '',
            guest_name: (booking.metadata as any)?.guest_name || booking.customer_legal_name || '',
          },
        });

        return NextResponse.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: bookingAmountCents / 100,
          serviceName,
          vehicleInfo,
          locationInfo,
          appointmentDate,
          timeWindow,
        });
      }

      if (cartItems && cartItems.length > 0) {
        const itemIds = cartItems.map((item: { id: string }) => item.id);
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, price')
          .in('id', itemIds);

        if (productsError || !products) {
          return NextResponse.json({ error: 'Failed to fetch product prices' }, { status: 500 });
        }

        let cartAmountCents = 0;
        const productDetails: string[] = [];
        for (const item of cartItems) {
          const product = products.find(p => p.id === item.id);
          if (product) {
            cartAmountCents += Math.round(Number(product.price) * 100) * item.quantity;
            productDetails.push(`${product.name} x${item.quantity}`);
          }
        }

        const shippingFee = bodyMetadata?.shipping_fee ? Math.round(Number(bodyMetadata.shipping_fee) * 100) : 0;
        const totalCents = cartAmountCents + shippingFee;

        if (totalCents < 50) {
          return NextResponse.json({ error: 'Minimum amount is $0.50' }, { status: 400 });
        }

        // If it's a cart with installation, we store the details in metadata
        // to create the booking ONLY after successful payment
        if (bodyMetadata?.includes_installation === 'true') {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCents,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            receipt_email: guestEmail || undefined,
            metadata: {
              type: 'cart_with_install',
              items_count: String(cartItems.length),
              cart_items: JSON.stringify(cartItems).slice(0, 400),
              product_summary: productDetails.join(', ').slice(0, 400),
              service_id: body.serviceId || '',
              vehicle_id: body.vehicleId || '',
              address_id: body.addressId || '',
              booking_date: body.bookingDate || '',
              scheduled_time: body.scheduledTime || '',
              customer_legal_name: body.legalName || '',
              customer_preferred_name: body.preferredName || '',
              address_type: body.addressType || '',
              business_install_authorized: String(body.businessAuthorized || false),
              tech_contact_phone: body.techContactPhone || '',
              shipping_fee: String(shippingFee / 100),
              total_amount: String(totalCents / 100),
              guest_email: guestEmail || '',
              guest_name: guestName || '',
              user_id: body.userId || '',
            },
          });

          return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: totalCents / 100,
          });
        }

        const paymentIntent = await stripe.paymentIntents.create({
        amount: totalCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        receipt_email: guestEmail || undefined,
        metadata: {
          type: 'cart_purchase',
          items_count: String(cartItems.length),
          cart_items: JSON.stringify(cartItems).slice(0, 500),
          product_summary: productDetails.join(', ').slice(0, 500),
          shipping_address: bodyMetadata?.shipping_address || '',
          shipping_fee: String(shippingFee / 100),
          guest_email: guestEmail || '',
          guest_name: guestName || '',
          guest_checkout: bodyMetadata?.guest_checkout || 'false',
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: totalCents / 100,
      });
    }

    if (body.amount) {
      return NextResponse.json({ error: 'Direct amount not allowed. Provide cartItems or bookingId.' }, { status: 400 });
    }

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(name, description, base_price),
        vehicle:vehicles(make, model, year),
        address:addresses(street, city, state)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.payment_status === 'paid') {
      return NextResponse.json({ error: 'Booking already paid' }, { status: 400 });
    }

    const bookingAmountCents = Math.round(Number(booking.total_amount) * 100);

    if (bookingAmountCents < 50) {
      return NextResponse.json({ error: 'Minimum amount is $0.50' }, { status: 400 });
    }

    const serviceName = booking.service?.name || 'Mobile Installation Service';
    const vehicleInfo = booking.vehicle
      ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`
      : 'Vehicle TBD';
    const locationInfo = booking.address
      ? `${booking.address.street}, ${booking.address.city}`
      : 'Location TBD';
    const isNoInstall = booking.scheduled_time === 'No Installation';
    const appointmentDate = booking.booking_date ? formatDate(booking.booking_date) : 'Purchase Only';
    const timeWindow = isNoInstall 
      ? 'Product Only' 
      : booking.scheduled_time
        ? formatTimeWindow(booking.scheduled_time)
        : 'Time TBD';

    const paymentIntent = await stripe.paymentIntents.create({
      amount: bookingAmountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'booking',
        booking_id: bookingId,
        service_name: serviceName,
        vehicle: vehicleInfo,
        location: locationInfo,
        appointment_date: appointmentDate,
        time_window: timeWindow,
        is_no_install: String(isNoInstall),
        booking_amount: String(bookingAmountCents / 100),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: bookingAmountCents / 100,
      serviceName,
      vehicleInfo,
      locationInfo,
      appointmentDate,
      timeWindow,
    });
  } catch (err: unknown) {
    console.error('Payment Intent Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
