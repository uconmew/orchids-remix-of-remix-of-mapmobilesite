import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit-logger";

export async function POST(req: Request) {
  try {
    const { mapId, overrideCode } = await req.json();

    if (!mapId || !overrideCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify Override Code
    const { data: setting, error: settingError } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "admin_override_code")
      .single();

    if (settingError || !setting || setting.value !== overrideCode) {
      return NextResponse.json({ error: "Invalid Admin Override Code" }, { status: 403 });
    }

    // 2. Find Technician
    const { data: tech, error: techError } = await supabase
      .from("profiles")
      .select("id")
      .eq("map_id", mapId)
      .single();

    if (techError || !tech) {
      return NextResponse.json({ error: "Technician not found" }, { status: 404 });
    }

    // 3. Purge Lockouts and Reset Grace Period
    // - Clear lockout_until on any bookings where this tech was the last attempted tech
    // - Reset opt_in_at to now for their currently "grace-period" job
    const now = new Date();
    
    // Clear lockouts
    await supabase
      .from("bookings")
      .update({ lockout_until: null })
      .eq("last_attempted_tech_id", tech.id)
      .gt("lockout_until", now.toISOString());

    // Reset grace period for their most recent assigned (but not yet started) job if applicable
    await supabase
      .from("bookings")
      .update({ opt_in_at: now.toISOString() })
      .eq("assigned_tech_id", tech.id)
      .not("opt_in_at", "is", null);

    // 4. Log audit
    await logAudit({
      action: "ADMIN_OVERRIDE",
      entityType: "profile",
      entityId: tech.id,
      metadata: {
        tech_map_id: mapId,
        action: "purge_lockout",
        timestamp: now.toISOString()
      }
    });

    return NextResponse.json({ success: true, message: "Lockout purged and grace period reset." });
  } catch (error: any) {
    console.error("Admin Override Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
