import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit-logger";

export async function POST(req: Request) {
  try {
    const { bookingId, adminId } = await req.json();

    if (!bookingId || !adminId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get the booking
    const { data: bookingData, error: fetchError } = await supabase
      .from("bookings")
      .select("start_time, status")
      .eq("id", bookingId)
      .single();

    if (fetchError || !bookingData) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const startTime = bookingData.start_time ? new Date(bookingData.start_time) : new Date();
    const completionTime = new Date();
    const elapsedTimeMinutes = Math.round((completionTime.getTime() - startTime.getTime()) / 60000);

    // Update booking to completed
    const { data: booking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "completed",
        completion_time: completionTime.toISOString(),
        elapsed_time: elapsedTimeMinutes,
        updated_at: new Date().toISOString()
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log audit
    await logAudit({
      action: "FORCE_COMPLETE_JOB",
      entityType: "booking",
      entityId: bookingId,
      metadata: {
        admin_id: adminId,
        completion_time: completionTime.toISOString(),
        elapsed_time: elapsedTimeMinutes,
        forced: true
      }
    });

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error("Force Complete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
