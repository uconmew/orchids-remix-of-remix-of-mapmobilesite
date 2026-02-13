import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
    const { bookingId, cartItems } = await request.json();

    if (!bookingId && (!cartItems || cartItems.length === 0)) {
      return NextResponse.json({ error: 'Booking ID or Cart Items required' }, { status: 400 });
    }

    const line_items: any[] = [];
    const metadata: any = {};
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Colorado Retail Delivery Fee (current rate until June 30, 2025)
    const CO_RETAIL_DELIVERY_FEE_CENTS = 29;

    // Handle Booking
    if (bookingId) {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:service_id (name, description, base_price),
          vehicle:vehicle_id (make, model, year),
          address:address_id (street, city, state)
        `)
        .eq('id', bookingId)
        .single();

      if (error || !booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      if (booking.payment_status === 'paid') {
        return NextResponse.json({ error: 'Booking already paid' }, { status: 400 });
      }

      const isColorado = booking.address?.state?.toUpperCase() === 'CO' || 
                        booking.address?.state?.toLowerCase() === 'colorado';

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

      const description = isNoInstall 
        ? [
            `Vehicle: ${vehicleInfo}`,
            `Location: ${locationInfo}`,
            `Mode: Hardware Purchase Only (No Install)`,
          ].join('\n')
        : [
            `Vehicle: ${vehicleInfo}`,
            `Location: ${locationInfo}`,
            `Date: ${appointmentDate}`,
            `Time: ${timeWindow}`,
          ].join('\n');

      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: serviceName,
            description,
          },
          unit_amount: Math.round(Number(booking.total_amount) * 100),
          tax_behavior: 'exclusive',
        },
        quantity: 1,
      });

      // Add Colorado Retail Delivery Fee if applicable
      if (isColorado) {
        line_items.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Colorado Retail Delivery Fee',
              description: 'State mandated fee for deliveries to Colorado addresses.',
            },
            unit_amount: CO_RETAIL_DELIVERY_FEE_CENTS,
            tax_behavior: 'exclusive',
          },
          quantity: 1,
        });
        metadata.co_retail_delivery_fee = 'true';
      }

      metadata.booking_id = bookingId;
      metadata.service_name = serviceName;
      metadata.vehicle = vehicleInfo;
      metadata.location = locationInfo;
      metadata.appointment_date = appointmentDate;
      metadata.time_window = timeWindow;
    }

    // Handle Cart Items
    if (cartItems && cartItems.length > 0) {
      const itemIds = cartItems.map((item: any) => item.id);
      const { data: products, error: pError } = await supabase
        .from('products')
        .select('id, name, price, description')
        .in('id', itemIds);

      if (pError || !products) {
        return NextResponse.json({ error: 'Failed to fetch cart products' }, { status: 500 });
      }

      for (const cartItem of cartItems) {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
          line_items.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: product.name,
                description: product.description || undefined,
              },
              unit_amount: Math.round(Number(product.price) * 100),
            },
            quantity: cartItem.quantity,
          });
        }
      }
      
      metadata.cart_items = JSON.stringify(cartItems).slice(0, 500);
      metadata.has_cart = 'true';
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto' },
      success_url: bookingId 
        ? `${origin}/book?success=true&booking_id=${bookingId}` 
        : `${origin}/checkout/success`,
      cancel_url: bookingId 
        ? `${origin}/book?canceled=true&booking_id=${bookingId}` 
        : `${origin}/checkout/cart`,
      metadata,
      payment_intent_data: {
        metadata: {
          ...metadata,
          type: bookingId ? 'booking_with_cart' : 'cart_only'
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('Checkout Session Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
