import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit-logger";

export async function POST(req: Request) {
  try {
    const { 
      bookingId, 
      techId, 
      vehicleYear, 
      vehicleMake, 
      vehicleModel, 
      installType 
    } = await req.json();

    if (!bookingId || !techId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Get the booking to find start_time and opt_in_at
    const { data: bookingData, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError || !bookingData) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const startTime = new Date(bookingData.start_time || bookingData.assigned_at);
    const completionTime = new Date();
    const elapsedTimeMinutes = Math.round((completionTime.getTime() - startTime.getTime()) / 60000);

    // 2. Update booking to completed
    const { data: booking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "completed",
        completion_time: completionTime.toISOString(),
        elapsed_time: elapsedTimeMinutes,
        vehicle_year: vehicleYear,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        install_type: installType,
        opt_in_at: null, // Clear grace period if this was the "completing" job
        updated_at: new Date().toISOString()
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 3. Update Technician Status
    // Check if tech has any other active jobs
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: 'exact', head: true })
      .eq("assigned_tech_id", techId)
      .in("status", ["confirmed", "in_progress"]);

    const newStatus = count && count > 0 ? 'deployed' : 'available';
    
    await supabase
      .from("profiles")
      .update({ tech_status: newStatus })
      .eq("id", techId);

    // 4. Log audit
    await logAudit({
      action: "COMPLETE_JOB",
      entityType: "booking",
      entityId: bookingId,
      metadata: {
        tech_id: techId,
        completion_time: completionTime.toISOString(),
        elapsed_time: elapsedTimeMinutes,
        year: vehicleYear,
        make: vehicleMake,
        model: vehicleModel,
        install_type: installType,
        new_tech_status: newStatus
      }
    });

    return NextResponse.json({ success: true, booking, tech_status: newStatus });
  } catch (error: any) {
    console.error("Complete Job Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
