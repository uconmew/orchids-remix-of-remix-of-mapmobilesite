import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, bookingId, performedBy, performerMapId } = await request.json();

    if (!paymentIntentId || !bookingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.booking_id !== bookingId) {
      return NextResponse.json({ error: 'Payment intent does not match booking' }, { status: 400 });
    }

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ 
        success: false, 
        status: paymentIntent.status,
        message: 'Payment not yet complete'
      });
    }

    const paymentAmount = paymentIntent.amount / 100;

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('total_amount, paid_amount, payment_status, status')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const totalAmount = Number(booking.total_amount);
    const currentPaidAmount = Number(booking.paid_amount || 0);
    const newPaidAmount = currentPaidAmount + paymentAmount;
    
    const isFullyPaid = (totalAmount - newPaidAmount) < 0.01;
    const remainingAmount = Math.max(0, totalAmount - newPaidAmount);

    const { error: paymentRecordError } = await supabase
      .from('booking_payments')
      .insert({
        booking_id: bookingId,
        payment_intent_id: paymentIntentId,
        amount: paymentAmount,
        payment_type: 'split',
        status: 'succeeded',
        payment_method: paymentIntent.payment_method_types?.[0] || 'card',
        performed_by: performedBy || null,
        performer_map_id: performerMapId || null,
      });

    if (paymentRecordError) {
      console.error('Error recording payment:', paymentRecordError);
    }

    const updateData: Record<string, unknown> = {
      paid_amount: newPaidAmount,
      payment_status: isFullyPaid ? 'paid' : 'partial',
      payment_method: 'card',
    };

    if (isFullyPaid) {
      updateData.status = 'confirmed';
    } else if (booking.payment_status === 'unpaid' || booking.status === 'unpaid') {
      updateData.status = 'pending';
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      return NextResponse.json({ 
        success: true, 
        status: paymentIntent.status,
        warning: 'Payment succeeded but booking update failed'
      });
    }

    const { error: auditError } = await supabase
      .from('audits')
      .insert({
        performed_by: performedBy || null,
        performer_map_id: performerMapId || null,
        action: isFullyPaid ? 'PURCHASE_COMPLETE' : 'PARTIAL_PAYMENT',
        entity_type: 'payment',
        entity_id: bookingId,
        metadata: {
          payment_intent_id: paymentIntentId,
          amount: paymentAmount,
          payment_type: 'split_payment',
          total_booking_amount: totalAmount,
          paid_so_far: newPaidAmount,
          remaining: remainingAmount,
          is_fully_paid: isFullyPaid,
        }
      });

    if (auditError) {
      console.error('Error logging audit:', auditError);
    }

    return NextResponse.json({ 
      success: true, 
      status: paymentIntent.status,
      paidAmount: newPaidAmount,
      remainingAmount,
      isFullyPaid,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
