import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { detectVehicleType } from "@/lib/vehicle-type-detector";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: cityGroups, error: cityError } = await supabase
      .from("city_marker_groups")
      .select("name, longitude, latitude, radius");

    if (cityError) {
      console.error("City Marker Groups Error:", cityError);
      // Fallback city map if table is missing or cache error
      const fallbackCities = [
        { name: "Denver", longitude: -104.9903, latitude: 39.7392, radius: 25 },
        { name: "Boulder", longitude: -105.2705, latitude: 40.015, radius: 18 },
        { name: "Aurora", longitude: -104.8319, latitude: 39.7294, radius: 22 },
        { name: "Lakewood", longitude: -105.0814, latitude: 39.7047, radius: 15 },
        { name: "Arvada", longitude: -105.0875, latitude: 39.8028, radius: 14 },
        { name: "Westminster", longitude: -105.0372, latitude: 39.8367, radius: 17 },
        { name: "Thornton", longitude: -104.9719, latitude: 39.868, radius: 13 },
        { name: "Centennial", longitude: -104.8769, latitude: 39.5807, radius: 20 },
        { name: "Castle Rock", longitude: -104.8561, latitude: 39.3722, radius: 12 },
        { name: "Parker", longitude: -104.7611, latitude: 39.5186, radius: 16 }
      ];
      return processJobs(fallbackCities);
    }

    return processJobs(cityGroups || []);
  } catch (error) {
    console.error("Map Data API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function processJobs(cityGroups: any[]) {
  const cityMap = cityGroups.reduce((acc: any, city: any) => {
    acc[city.name.toLowerCase()] = {
      coords: [city.longitude, city.latitude],
      radius: city.radius
    };
    return acc;
  }, {});

  const denverCoords = cityMap["denver"]?.coords || [-104.9903, 39.7392];

    const addJitter = (coords: [number, number]): [number, number] => {
    // 0.08 degrees is approximately 5.5 miles in Colorado latitude
    const r = 0.08 * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const jitterLng = r * Math.cos(theta);
    const jitterLat = r * Math.sin(theta);
    return [coords[0] + jitterLng, coords[1] + jitterLat];
  };

  const getServiceHourTime = (date: Date) => {
    const d = new Date(date);
    const hour = d.getHours();
    // 9 AM to 6 PM (18:00)
    if (hour < 9 || hour >= 18) {
      d.setHours(9 + Math.floor(Math.random() * 9)); // 9 AM to 5:59 PM
      d.setMinutes(Math.floor(Math.random() * 60));
    }
    return d.toISOString();
  };

  const generateUniqueNotes = (job: any) => {
    const attributes = [
      "Precision integration with factory harnesses.",
      "Calibrated for optimal acoustic performance.",
      "Weather-sealed connections for long-term reliability.",
      "Hidden wiring architecture for a clean OEM look.",
      "Advanced telemetry calibration completed.",
      "Seamless interface with existing vehicle controls.",
      "Phase-aligned audio staging for superior imaging.",
      "High-current power distribution system verified.",
      "Digital signal processing tuned to vehicle acoustics.",
      "Stealth mounting solution for minimalist aesthetic."
    ];
    
    const index = (parseInt(job.id.replace(/-/g, '').substring(0, 4), 16)) % attributes.length;
    return attributes[index];
  };

  // Explicitly select columns to avoid PGRST200 relationship errors with vehicle_id/address_id
    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status, service_address, longitude, latitude, vehicle_year, vehicle_make, vehicle_model, install_type, start_time, elapsed_time, technician_notes, payment_status, created_at, updated_at, booking_date, assigned_tech_id")
      .order("updated_at", { ascending: false });

  if (bookingError) throw bookingError;

  const formattedJobs = (bookings || []).map((job: any) => {
    const knownCities = Object.keys(cityMap);
    let rawCity = "";
    
    if (job.service_address) {
      const addrLower = job.service_address.toLowerCase();
      const foundCity = knownCities.find(city => addrLower.includes(city));
      if (foundCity) {
        rawCity = foundCity;
      } else {
        const parts = job.service_address.split(",");
        rawCity = parts.length >= 2 ? parts[parts.length - 2].trim() : job.service_address.trim();
      }
    }
    
    if (!rawCity || rawCity.length < 2) {
      rawCity = "Denver";
    }
    
    const cityKey = rawCity.toLowerCase();
    const cityData = cityMap[cityKey] || cityMap["denver"];
    const cityCoords = cityData?.coords || denverCoords;

    const displayCity = rawCity.charAt(0).toUpperCase() + rawCity.slice(1).toLowerCase();

    const baseCoords: [number, number] = job.longitude && job.latitude 
      ? [Number(job.longitude), Number(job.latitude)] 
      : cityCoords;
    
    const isInstalled = job.status === 'completed' || job.status === 'installed';
    const isActive = job.status === 'in_progress';
    const isBooked = job.status === 'pending' || (job.status === 'confirmed' && !job.assigned_tech_id);
    
    const finalCoords = (isInstalled || isActive || isBooked) ? addJitter(baseCoords) : baseCoords;
    
    const carInfo = [job.vehicle_year, job.vehicle_make, job.vehicle_model].filter(Boolean).join(" ");
    const serviceName = job.install_type || "Installation";
    
    const formattedTitle = `${displayCity} | ${carInfo || "Customer Vehicle"} | ${serviceName}`;

    let elapsedTime = "0m";
    if (job.status === 'in_progress' && job.start_time) {
      elapsedTime = `${Math.round((Date.now() - new Date(job.start_time).getTime()) / 60000)}m`;
    } else if (job.elapsed_time) {
      elapsedTime = `${job.elapsed_time}m`;
    }

    const updatedAt = getServiceHourTime(new Date(job.updated_at || job.created_at));

    return {
      id: job.id,
      city: displayCity,
      state: "CO",
      service: serviceName,
      car: carInfo || "Customer Vehicle",
      title: formattedTitle,
      vehicleType: detectVehicleType(job.vehicle_model || ""),
      status: job.status,
      paymentStatus: job.payment_status,
      createdAt: job.created_at,
      updatedAt: updatedAt,
      bookingDate: job.booking_date,
      elapsedTime: elapsedTime,
      technicianNotes: job.technician_notes || generateUniqueNotes(job),
      coordinates: finalCoords,
      isInstall: isInstalled,
      isActive: isActive,
      isBooked: isBooked
    };
  });

  const totalInstalledCount = formattedJobs.filter(j => j.isInstall).length;
  const liveJobs = formattedJobs.filter(j => j.isActive);
  const bookedJobs = formattedJobs.filter(j => j.isBooked);
  const completedJobs = formattedJobs.filter(j => j.isInstall);

  return NextResponse.json({
    totalInstalls: totalInstalledCount,
    completedJobs: completedJobs,
    activeJobs: liveJobs,
    bookedJobs: bookedJobs,
    mostRecentJob: completedJobs[0] || null,
    serviceCities: cityGroups.map(city => ({
      name: city.name,
      coordinates: [city.longitude, city.latitude],
      radius: city.radius
    }))
  });
}
