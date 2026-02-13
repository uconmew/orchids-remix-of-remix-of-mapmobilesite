"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Michael R.",
    service: "Remote Start Installation",
    text: "Best decision ever! They came to my office parking lot in Aurora and installed a remote start while I worked. Done in 2 hours and beat the dealer's price by $200."
  },
  {
    name: "Sarah K.",
    service: "Marine Audio System",
    text: "Finally found someone who does marine electronics! They came to my dock at Chatfield and installed a new stereo system. Professional, affordable, and convenient."
  },
    {
      name: "Jennifer L.",
      service: "Backup Camera Upgrade",
      text: "As a mom in Highlands Ranch, I couldn't be without my car for days. MAPmobile came to my house during naptime and installed a backup camera. So convenient!"
    }
];

export default function TestimonialsSection() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-primary mb-4">Social Proof</h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black uppercase italic">Don&apos;t take our word for it</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:gap-8 md:grid-cols-3">
          {testimonials.map((item, idx) => (
            <motion.div 
              key={item.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] text-left border border-white/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex text-primary mb-4 md:mb-6 gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 md:h-5 md:w-5 fill-current" />)}
                </div>
                <p className="italic text-base md:text-lg text-foreground/80 font-medium leading-relaxed mb-6 md:mb-8">
                  &quot;{item.text}&quot;
                </p>
              </div>
              <div className="flex items-center gap-3 md:gap-4 pt-4 md:pt-6 border-t border-white/5">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary italic text-sm md:text-base">
                  {item.name[0]}
                </div>
                <div>
                  <div className="font-black uppercase italic tracking-tight text-sm md:text-base">{item.name}</div>
                  <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-black">{item.service}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
