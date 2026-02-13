import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, bookingId, notes, performedBy, performerMapId } = await request.json();

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
      .select('total_amount, paid_amount, technician_notes')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { error: paymentRecordError } = await supabase
      .from('booking_payments')
      .insert({
        booking_id: bookingId,
        payment_intent_id: paymentIntentId,
        amount: paymentAmount,
        payment_type: 'additional',
        status: 'succeeded',
        payment_method: paymentIntent.payment_method_types?.[0] || 'card',
        notes: notes || null,
        performed_by: performedBy || null,
        performer_map_id: performerMapId || null,
      });

    if (paymentRecordError) {
      console.error('Error recording payment:', paymentRecordError);
    }

    const newTotalAmount = Number(booking.total_amount) + paymentAmount;
    const existingNotes = booking.technician_notes || '';
    const timestamp = new Date().toLocaleString();
    const updatedNotes = existingNotes 
      ? `${existingNotes}\n---\n[${timestamp}] Additional charge: $${paymentAmount.toFixed(2)}${notes ? ` - ${notes}` : ''}`
      : `[${timestamp}] Additional charge: $${paymentAmount.toFixed(2)}${notes ? ` - ${notes}` : ''}`;

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        total_amount: newTotalAmount,
        technician_notes: updatedNotes,
      })
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
        action: 'PURCHASE',
        entity_type: 'payment',
        entity_id: bookingId,
        metadata: {
          payment_intent_id: paymentIntentId,
          amount: paymentAmount,
          payment_type: 'technician_additional_charge',
          notes: notes || '',
          new_total_amount: newTotalAmount,
        }
      });

    if (auditError) {
      console.error('Error logging audit:', auditError);
    }

    const { error: updateAuditError } = await supabase
      .from('audits')
      .insert({
        performed_by: performedBy || null,
        performer_map_id: performerMapId || null,
        action: 'UPDATE_BOOKING',
        entity_type: 'booking',
        entity_id: bookingId,
        metadata: {
          change_type: 'additional_charge',
          amount_added: paymentAmount,
          previous_total: Number(booking.total_amount),
          new_total: newTotalAmount,
          notes: notes || '',
        }
      });

    if (updateAuditError) {
      console.error('Error logging update audit:', updateAuditError);
    }

    return NextResponse.json({ 
      success: true, 
      status: paymentIntent.status,
      amount: paymentAmount,
      newTotalAmount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
