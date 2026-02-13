import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit-logger";

export async function POST(req: Request) {
  try {
    const now = new Date();
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60000);

    // 1. Find jobs that have exceeded the 15-minute grace period
    const { data: expiredJobs, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .not("opt_in_at", "is", null)
      .lt("opt_in_at", fifteenMinsAgo.toISOString());

    if (fetchError) throw fetchError;

    if (!expiredJobs || expiredJobs.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const releasedIds = [];
    for (const job of expiredJobs) {
      const techId = job.assigned_tech_id;
      const lockoutTime = new Date(now.getTime() + 20 * 60000);

      // 2. Release Job and Apply Lockout
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          assigned_tech_id: null,
          status: "pending",
          opt_in_at: null,
          lockout_until: lockoutTime.toISOString(),
          last_attempted_tech_id: techId,
          updated_at: now.toISOString()
        })
        .eq("id", job.id);

      if (!updateError) {
        releasedIds.push(job.id);

        // 3. Log audit for each release
        await logAudit({
          action: "RELEASE_JOB_EXPIRED",
          entityType: "booking",
          entityId: job.id,
          metadata: {
            tech_id: techId,
            lockout_until: lockoutTime.toISOString(),
            reason: "15-minute grace period expired"
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: releasedIds.length, 
      releasedIds 
    });
  } catch (error: any) {
    console.error("Release Expired Jobs Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
