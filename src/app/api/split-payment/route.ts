import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { bookingId, amount, paymentNumber } = await request.json();

    if (!bookingId || !amount) {
      return NextResponse.json({ error: 'Booking ID and amount required' }, { status: 400 });
    }

    const amountCents = Math.round(Number(amount) * 100);
    if (amountCents < 50) {
      return NextResponse.json({ error: 'Minimum payment amount is $0.50' }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        service:service_id (name),
        vehicle:vehicle_id (make, model, year),
        address:address_id (street, city)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.payment_status === 'paid') {
      return NextResponse.json({ error: 'Booking already fully paid' }, { status: 400 });
    }

    if (booking.payment_method === 'pay_on_arrival' || booking.payment_method === 'arrival') {
      return NextResponse.json({ 
        error: 'Cannot process card payment for Pay on Arrival booking. Payment method must be consistent.' 
      }, { status: 400 });
    }

    const totalAmount = Number(booking.total_amount);
    const paidAmount = Number(booking.paid_amount || 0);
    const remainingAmount = totalAmount - paidAmount;

    if (amountCents > Math.round(remainingAmount * 100)) {
      return NextResponse.json({ 
        error: `Amount exceeds remaining balance of $${remainingAmount.toFixed(2)}` 
      }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'split_payment',
        booking_id: bookingId,
        payment_number: String(paymentNumber || 1),
        service_name: booking.service?.name || 'Service',
        total_booking_amount: String(totalAmount),
        remaining_after_this: String(remainingAmount - (amountCents / 100)),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountCents / 100,
      totalAmount,
      paidAmount,
      remainingAmount,
      serviceName: booking.service?.name || 'Service',
    });
  } catch (err: unknown) {
    console.error('Split Payment Intent Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        total_amount,
        paid_amount,
        payment_status,
        payment_method,
        service:service_id (name)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { data: payments, error: paymentsError } = await supabase
      .from('booking_payments')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    }

    const totalAmount = Number(booking.total_amount);
    const paidAmount = Number(booking.paid_amount || 0);
    const remainingAmount = totalAmount - paidAmount;

    const service = Array.isArray(booking.service) ? booking.service[0] : booking.service;

    return NextResponse.json({
      booking: {
        id: booking.id,
        totalAmount,
        paidAmount,
        remainingAmount,
        paymentStatus: booking.payment_status,
        paymentMethod: booking.payment_method,
        serviceName: service?.name || 'Service',
      },
      payments: payments || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
