"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MapPin, ChevronDown, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] md:min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 z-0 bg-background">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-8 md:mb-12"
        >
          <MapPin className="h-3 w-3" /> Denver Metro&apos;s #1 Mobile Installer
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-4xl aspect-[2/1] mb-6 md:mb-8"
        >
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/project-uploads/b6d040d1-fad3-40b6-acb5-529a409fa8e6/PENUP_20260106_122704-resized-1767728177530.webp?width=1200&height=600&resize=contain"
              alt="MAPmobile Logo"
              fill
              className="object-contain"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
        </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 md:mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button asChild size="lg" className="blue-gradient h-14 md:h-16 px-8 md:px-12 text-base md:text-xl font-black uppercase tracking-widest text-black shadow-2xl shadow-primary/40 rounded-2xl group w-full sm:w-auto">
              <Link href="/book" className="flex items-center justify-center gap-3">
                Get Free Quote
                <ChevronDown className="h-5 w-5 group-hover:translate-y-1 transition-transform" />
              </Link>
            </Button>
              <Button asChild variant="outline" size="lg" className="h-14 md:h-16 border-foreground/10 bg-foreground/5 px-8 md:px-12 text-base md:text-xl font-black uppercase tracking-widest text-foreground backdrop-blur-sm rounded-2xl hover:bg-foreground/10 w-full sm:w-auto">
                <Link href="/installations">Install Packages</Link>
              </Button>
          </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 md:mt-20 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-8"
        >
          {[
            "Price Match Guarantee",
            "Licensed & Insured",
            "Denver Local Shop",
            "Family Owned",
            "100+ 5-Star Reviews"
          ].map((badge) => (
            <div key={badge} className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-foreground/50 text-center">{badge}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
