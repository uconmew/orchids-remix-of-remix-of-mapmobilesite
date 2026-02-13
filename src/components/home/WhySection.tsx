"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, X, Home, ShieldCheck, Anchor, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    name: "Location",
    traditional: "You drive to them, twice.",
    MAPmobile: "We come to your home or office.",
  },
  {
    name: "Wait Time",
    traditional: "Hours in a cramped lobby.",
    MAPmobile: "Zero. Stay productive or relax at home.",
  },
  {
    name: "Scheduling",
    traditional: "Limited by shop hours.",
    MAPmobile: "Flexible on-site appointments.",
  },
  {
    name: "Marine/RV",
    traditional: "Requires difficult towing.",
    MAPmobile: "We meet you at the dock or storage.",
  },
  {
    name: "The Result",
    traditional: "Standard Service.",
    MAPmobile: "Installations Delivered.",
  },
];

  const advantages = [
    {
      icon: <Home className="w-6 h-6 text-[#50ceeb]" />,
      title: "Convenience at Your Curb",
      description: "Whether it's a remote start in your driveway or a GPS fleet install at your job site, we work where you are.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#50ceeb]" />,
      title: "Certified Expertise",
      description: "As Mobile Auto Pros, we are fully licensed and insured, providing shop-quality precision with mobile flexibility.",
    },
    {
      icon: <Anchor className="w-6 h-6 text-[#50ceeb]" />,
      title: "Land & Sea Versatility",
      description: "From Denver's winter-ready trucks to summer-ready marine audio at the reservoir, we handle it all.",
    },
    {
      icon: <Heart className="w-6 h-6 text-[#50ceeb]" />,
      title: "Family-Owned Integrity",
      description: "We treat your vehicle like our own. No \"big box\" shortcuts—just professional-grade craftsmanship.",
    },
  ];

const steps = [
  { step: "Step 1", title: "Choose your electronics." },
  { step: "Step 2", title: "Pick your time and place." },
  { step: "Step 3", title: "Installations Delivered." },
];

export default function WhySection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#50ceeb]/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-[#50ceeb] mb-4"
          >
            Why Choose MAPmobile?
          </motion.h2>
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-black uppercase italic mb-8"
          >
            The Shop Experience—Without the Shop.
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-foreground/60 font-medium leading-relaxed"
          >
            At <span className="text-[#50ceeb] font-bold italic">MAPmobile</span>: Mobile Auto Pros & Co, we believe you shouldn't have to rearrange your life to upgrade your vehicle. We've traded the traditional waiting room for a professional, fully-equipped mobile service that brings the expertise directly to you.
          </motion.p>
        </div>

        {/* Comparison Section - Responsive Table */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mb-24 overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-sm shadow-2xl"
        >
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/40">Feature</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/40">Traditional Retail Shops</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-[#50ceeb] bg-[#50ceeb]/5">MAPmobile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {features.map((feature, i) => (
                  <tr key={feature.name} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="p-8">
                      <span className="text-sm font-black uppercase tracking-wider text-white">{feature.name}</span>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-3">
                        <X className="w-4 h-4 text-red-500/50 shrink-0" />
                        <span className="text-sm text-white/40 font-medium">{feature.traditional}</span>
                      </div>
                    </td>
                    <td className="p-8 bg-[#50ceeb]/[0.02]">
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-[#50ceeb] shrink-0" />
                        <span className="text-sm text-white font-bold">{feature.MAPmobile}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Comparison View (Responsive Chart) */}
          <div className="md:hidden p-4 space-y-6">
            {features.map((feature, i) => (
              <div key={feature.name} className="space-y-3 bg-black/40 border border-white/5 rounded-3xl p-5 shadow-lg">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#50ceeb] border-b border-white/10 pb-2 flex items-center justify-between">
                  {feature.name}
                  <ArrowRight className="w-3 h-3 opacity-40" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5 border border-red-500/20">
                      <X className="w-3 h-3 text-red-500/60" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] font-black uppercase tracking-tighter text-white/20">Traditional Shop</div>
                      <span className="text-xs text-white/40 font-medium leading-tight block">{feature.traditional}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-[#50ceeb]/5 p-3 rounded-2xl border border-[#50ceeb]/10">
                    <div className="w-5 h-5 rounded-full bg-[#50ceeb]/20 flex items-center justify-center shrink-0 mt-0.5 border border-[#50ceeb]/30">
                      <Check className="w-3 h-3 text-[#50ceeb]" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] font-black uppercase tracking-tighter text-[#50ceeb]/60">MAPmobile</div>
                      <span className="text-xs text-white font-bold leading-tight block italic">{feature.MAPmobile}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* The MAPmobile Advantage */}
        <div className="mb-24">
          <motion.h4 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-black uppercase italic text-center mb-12"
          >
            The MAPmobile Advantage
          </motion.h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {advantages.map((adv, i) => (
              <motion.div
                key={adv.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-[#50ceeb]/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#50ceeb]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {React.cloneElement(adv.icon as React.ReactElement, { className: "w-6 h-6 text-[#50ceeb]" })}
                </div>
                <h5 className="text-lg font-black uppercase italic mb-3 text-white">{adv.title}</h5>
                <p className="text-sm text-white/50 font-medium leading-relaxed">{adv.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Ready to Upgrade? */}
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-[3rem] bg-gradient-to-br from-[#50ceeb] to-[#008ba3] shadow-2xl relative overflow-hidden text-center"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

            <h4 className="text-2xl md:text-4xl font-black uppercase italic text-white mb-12 relative z-10">
              Ready to Upgrade?
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 relative z-10">
              {steps.map((step, i) => (
                <div key={step.step} className="flex flex-col items-center">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">{step.step}</div>
                  <div className="text-lg font-bold text-white uppercase italic">{step.title}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Button asChild size="lg" className="h-14 px-10 bg-white text-[#50ceeb] hover:bg-white/90 text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl border-none">
                <Link href="/book" className="flex items-center gap-2">
                  Get Started Now <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
