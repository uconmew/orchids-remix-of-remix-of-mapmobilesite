"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Radio, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent successfully! Our technicians will get back to you soon.");
  };

    const faqs = [
      {
        q: "Do you really come to me in Denver?",
        a: "Absolutely! We cover the entire Denver Metro area, including Aurora, Lakewood, Arvada, and more. We bring all our tools and equipment to your home, office, marina, or any location that's convenient for you."
      },
      {
        q: "How long does installation take?",
        a: "Most installations are completed in 2-4 hours depending on the complexity. We'll give you an accurate time estimate with your quote."
      },
      {
        q: "What if I find a lower price in the Front Range?",
        a: "Bring us the quote! We'll match or beat any legitimate competitor's price in the Denver Metro area. We're committed to being the best value in Colorado."
      },
      {
        q: "Are you licensed and insured?",
        a: "Yes! We're fully licensed, insured, and bonded to operate throughout the Denver Metro. Your vehicle and property are protected."
      },
      {
        q: "Can you install on boats at local marinas?",
        a: "Yes! We specialize in marine electronics installation and can meet you at Cherry Creek, Chatfield, or any other local marina."
      }
    ];

    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-sm font-bold uppercase tracking-widest text-primary">Contact MAPmobile</h1>
          <h2 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl uppercase text-primary">GET A FREE QUOTE</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/60">
            Ready to upgrade your vehicle or boat in the Denver Metro? Reach out for a price match guaranteed quote. We come directly to you.
          </p>
        </div>

      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 rounded-3xl border border-white/10"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-primary/70">Full Name</label>
                <Input placeholder="John Doe" className="bg-white/5 border-white/10 h-12" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-primary/70">Email Address</label>
                <Input type="email" placeholder="john@example.com" className="bg-white/5 border-white/10 h-12" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-primary/70">Vehicle / Boat Info</label>
              <Input placeholder="2022 Ford F-150 / Grady-White 25" className="bg-white/5 border-white/10 h-12" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-primary/70">Message / Service Needs</label>
              <Textarea placeholder="Tell us about the audio, security, or marine upgrade you're looking for..." className="bg-white/5 border-white/10 min-h-[150px]" required />
            </div>
            <Button type="submit" className="w-full blue-gradient text-white border-none h-14 text-lg font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20">
              <Send className="h-5 w-5" />
              Request Quote
            </Button>
          </form>
        </motion.div>

        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center space-y-8"
          >
            <div className="flex items-start gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xl font-black uppercase tracking-tight">Call / Text Us</h4>
                <p className="mt-1 text-foreground/60">Mon-Sat: 9am - 6pm</p>
                <p className="mt-2 text-2xl font-black text-primary">(555) 123-4567</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MapPin className="h-6 w-6" />
              </div>
                <div>
                  <h4 className="text-xl font-black uppercase tracking-tight">Service Area</h4>
                  <p className="mt-1 text-foreground/60">We come to your home, office, or marina</p>
                  <p className="mt-2 text-2xl font-black text-primary">Denver Metro Area</p>
                </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
              <HelpCircle className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="glass-card rounded-xl border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between p-4 text-left font-bold"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="p-4 pt-0 text-sm text-foreground/60 leading-relaxed border-t border-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
