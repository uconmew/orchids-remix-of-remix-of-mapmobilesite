"use client";

import { JobLocation } from "@/lib/map-locations";

interface JobPulseMarkerProps {
  job: JobLocation;
}

export default function JobPulseMarker({ job }: JobPulseMarkerProps) {
  return (
    <div className="relative group">
      {/* Pulsing rings */}
      <div className="absolute -inset-4 bg-primary/30 rounded-full animate-ping opacity-75" />
      <div className="absolute -inset-2 bg-primary/20 rounded-full animate-pulse" />
      
      {/* Center dot */}
      <div className="relative w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg" />
      
      {/* Label (visible on hover) */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="text-xs font-bold text-white">{job.city}</div>
        <div className="text-[10px] text-zinc-400">{job.service}</div>
      </div>
    </div>
  );
}
