import { supabase } from "./supabase";

export interface Slot {
  time: string;
  available: boolean;
}

export async function getAvailableSlots(date: Date): Promise<Slot[]> {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay();

  // 1. Get Override
  const { data: override } = await supabase
    .from("availability_overrides")
    .select("*")
    .eq("override_date", dateStr)
    .single();

  if (override?.is_blocked) {
    return [];
  }

  // 2. Get Settings
  let startTime = "09:00:00";
  let endTime = "17:00:00";
  let duration = 120;

    const { data: setting } = await supabase
      .from("availability_settings")
      .select("*")
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .single();

    if (!setting && !override) return []; // No settings and no override for this day

    if (override && override.start_time && override.end_time) {
      startTime = override.start_time;
      endTime = override.end_time;
    } else if (setting) {
      startTime = setting.start_time;
      endTime = setting.end_time;
    } else {
      return []; // Should not happen given the check above
    }

    duration = setting?.slot_duration_minutes || 120;


  // 3. Generate Slots
  const slots: string[] = [];
  let current = parseTime(startTime);
  const end = parseTime(endTime);

  while (current + duration <= end) {
    const slotStart = formatTime(current);
    const slotEnd = formatTime(current + duration);
    slots.push(`${slotStart} - ${slotEnd}`);
    current += duration;
  }

  // 4. Filter booked slots
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("scheduled_time, payment_status, expires_at, arrival_fee_paid")
    .gte("booking_date", startOfDay.toISOString())
    .lte("booking_date", endOfDay.toISOString())
    .not("status", "eq", "CANCELLED");

  const now = new Date();
  const bookedTimes = bookings
    ?.filter(b => {
      // Slot is blocked only if:
      // 1. It's not a "No Installation" booking
      const hasInstallation = b.scheduled_time !== 'No Installation';
      
      // 2. AND it's either:
      //    a. Fully paid
      //    b. Arrival fee paid (for pay-on-arrival)
      //    c. Still within the 5-minute hold window
      const isPaid = b.payment_status === 'paid';
      const isArrivalFeePaid = b.arrival_fee_paid === true;
      const isCurrentlyHeld = b.expires_at && new Date(b.expires_at) > now;

      return hasInstallation && (isPaid || isArrivalFeePaid || isCurrentlyHeld);
    })
    .map(b => b.scheduled_time) || [];
  const isToday = date.toDateString() === now.toDateString();

  return slots.map(time => {
    let available = !bookedTimes.includes(time);
    
    if (isToday && available) {
      const [slotStart] = time.split(' - ');
      const [timePart, period] = slotStart.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      const slotTime = new Date(date);
      slotTime.setHours(hours, minutes, 0, 0);
      
      if (slotTime < now) {
        available = false;
      }
    }

    return {
      time,
      available
    };
  });
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutesTotal: number): string {
  const hours = Math.floor(minutesTotal / 60);
  const mins = minutesTotal % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
}
