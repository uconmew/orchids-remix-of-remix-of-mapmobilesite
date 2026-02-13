"use client";

import React, { useState } from "react";
import { Mail } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("Thanks for subscribing! We'll keep you updated on Denver Metro specials.");
      setEmail("");
    }
  };

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-2xl md:rounded-[3rem] border border-white/10">
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1549221540-348633c7f96c?q=80&w=1200&auto=format&fit=crop"
              alt="Denver Skyline at Dusk"
              fill
              className="object-cover opacity-20 brightness-[0.3]"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          </div>
          
          <div className="relative z-10 p-6 sm:p-10 md:p-12 lg:p-20 flex flex-col lg:flex-row items-center gap-8 md:gap-12 text-center lg:text-left">
            <div className="flex-1 space-y-4 md:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                <Mail className="h-3 w-3" /> Denver Insider
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black uppercase italic leading-none">Stay Ahead <br />Of The Curve</h3>
              <p className="text-sm sm:text-base md:text-xl text-foreground/60 font-medium max-w-xl mx-auto lg:mx-0">
                Get exclusive Denver Metro deals, pro tech tips, and be the first to know about our new mobile installation services.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex-1 w-full max-w-md">
              <div className="glass-card p-2 rounded-xl md:rounded-2xl flex flex-col sm:flex-row gap-2 border-white/10 shadow-2xl">
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-10 md:h-12 px-4 rounded-lg md:rounded-xl bg-transparent border-none focus:ring-0 outline-none font-bold text-xs md:text-sm"
                />
                <Button type="submit" size="lg" className="blue-gradient h-10 md:h-12 px-4 md:px-8 rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs">
                  Subscribe
                </Button>
              </div>
              <p className="mt-3 md:mt-4 text-[9px] md:text-[10px] text-foreground/40 font-bold uppercase tracking-widest">
                No spam. Just Denver automotive & marine excellence.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
