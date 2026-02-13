"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Music, Camera, Lightbulb, Zap, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const installationCategories = [
  {
    category: "Security & Convenience",
    icon: <Lock className="h-5 w-5 md:h-6 md:w-6" />,
    items: ["Remote Start Systems", "Car Alarms", "Keyless Entry", "GPS Tracking", "Kill Switches"],
    image: "https://images.unsplash.com/photo-1485463611174-f302f6a5c1c9?q=75&w=800&auto=format&fit=crop"
  },
  {
    category: "Audio & Entertainment",
    icon: <Music className="h-5 w-5 md:h-6 md:w-6" />,
    items: ["Car Stereos", "Subwoofers & Amps", "Speaker Upgrades", "Marine Audio", "System Tuning"],
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=75&w=800&auto=format&fit=crop"
  },
  {
    category: "Safety & Monitoring",
    icon: <Camera className="h-5 w-5 md:h-6 md:w-6" />,
    items: ["Backup Cameras", "Dash Cams", "360° Systems", "Parking Sensors", "Blind Spot Monitors"],
    image: "https://images.unsplash.com/photo-1508974239320-0a029497e820?q=75&w=800&auto=format&fit=crop"
  },
  {
    category: "Lighting & Accessories",
    icon: <Lightbulb className="h-5 w-5 md:h-6 md:w-6" />,
    items: ["LED Interior", "Underglow", "Light Bars", "Custom Lighting", "Accent Lights"],
    image: "https://images.unsplash.com/photo-1549399500-1448883ce301?q=75&w=800&auto=format&fit=crop"
  },
  {
    category: "Commercial & Specialty",
    icon: <Zap className="h-5 w-5 md:h-6 md:w-6" />,
    items: ["Emergency Sirens", "Fleet Electronics", "Marine Electronics", "RV Electronics", "Custom Projects"],
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=75&w=800&auto=format&fit=crop"
  }
];

export default function InstallationsSection() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl bg-white/5 py-12 md:py-24 rounded-2xl md:rounded-[3rem] border border-white/5">
        <div className="text-center mb-10 md:mb-16 px-4">
    <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-primary mb-4">Installation Sectors</h2>
    <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black uppercase italic mb-4 md:mb-6">Precision <span className="text-primary">Installations</span></h3>
    <p className="max-w-3xl mx-auto text-base md:text-xl text-foreground/60 font-medium px-4">
      We install ANY aftermarket electronic accessory for your car, truck, or boat. If it has a wire, we can install a solution.
    </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12 px-4 md:px-8">
          {installationCategories.map((item, idx) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-4 md:space-y-6 group"
            >
              <div className="relative aspect-video rounded-xl md:rounded-2xl overflow-hidden mb-4 md:mb-6 border border-white/5">
                <Image
                  src={item.image}
                  alt={item.category}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 flex items-center gap-2 md:gap-4">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-primary/20 backdrop-blur-md flex items-center justify-center text-primary border border-primary/20">
                    {item.icon}
                  </div>
                  <h4 className="text-sm md:text-xl font-black uppercase tracking-tight italic text-white">{item.category}</h4>
                </div>
              </div>
              <ul className="space-y-2 md:space-y-4">
                {item.items.map((subItem) => (
                  <li key={subItem} className="flex items-center gap-2 md:gap-3 text-sm md:text-base text-foreground/70 font-bold group/item">
                    <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-primary opacity-50 group-hover/item:opacity-100 transition-opacity shrink-0" />
                    {subItem}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 md:mt-20 text-center px-4">
          <p className="text-base md:text-xl font-black uppercase italic mb-6 md:mb-8">Custom hardware integration? We have the expertise.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="blue-gradient px-8 md:px-12 h-12 md:h-14 text-sm md:text-lg font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 group w-full sm:w-auto">
              <Link href="/installations">View All Protocols <Zap className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:scale-110 transition-transform" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 md:px-12 h-12 md:h-14 text-sm md:text-lg font-black uppercase tracking-widest rounded-xl border-white/10 hover:bg-white/5 w-full sm:w-auto">
              <Link href="/contact">Custom Quote</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
