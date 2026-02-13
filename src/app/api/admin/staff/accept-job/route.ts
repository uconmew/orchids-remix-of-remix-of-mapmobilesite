import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit-logger";

// Helper for distance calculation (Haversine)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: Request) {
  try {
    const { bookingId, techId, mapId, techName, techLat, techLon } = await req.json();

    if (!bookingId || !techId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch Technician Profile
    const { data: techProfile, error: techError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", techId)
      .single();

    if (techError || !techProfile) {
      return NextResponse.json({ error: "Technician profile not found" }, { status: 404 });
    }

    // 2. Fetch Booking Details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, address:address_id(*)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // --- ELIGIBILITY CHECKS ---

    // 2.1. Lockout Check
    if (booking.lockout_until && new Date(booking.lockout_until) > new Date() && booking.last_attempted_tech_id === techId) {
      return NextResponse.json({ 
        error: "Technician Locked", 
        locked: true,
        message: "You are currently in a 20-minute lockout for this specific job."
      }, { status: 403 });
    }

    // 2.2. Geolocation Check (15 miles)
    if (techLat && techLon && booking.latitude && booking.longitude) {
      const distance = getDistance(techLat, techLon, booking.latitude, booking.longitude);
      if (distance > 15) {
        return NextResponse.json({ error: `Out of range (${distance.toFixed(1)} miles). Must be within 15 miles.` }, { status: 403 });
      }
    }

    // 2.3. Arrival Buffer Check (30 mins)
    const now = new Date();
    let arrivalTime = new Date(booking.booking_date);

    // Parse scheduled_time (e.g., "01:00 PM") and merge with booking_date
    if (booking.scheduled_time) {
      const timeMatch = booking.scheduled_time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3].toUpperCase();

        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;

        // Construct date using components to avoid timezone shift issues with "YYYY-MM-DD"
        // Handle both simple "YYYY-MM-DD" and full ISO strings
        const dateOnly = booking.booking_date.split("T")[0];
        const dateParts = dateOnly.split("-");
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const day = parseInt(dateParts[2], 10);
          arrivalTime = new Date(year, month, day, hours, minutes);
        } else {
          arrivalTime.setHours(hours, minutes, 0, 0);
        }
      }
    }

    const bufferLimit = new Date(now.getTime() + 30 * 60000);
    if (arrivalTime < bufferLimit) {
      return NextResponse.json({ 
        error: "Arrival buffer violation. Must opt-in at least 30 minutes before appointment.",
        details: {
          arrivalTime: arrivalTime.toISOString(),
          now: now.toISOString(),
          bufferLimit: bufferLimit.toISOString(),
          scheduledTime: booking.scheduled_time
        }
      }, { status: 403 });
    }

    // 2.4. Current Status Logic
    if (techProfile.tech_status === 'deployed') {
      // Must be within 30 mins of expected completion of current job
      const { data: currentJobs } = await supabase
        .from("bookings")
        .select("*")
        .eq("assigned_tech_id", techId)
        .eq("status", "in_progress")
        .single();

      if (currentJobs) {
        // Simple logic: if in_progress, check if they've been working long enough or estimate completion
        // For this spec, we'll assume they must be within 30 mins of their "expected" completion.
        // We'll use a 2-hour window as default if no data exists.
        const startTime = new Date(currentJobs.start_time || currentJobs.assigned_at);
        const expectedCompletion = new Date(startTime.getTime() + 2 * 60 * 60000); // 2h default
        const thirtyMinsBeforeCompletion = new Date(expectedCompletion.getTime() - 30 * 60000);
        
        if (now < thirtyMinsBeforeCompletion) {
          return NextResponse.json({ error: "Currently deployed. You must be within 30 minutes of completion to opt-in." }, { status: 403 });
        }
      }
    }

    // --- SUCCESS: ASSIGN JOB ---

    const updateData: any = {
      assigned_tech_id: techId,
      assigned_at: now.toISOString(),
      status: "confirmed",
      last_attempted_tech_id: techId
    };

    // Trigger 15-minute grace period if tech is deployed
    if (techProfile.tech_status === 'deployed') {
      updateData.opt_in_at = now.toISOString();
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)
      .select("*, service:service_id(name)")
      .single();

    if (updateError) throw updateError;

    // Update Tech Status to 'deployed'
    await supabase
      .from("profiles")
      .update({ tech_status: 'deployed' })
      .eq("id", techId);

    // Log audit
    await logAudit({
      action: "UPDATE_BOOKING",
      entityType: "booking",
      entityId: bookingId,
      metadata: {
        type: "job_assignment",
        tech_id: techId,
        tech_map_id: mapId,
        tech_name: techName,
        assigned_at: now.toISOString(),
        grace_period_active: !!updateData.opt_in_at
      }
    });

    return NextResponse.json({ 
      success: true, 
      booking: updatedBooking,
      message: updateData.opt_in_at ? "Job assigned. You have 15 minutes to complete your current installation." : "Job assigned successfully."
    });
  } catch (error: any) {
    console.error("Accept Job Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
