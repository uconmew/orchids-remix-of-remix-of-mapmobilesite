"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap } from "lucide-react";

export default function PriceMatchSection() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="blue-gradient rounded-2xl md:rounded-[3.5rem] p-6 sm:p-8 md:p-12 lg:p-24 relative overflow-hidden flex flex-col lg:flex-row items-center gap-8 md:gap-16 shadow-2xl shadow-primary/30">
          <div className="flex-1 space-y-6 md:space-y-8 z-10 text-center lg:text-left">
            <div>
              <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-white/70 mb-2 md:mb-4">Value Proposition</h2>
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-7xl font-black uppercase italic text-white leading-[0.9]">Our Price Match Promise</h3>
            </div>
            <p className="text-base md:text-xl text-white/80 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              We believe in fair, honest pricing. As a local Denver mobile business, we don&apos;t have the overhead costs of expensive storefronts, so we can beat traditional shop prices.
            </p>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
              {[
                "Match or beat Denver shops",
                "Same quality installation",
                "No hidden fees or surprises",
                "Transparent pricing, every time"
              ].map((text) => (
                <div key={text} className="flex items-center gap-2 md:gap-3 text-white justify-start">
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-white/50 shrink-0" />
                  <span className="font-bold uppercase text-[10px] md:text-xs tracking-widest">{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/3 w-full space-y-4 md:space-y-6 z-10">
            <div className="glass-card p-6 md:p-8 rounded-2xl md:rounded-3xl bg-white/10 border-white/20 backdrop-blur-xl">
              <h4 className="text-base md:text-xl font-black uppercase italic text-white mb-4 md:mb-6">Why We&apos;re Cheaper:</h4>
              <ul className="space-y-3 md:space-y-4 text-white/80 font-bold text-xs md:text-sm uppercase tracking-widest">
                <li className="flex items-center gap-2 md:gap-3"><Zap className="h-3 w-3 md:h-4 md:w-4 shrink-0" /> No retail storefront</li>
                <li className="flex items-center gap-2 md:gap-3"><Zap className="h-3 w-3 md:h-4 md:w-4 shrink-0" /> Lower overhead costs</li>
                <li className="flex items-center gap-2 md:gap-3"><Zap className="h-3 w-3 md:h-4 md:w-4 shrink-0" /> Direct supplier relationships</li>
                <li className="flex items-center gap-2 md:gap-3"><Zap className="h-3 w-3 md:h-4 md:w-4 shrink-0" /> Efficient mobile operations</li>
              </ul>
            </div>
            <Button asChild size="lg" className="w-full bg-white text-primary hover:bg-white/90 h-12 md:h-16 text-base md:text-xl font-black uppercase tracking-widest rounded-xl md:rounded-2xl">
              <Link href="/book">Get Your Quote Today</Link>
            </Button>
          </div>
          
          <div className="absolute -right-24 -bottom-24 w-48 h-48 md:w-96 md:h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
      </div>
    </section>
  );
}
