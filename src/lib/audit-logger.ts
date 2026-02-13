import { supabase } from "./supabase";

export type ActivityAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'REMOVE_STAFF' 
  | 'RESTORE_STAFF'
  | 'UPDATE_ROLE'
  | 'PROCESS_PAYMENT'
  | 'UPDATE_BOOKING'
  | 'UPDATE_STATUS'
  | 'PURCHASE'
  | 'PROFILE_EDIT'
  | 'VEHICLE_EDIT'
  | 'ADDRESS_CHANGE'
  | 'PASSWORD_RESET'
  | 'EMAIL_UPDATE'
  | 'PRODUCT_RETURN';

export type EntityType = 
  | 'profile' 
  | 'product' 
  | 'service' 
  | 'booking' 
  | 'payment' 
  | 'customer'
  | 'staff'
  | 'vehicle'
  | 'address'
  | 'order';

interface LogOptions {
  performedBy?: string;
  action: ActivityAction | string;
  entityType: EntityType | string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export async function logAudit({
  performedBy,
  action,
  entityType,
  entityId,
  metadata
}: LogOptions) {
  try {
    // If performedBy is not provided, try to get the current user
    let userId = performedBy;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }

      if (!userId) {
        console.warn("Could not log audit: No user ID found.");
        return;
      }

      // Fetch performer's map_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("map_id")
        .eq("id", userId)
        .single();

      const { error } = await supabase
        .from("audits")
        .insert({
          performed_by: userId,
          performer_map_id: profile?.map_id,
          action,
          entity_type: entityType,
          entity_id: entityId,
          metadata
        });

    if (error) throw error;
  } catch (error) {
    console.error("Error logging audit:", error);
  }
}

// Keep logActivity for compatibility but point to logAudit
export const logActivity = logAudit;
