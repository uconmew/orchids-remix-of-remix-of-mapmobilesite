"use client";

import React from "react";
import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Get A Quote",
    desc: "Call, text, or fill out our form. Tell us what you want and we'll provide a free, no-obligation quote."
  },
  {
    step: "02",
    title: "Schedule",
    desc: "Choose a time that works for you. We come to your Denver home, office, or preferred location."
  },
  {
    step: "03",
    title: "Installation",
    desc: "Our professional team arrives with all tools. Most jobs done in 2-4 hours while you go about your day."
  },
  {
    step: "04",
    title: "Enjoy Upgrade",
    desc: "We test everything, clean up, and show you how to use your new electronics. You're ready to go!"
  }
];

export default function ProcessSection() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-primary mb-4">The Process</h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black uppercase italic">Simple, Fast, Professional</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 hidden lg:block" />
          {steps.map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="glass-card p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5 relative z-10"
            >
              <span className="text-4xl md:text-6xl font-black text-primary/10 absolute top-4 right-4 leading-none">{item.step}</span>
              <h4 className="text-lg md:text-2xl font-black mb-2 md:mb-4 uppercase italic pr-8">{item.title}</h4>
              <p className="text-sm md:text-base text-foreground/60 font-medium leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
