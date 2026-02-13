import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getOrCreateCustomerNumber } from '@/lib/customer-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await processPayment(paymentIntent.metadata, paymentIntent.id, paymentIntent.amount, paymentIntent.receipt_email || undefined);
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await processPayment(session.metadata || {}, session.payment_intent as string, session.amount_total || 0, session.customer_details?.email || undefined);
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function processPayment(metadata: Stripe.Metadata, paymentId: string, amountCents: number, email?: string) {
  // Handle Booking
  if (metadata.booking_id) {
    await handleBookingPayment(paymentId, metadata.booking_id, amountCents, metadata, email);
  }

  // Handle Cart Items (if no booking_id, it's a cart-only purchase)
  if (metadata.cart_items && !metadata.booking_id) {
    await handleCartPurchase(paymentId, metadata.cart_items, amountCents, metadata, email);
  }
}

async function handleCartPurchase(paymentId: string, cartItemsStr: string, amountCents: number, metadata: Stripe.Metadata, stripeEmail?: string) {
  let cartItems: { id: string; quantity: number }[];
  try {
    cartItems = JSON.parse(cartItemsStr);
  } catch {
    console.error('Failed to parse cart_items');
    return;
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    console.error('Invalid cart_items');
    return;
  }

  const productIds = cartItems.map(item => item.id);
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price')
    .in('id', productIds);

  if (productsError || !products) {
    console.error('Failed to fetch products:', productsError);
    return;
  }

  // Get or Create Customer Number
  const email = stripeEmail || metadata.guest_email;
  const userId = metadata.user_id;
  const customerNumber = await getOrCreateCustomerNumber(supabase, { userId, email });

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: userId || null,
      customer_email: email || null,
      customer_number: customerNumber,
      total_amount: amountCents / 100,
      paid_amount: amountCents / 100,
      payment_status: 'paid',
      status: 'confirmed',
      payment_method: 'card',
      customer_legal_name: metadata.guest_name || null,
      scheduled_time: 'No Installation',
      install_type: 'Product Only',
      metadata: { ...metadata, stripe_payment_id: paymentId }
    })
    .select()
    .single();

  if (bookingError) {
    console.error('Failed to create booking for cart purchase:', bookingError);
    return;
  }

  const bookingItems = cartItems.map(item => {
    const product = products.find(p => p.id === item.id);
    return {
      booking_id: booking.id,
      product_id: item.id,
      quantity: item.quantity,
      price: product?.price || 0,
    };
  });

  const { error: itemsError } = await supabase
    .from('booking_items')
    .insert(bookingItems);

  if (itemsError) {
    console.error('Failed to create booking items:', itemsError);
  }

  // Log Audit for Purchase
  await supabase.from('audits').insert({
    action: 'PURCHASE',
    entity_type: 'booking',
    entity_id: booking.id,
    metadata: {
      amount: amountCents / 100,
      payment_id: paymentId,
      items: bookingItems,
      type: 'cart_purchase',
      customer_number: customerNumber
    }
  });

  console.log('Cart purchase booking created:', booking.id, 'with customer number:', customerNumber);
}

async function handleBookingPayment(paymentId: string, bookingId: string, metadata: Stripe.Metadata, stripeEmail?: string) {
    const { data: booking, error: bookingFetchError } = await supabase
      .from('bookings')
      .select('user_id, total_amount, payment_status, customer_email')
      .eq('id', bookingId)
      .single();

    if (bookingFetchError || !booking) {
      console.error('Booking not found:', bookingId);
      return;
    }

    // Get or Create Customer Number
    const email = stripeEmail || booking.customer_email || metadata.guest_email;
    const userId = booking.user_id || metadata.user_id;
    const customerNumber = await getOrCreateCustomerNumber(supabase, { userId, email });

    const isColoradoFee = metadata.co_retail_delivery_fee === 'true';
    const feeAmount = isColoradoFee ? 0.29 : 0;
    const taxAmount = (metadata.tax_amount ? Number(metadata.tax_amount) : 0);

    if (booking.payment_status === 'paid') {
      console.log('Booking already paid, skipping update but ensuring customer number:', bookingId);
      await supabase.from('bookings').update({ 
        customer_number: customerNumber,
        customer_email: email,
        co_retail_delivery_fee_applied: isColoradoFee,
        fee_amount: feeAmount
      }).eq('id', bookingId);
      return;
    }

    const { error: paymentError } = await supabase
      .from('booking_payments')
      .insert({
        booking_id: bookingId,
        payment_intent_id: paymentId,
        amount: amountCents / 100,
        status: 'succeeded',
        payment_type: 'full',
        payment_method: 'card'
      });

    if (paymentError) {
      console.error('Failed to insert payment record:', paymentError);
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        payment_status: 'paid', 
        status: 'confirmed', 
        customer_number: customerNumber,
        customer_email: email,
        paid_amount: amountCents / 100,
        tax_amount: taxAmount,
        fee_amount: feeAmount,
        co_retail_delivery_fee_applied: isColoradoFee
      })
      .eq('id', bookingId);


  if (updateError) {
    console.error('Failed to update booking:', updateError);
  }

  // Log Audit for Booking Payment
  await supabase.from('audits').insert({
    action: 'PURCHASE',
    entity_type: 'booking',
    entity_id: bookingId,
    metadata: {
      amount: booking.total_amount,
      payment_id: paymentId,
      user_id: booking.user_id,
      type: 'booking_payment',
      customer_number: customerNumber
    }
  });

  console.log('Booking payment confirmed:', bookingId, 'with customer number:', customerNumber);
}

