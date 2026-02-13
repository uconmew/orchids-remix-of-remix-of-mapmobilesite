"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Zap, MapPin, DollarSign, Users } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-sm font-bold uppercase tracking-widest text-primary">About MAPmobile</h1>
          <h2 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl uppercase text-primary">Denver Metro's Mobile Pros</h2>
          <p className="mt-6 text-lg text-foreground/60 leading-relaxed">
            MAPmobile: Mobile Automotive Pro was founded in the heart of Colorado with a single mission: to provide high-end electronics installations with the convenience of a mobile service. We serve the entire Denver Metro area, from Fort Collins to Castle Rock.
          </p>
          <p className="mt-4 text-lg text-foreground/60 leading-relaxed">
            As a locally owned Denver business, we pride ourselves on building relationships within our community. By operating as a fully mobile service across the Front Range, we eliminate the overhead costs of a traditional storefront and pass those savings directly to you.
          </p>
          
          <div className="mt-10 grid grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h4 className="font-bold uppercase text-xs tracking-widest">Lifetime Warranty</h4>
                <p className="text-sm text-foreground/60">Labor is guaranteed for life.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h4 className="font-bold uppercase text-xs tracking-widest">Price Match</h4>
                <p className="text-sm text-foreground/60">We beat competitor quotes.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative h-[500px] overflow-hidden rounded-3xl"
        >
          <Image
            src="https://images.unsplash.com/photo-1616432043562-3671ea2e5242?q=80&w=1000&auto=format&fit=crop"
            alt="Audio installation in progress"
            fill
            className="object-cover"
          />
        </motion.div>
      </div>

      <section className="mt-32 rounded-3xl blue-gradient p-16 text-white text-center shadow-2xl shadow-primary/20">
        <h2 className="text-3xl font-black uppercase tracking-widest">OUR COMMITMENT</h2>
        <p className="mx-auto mt-6 max-w-3xl text-xl text-white/80 italic font-medium">
          "To redefine vehicle and marine electronics integration by delivering precision workmanship, premium components, and unparalleled convenience directly to our clients."
        </p>
      </section>

      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div className="flex flex-col items-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MapPin className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold uppercase tracking-tight">We Come To You</h3>
          <p className="mt-2 text-foreground/60">Installation at your home, office, or dock. No waiting rooms, no hassle.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Zap className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold uppercase tracking-tight">Expert Service</h3>
          <p className="mt-2 text-foreground/60">Experienced professionals specializing in cars, trucks, and marine electronics.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold uppercase tracking-tight">Locally Owned</h3>
          <p className="mt-2 text-foreground/60">Supporting the local economy with personalized, community-focused service.</p>
        </div>
      </div>

      <section className="mt-32 text-center space-y-8">
        <h2 className="text-4xl md:text-6xl font-black uppercase italic leading-none">READY TO UPGRADE <br /> YOUR DRIVE?</h2>
        <p className="text-xl text-foreground/60 font-medium max-w-2xl mx-auto">
          Whether it's a car, truck, or boat, we bring the shop to you. Professional mobile installation across the entire Denver Metro.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
          <Button asChild size="lg" className="blue-gradient h-16 px-12 text-xl font-black uppercase tracking-widest text-white shadow-2xl shadow-primary/40 rounded-2xl">
            <Link href="/book">Book Now</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-16 border-white/10 bg-white/5 px-12 text-xl font-black uppercase tracking-widest backdrop-blur-sm rounded-2xl hover:bg-white/10">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
