import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit-logger";

export async function POST(req: Request) {
  try {
    const { bookingId, techId } = await req.json();

    if (!bookingId || !techId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update booking to in_progress
    const { data: booking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "in_progress",
        start_time: new Date().toISOString(),
        assigned_tech_id: techId, // Just to be sure
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log audit
    await logAudit({
      action: "START_JOB",
      entityType: "booking",
      entityId: bookingId,
      metadata: {
        tech_id: techId,
        start_time: new Date().toISOString()
      }
    });

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error("Start Job Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
