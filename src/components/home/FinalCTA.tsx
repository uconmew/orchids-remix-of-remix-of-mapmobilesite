"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Smartphone, HelpCircle } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
          <div className="blue-gradient p-8 sm:p-12 md:p-16 lg:p-24 rounded-2xl sm:rounded-3xl md:rounded-[4rem] text-black shadow-2xl shadow-primary/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
              <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-8xl font-black tracking-tight uppercase italic leading-none z-10 relative text-center">
                LEVEL UP YOUR <br /> WHIP TODAY
              </h2>
            <p className="mt-4 sm:mt-6 md:mt-8 text-black/70 text-sm sm:text-base md:text-xl font-medium max-w-2xl mx-auto z-10 relative text-center px-2">
              Professional mobile installation is just a few clicks away. We&apos;re ready to bring the shop to your Denver door.
            </p>
            <div className="mt-6 sm:mt-8 md:mt-12 flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-6 sm:flex-row z-10 relative">
              <Button asChild size="lg" className="bg-black text-[#50ceeb] hover:bg-black/90 h-12 sm:h-14 md:h-16 px-6 sm:px-10 md:px-16 text-sm sm:text-base md:text-xl font-black uppercase tracking-widest rounded-xl md:rounded-2xl shadow-xl w-full sm:w-auto">
                <Link href="/book">Book Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 sm:h-14 md:h-16 border-black/30 bg-black/10 px-6 sm:px-10 md:px-16 text-sm sm:text-base md:text-xl font-black uppercase tracking-widest backdrop-blur-md hover:bg-black/20 rounded-xl md:rounded-2xl w-full sm:w-auto">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
            <div className="mt-6 sm:mt-8 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-black/50 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[8px] sm:text-[10px] z-10 relative">
              <span className="flex items-center gap-2"><Smartphone className="h-3 w-3 sm:h-4 sm:w-4" /> TEXT FOR QUOTE</span>
              <span className="hidden sm:block">•</span>
              <span className="flex items-center gap-2"><HelpCircle className="h-3 w-3 sm:h-4 sm:w-4" /> 24/7 SUPPORT</span>
            </div>
          </div>
      </div>
    </section>
  );
}
