"use client";

import React from "react";
import { MapPin, Globe } from "lucide-react";

export default function AreasSection() {
  const primaryAreas = [
    "Denver, Aurora & Lakewood",
    "Arvada, Westminster & Thornton",
    "Centennial, Littleton & Englewood",
    "Highlands Ranch & Castle Rock",
  ];

  return (
    <section className="w-full px-[1rem] sm:px-[1.5rem] lg:px-[2rem]">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-[0.5rem] md:gap-[2rem]">
          {/* Primary Areas */}
          <div className="blue-gradient rounded-[1.5rem] md:rounded-[3rem] p-[1rem] md:p-[2.5rem] relative overflow-hidden flex flex-col justify-between border border-white/10 shadow-xl shadow-primary/20">
            <div className="relative z-10">
              <h2 className="text-[0.5rem] md:text-[0.75rem] font-black uppercase tracking-[0.2em] md:tracking-[0.5em] text-white/70 mb-[0.25rem] md:mb-[1rem]">Service Coverage</h2>
              <h3 className="text-[0.8rem] sm:text-[1.5rem] md:text-[2.5rem] lg:text-[3.5rem] font-black uppercase italic text-white leading-[0.9] mb-[0.5rem] md:mb-[2rem]">Primary Areas</h3>
              <ul className="space-y-[0.25rem] md:space-y-[0.75rem]">
                {primaryAreas.map((area, index) => (
                  <li key={index} className="flex items-center gap-[0.25rem] md:gap-[0.75rem] text-white">
                    <MapPin className="h-[0.5rem] w-[0.5rem] md:h-[1.25rem] md:w-[1.25rem] text-white/50 shrink-0" />
                    <span className="font-bold uppercase text-[0.45rem] sm:text-[0.6rem] md:text-[1rem] lg:text-[1.125rem] tracking-widest leading-tight">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute -right-[2rem] -bottom-[2rem] w-[4rem] h-[4rem] md:w-[12rem] md:h-[12rem] bg-white/5 rounded-full blur-[2rem]" />
          </div>

          {/* Extended Areas */}
          <div className="bg-white/5 rounded-[1.5rem] md:rounded-[3rem] p-[1rem] md:p-[2.5rem] relative overflow-hidden flex flex-col justify-between border border-white/10 shadow-lg">
            <div className="relative z-10">
              <h2 className="text-[0.5rem] md:text-[0.75rem] font-black uppercase tracking-[0.2em] md:tracking-[0.5em] text-primary mb-[0.25rem] md:mb-[1rem]">Service Coverage</h2>
              <h3 className="text-[0.8rem] sm:text-[1.5rem] md:text-[2.5rem] lg:text-[3.5rem] font-black uppercase italic text-foreground leading-[0.9] mb-[0.5rem] md:mb-[2rem]">Extended Areas</h3>
              <p className="font-bold uppercase text-[0.45rem] sm:text-[0.6rem] md:text-[1rem] lg:text-[1.125rem] tracking-[0.05em] md:tracking-widest text-foreground/60 leading-relaxed max-w-[15rem]">
                We cover the entire Front Range. Outside our primary zone? A small travel fee may apply based on distance.
              </p>
            </div>
            <div className="flex items-center gap-[0.5rem] mt-[1rem]">
              <div className="h-[1px] flex-1 bg-primary/20" />
              <Globe className="h-[0.75rem] w-[0.75rem] md:h-[1.5rem] md:w-[1.5rem] text-primary animate-pulse" />
              <div className="h-[1px] flex-1 bg-primary/20" />
            </div>
            <div className="absolute -right-[2rem] -bottom-[2rem] w-[4rem] h-[4rem] md:w-[12rem] md:h-[12rem] bg-primary/5 rounded-full blur-[2rem]" />
          </div>
        </div>
      </div>
    </section>
  );
}
