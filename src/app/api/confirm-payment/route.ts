import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { getOrCreateCustomerNumber } from '@/lib/customer-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, bookingId: providedBookingId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Missing paymentIntentId' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    let bookingId = providedBookingId || paymentIntent.metadata.booking_id;
    const { metadata } = paymentIntent;

    // Get or Create Customer Number
    const email = paymentIntent.receipt_email || metadata.guest_email;
    const userId = metadata.user_id;
    const customerNumber = await getOrCreateCustomerNumber(supabase, { userId, email });

    if (paymentIntent.status === 'succeeded') {
      const paymentAmount = paymentIntent.amount / 100;

      // If no booking exists, create one from metadata
      if (!bookingId && (metadata.type === 'cart_with_install' || metadata.type === 'arrival_fee')) {
        const { data: newBooking, error: createError } = await supabase
          .from('bookings')
          .insert({
            user_id: metadata.user_id || null,
            customer_email: email || null,
            customer_number: customerNumber,
            service_id: metadata.service_id || null,
            vehicle_id: metadata.vehicle_id || null,
            address_id: metadata.address_id || null,
            booking_date: metadata.booking_date || null,
            scheduled_time: metadata.scheduled_time || null,
            customer_legal_name: metadata.customer_legal_name || null,
            customer_preferred_name: metadata.customer_preferred_name || null,
            address_type: metadata.address_type || 'residential',
            business_install_authorized: metadata.business_install_authorized === 'true',
            tech_contact_phone: metadata.tech_contact_phone || null,
            payment_method: metadata.type === 'arrival_fee' ? 'arrival' : 'card',
            total_amount: Number(metadata.total_booking_amount || metadata.total_amount || 0),
            paid_amount: paymentAmount,
            payment_status: metadata.type === 'arrival_fee' ? 'partial' : 'paid',
            status: 'confirmed',
            arrival_fee_paid: metadata.type === 'arrival_fee',
          })
          .select()
          .single();

        if (createError) {
          console.error('Failed to create booking from metadata:', createError);
          return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
        }

        bookingId = newBooking.id;
      }

      if (!bookingId) {
        return NextResponse.json({ error: 'Booking ID not found' }, { status: 400 });
      }

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

      const updateData: Record<string, unknown> = {
        paid_amount: newPaidAmount,
        payment_status: isFullyPaid ? 'paid' : 'partial',
        payment_method: 'card',
        expires_at: null,
        customer_number: customerNumber,
        customer_email: email
      };

      if (isFullyPaid) {
        updateData.status = 'confirmed';
      } else if (booking.status === 'unpaid' || booking.payment_status === 'unpaid') {
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

      const { error: paymentRecordError } = await supabase
        .from('booking_payments')
        .insert({
          booking_id: bookingId,
          payment_intent_id: paymentIntentId,
          amount: paymentAmount,
          payment_type: 'full',
          status: 'succeeded',
          payment_method: paymentIntent.payment_method_types?.[0] || 'card',
        });

      if (paymentRecordError) {
        console.error('Error recording payment:', paymentRecordError);
      }

      return NextResponse.json({ 
        success: true, 
        status: paymentIntent.status,
        bookingStatus: isFullyPaid ? 'confirmed' : 'pending',
        paidAmount: newPaidAmount,
        remainingAmount,
        isFullyPaid,
        customerNumber
      });
    }

    return NextResponse.json({ 
      success: false, 
      status: paymentIntent.status,
      message: 'Payment not yet complete'
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
