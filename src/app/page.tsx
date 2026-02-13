import React from "react";
import HeroSection from "@/components/home/HeroSection";
import BenefitsSection from "@/components/home/BenefitsSection";
import WhySection from "@/components/home/WhySection";
import InstallationsSection from "@/components/home/InstallationsSection";
import ProcessSection from "@/components/home/ProcessSection";
import PriceMatchSection from "@/components/home/PriceMatchSection";
import AreasSection from "@/components/home/AreasSection";
import MapSection from "@/components/home/MapSection";
import NewsletterSection from "@/components/NewsletterSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import FinalCTA from "@/components/home/FinalCTA";

export default function Home() {
  return (
    <div className="flex flex-col gap-10 pb-16 md:pb-24 lg:pb-32 overflow-x-hidden w-full max-w-[1400px] mx-auto">
      <HeroSection />
      <div className="flex flex-col gap-10 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <BenefitsSection />
        <WhySection />
        <InstallationsSection />
        <ProcessSection />
        <PriceMatchSection />
        <AreasSection />
        <MapSection />
        <NewsletterSection />
        <TestimonialsSection />
        <FAQSection />
        <FinalCTA />
      </div>
    </div>
  );
}
