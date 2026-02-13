"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
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
    q: "Do you install customer-owned gear?",
    a: "Yes! If it's an aftermarket electronic accessory for a car, truck, or boat, we can install it. From simple speakers to complex remote start systems - we do it all."
  },
  {
    q: "Are you licensed and insured in Colorado?",
    a: "Yes! We're fully licensed, insured, and bonded to operate throughout the Denver Metro. Your vehicle and property are protected."
  },
  {
    q: "Can you install on boats at Cherry Creek or Chatfield?",
    a: "Yes! We specialize in marine electronics installation and can meet you at local marinas or your storage facility."
  }
];

export default function FAQSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-primary mb-4">Got Questions?</h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black uppercase italic">Frequently Asked Questions</h3>
        </div>
        <div className="space-y-3 md:space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="glass-card rounded-xl md:rounded-2xl border border-white/5 overflow-hidden transition-all duration-300"
              style={{ borderColor: openFaq === idx ? 'rgba(0, 102, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)' }}
            >
              <button 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 md:p-6 text-left flex items-center justify-between group"
              >
                <span className="text-sm md:text-lg font-black uppercase italic tracking-tight group-hover:text-primary transition-colors pr-4">{faq.q}</span>
                <ChevronDown className={`h-4 w-4 md:h-5 md:w-5 text-primary transition-transform duration-300 shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              <motion.div
                initial={false}
                animate={{ height: openFaq === idx ? 'auto' : 0, opacity: openFaq === idx ? 1 : 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 md:p-6 pt-0 text-sm md:text-base text-foreground/60 font-medium leading-relaxed border-t border-white/5 mt-2 bg-white/5">
                  {faq.a}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
