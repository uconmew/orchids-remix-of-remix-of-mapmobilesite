"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Calendar, Clock, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getAvailableSlots, Slot } from "@/lib/availability";
import dynamic from "next/dynamic";

const InstallMap = dynamic(() => import("@/components/ServiceNetworkMap"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a14]">
      <div className="text-primary animate-pulse font-mono">Initializing Neural Link...</div>
    </div>
  )
});

export default function LocationSection() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showCalendar && selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate, showCalendar]);

  const fetchAvailability = async (date: Date) => {
    setLoading(true);
    try {
      const slots = await getAvailableSlots(date);
      const now = new Date();
      const filteredSlots = slots.map(slot => {
        const [start] = slot.time.split(' - ');
        const [time, period] = start.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        const slotDate = new Date(date);
        slotDate.setHours(hours, minutes, 0, 0);
        if (slotDate < now) return { ...slot, available: false };
        return slot;
      });
      setAvailableSlots(filteredSlots);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSelectedDate = (day: number) => {
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentMonth.getMonth() && 
           selectedDate.getFullYear() === currentMonth.getFullYear();
  };

  const handleDateSelect = (day: number) => {
    if (!isDateDisabled(day)) {
      setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const availableCount = availableSlots.filter(s => s.available).length;

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
            <div className="relative aspect-square rounded-2xl md:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl order-2 lg:order-1">
              <InstallMap />
            </div>

          <div className="space-y-6 md:space-y-8 order-1 lg:order-2">
            <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-primary">Service Area</h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black uppercase italic leading-none">Proudly Serving Denver & Beyond</h3>
            <p className="text-sm sm:text-base md:text-xl text-foreground/60 font-medium leading-relaxed">
              As a local Denver business, we&apos;re proud to serve our community with professional mobile electronics installation. We bring the shop to your driveway across the Front Range.
            </p>
            <div className="grid grid-cols-2 gap-4 md:gap-8">
              <div className="space-y-3 md:space-y-4">
                <h4 className="font-black uppercase tracking-widest text-[10px] md:text-xs text-primary underline underline-offset-4">Primary Areas</h4>
                <ul className="space-y-1 md:space-y-2 font-bold text-foreground/80 text-xs md:text-base">
                  <li>• Denver & Aurora</li>
                  <li>• Lakewood & Arvada</li>
                  <li>• Thornton & Westminster</li>
                  <li>• Centennial & Littleton</li>
                </ul>
              </div>
              <div className="space-y-3 md:space-y-4">
                <h4 className="font-black uppercase tracking-widest text-[10px] md:text-xs text-primary underline underline-offset-4">Surrounding Areas</h4>
                <ul className="space-y-1 md:space-y-2 font-bold text-foreground/80 text-xs md:text-base">
                  <li>• Boulder & Longmont</li>
                  <li>• Castle Rock & Parker</li>
                  <li>• Highlands Ranch</li>
                  <li>• Broomfield</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 md:pt-8">
              <Button 
                onClick={() => setShowCalendar(true)}
                size="lg" 
                className="blue-gradient h-12 md:h-14 px-6 md:px-10 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 text-xs md:text-sm w-full sm:w-auto"
              >
                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                Check Availability
              </Button>
              <Button asChild variant="outline" className="flex items-center justify-center gap-2 md:gap-4 px-4 md:px-6 h-12 md:h-14 rounded-xl border border-white/10 font-black uppercase tracking-widest text-[10px] md:text-sm bg-transparent hover:bg-white/5 w-full sm:w-auto">
                <Link href="tel:+15551234567" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" /> Call or Text Us
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showCalendar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setShowCalendar(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
              >
                <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight">Check Availability</h3>
                    <p className="text-xs md:text-sm text-foreground/60">Select a date to see open slots</p>
                  </div>
                  <button onClick={() => setShowCalendar(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <X className="h-5 w-5 md:h-6 md:w-6" />
                  </button>
                </div>

                <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                      <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                    <h4 className="text-sm md:text-lg font-black uppercase tracking-widest">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                      <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-[8px] md:text-[10px] font-black uppercase tracking-widest text-foreground/40 py-1 md:py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(currentMonth).map((day, i) => (
                      <button
                        key={i}
                        onClick={() => day && handleDateSelect(day)}
                        disabled={day === null || isDateDisabled(day)}
                        className={`aspect-square flex items-center justify-center rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all ${
                          day === null
                            ? ''
                            : isDateDisabled(day)
                            ? 'text-foreground/20 cursor-not-allowed'
                            : isSelectedDate(day)
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 md:mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{formatDate(selectedDate)}</span>
                      </div>
                      {!loading && (
                        <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                          availableCount > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {availableCount} Slots Available
                        </span>
                      )}
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center py-6 md:py-8">
                        <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-32 md:max-h-40 overflow-y-auto">
                        {availableSlots.map((slot) => (
                          <div
                            key={slot.time}
                            className={`p-2 md:p-3 rounded-lg md:rounded-xl text-center text-[10px] md:text-xs font-bold transition-all ${
                              slot.available
                                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                                : 'bg-white/5 border border-white/5 text-foreground/30 line-through'
                            }`}
                          >
                            {slot.time}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 md:p-6 border-t border-white/10 bg-black/40">
                  <Button 
                    asChild 
                    className="w-full blue-gradient text-white font-black h-12 md:h-14 text-sm md:text-lg uppercase tracking-widest rounded-xl shadow-xl shadow-primary/30"
                  >
                    <Link href="/book">
                      Book Deployment Now
                    </Link>
                  </Button>
                  <p className="text-center text-[9px] md:text-[10px] text-foreground/40 mt-3 md:mt-4 uppercase tracking-widest font-bold">
                    Select your service and confirm your slot
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
