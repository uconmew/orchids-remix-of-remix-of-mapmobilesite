import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { bookingId, amount, notes, performedBy, performerMapId } = await request.json();

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
        user:user_id (email, full_name)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'technician_additional_charge',
        booking_id: bookingId,
        service_name: booking.service?.name || 'Service',
        customer_name: booking.user?.full_name || 'Customer',
        notes: notes || '',
        performed_by: performedBy || '',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountCents / 100,
      booking: {
        id: booking.id,
        serviceName: booking.service?.name || 'Service',
        customerName: booking.user?.full_name || 'Customer',
        customerEmail: booking.user?.email || '',
        totalAmount: Number(booking.total_amount),
      },
    });
  } catch (err: unknown) {
    console.error('Technician Payment Intent Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
