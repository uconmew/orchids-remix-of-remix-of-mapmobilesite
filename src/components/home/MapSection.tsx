"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Info, Phone, ArrowRight, ChevronRight, ChevronDown, Car, MapPin } from "lucide-react";
import type { ServiceNetworkMapHandle } from "@/components/ServiceNetworkMap";

const DynamicMap = dynamic(
  () => import("@/components/ServiceNetworkMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a14] min-h-[600px] rounded-[2rem] md:rounded-[4rem]">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    ),
  }
);

interface JobData {
  id: string;
  city: string;
  service: string;
  car?: string;
  status: string;
  createdAt: string;
  coordinates?: [number, number];
}

interface MapData {
  totalInstalls: number;
  completedJobs: JobData[];
  activeJobs: JobData[];
  mostRecentJob: JobData | null;
}

export default function MapSection() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const mapRef = useRef<ServiceNetworkMapHandle>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/map-data");
        const data = await res.json();
        setMapData(data);
      } catch (error) {
        // Silent fail
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

    const handleJobClick = (e: React.MouseEvent, coordinates?: [number, number], jobId?: string) => {
      e.stopPropagation(); // Prevent toggling expansion when clicking the zoom action
      if (coordinates && mapRef.current) {
        mapRef.current.flyToLocation(coordinates, jobId);
        
        // Scroll to map on mobile
        if (window.innerWidth < 768) {
            const mapElement = document.getElementById('network-map');
            if (mapElement) {
                mapElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
      }
    };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  return (
    <section className="w-full bg-background overflow-hidden py-16 md:py-24">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10">
            {/* Service Area Header */}
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[#50ceeb] mb-4">Service Area</h2>
                <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black uppercase italic mb-6">Proudly Serving Denver & Beyond</h3>
                  <p className="text-base md:text-lg text-foreground/60 font-medium leading-relaxed">
                    As a local <span className="text-[#50ceeb] font-bold italic">MAPmobile</span> business, we&apos;re proud to serve our community with professional mobile electronics installation. 
                    We bring the shop to your driveway across the Front Range.
                  </p>
              </div>

            {/* Map Section */}
            <motion.div 
              id="network-map"
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.7, 0, 1, 0.4] }}
              className="relative aspect-[3/4] md:aspect-[21/9] min-h-[500px] md:min-h-[750px] rounded-3xl md:rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a14]"
            >
              <DynamicMap ref={mapRef} />
              <div className="absolute -inset-20 bg-[#50ceeb]/5 blur-[120px] rounded-full pointer-events-none" />
            </motion.div>

            {/* Unified Stats Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.7, 0, 1, 0.4] }}
              className="w-full max-w-lg mx-auto"
            >
                <div className="bg-black rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl p-6 md:p-8">

                      {/* Main Stat: Total Installations */}
                        <div className="text-center mb-10">
                          <div className="text-8xl md:text-[7rem] font-bold text-[#22c55e] tabular-nums leading-none tracking-tight">
                            {mapData?.totalInstalls || 0}
                          </div>
                          <div className="text-lg font-medium text-white/40 mt-2">Total Installations</div>
                        </div>

                        {/* Recent Jobs Section */}
                    <div className="space-y-3">
                      {(mapData?.activeJobs?.length || 0) > 0 || (mapData?.completedJobs?.length || 0) > 0 ? (
                        <>
                          {/* Main Entry (Active or Latest) */}
                          {!isExpanded ? (
                            <button 
                              onClick={(e) => {
                                setIsExpanded(true);
                                const firstJob = (mapData?.activeJobs?.[0] || mapData?.completedJobs?.[0]);
                                if (firstJob) handleJobClick(e, firstJob.coordinates, firstJob.id);
                              }}
                              className="w-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-3xl p-5 flex items-center gap-5 transition-all group text-left shadow-xl hover:border-[#50ceeb]/30"
                            >
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 transition-colors ${mapData?.activeJobs?.length ? 'bg-white/10 border-white/20' : 'bg-[#50ceeb]/10 border-[#50ceeb]/20 group-hover:bg-[#50ceeb]/20'}`}>
                                    {mapData?.activeJobs?.length ? (
                                      <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                    ) : (
                                      <CheckCircle2 className="w-7 h-7 text-[#50ceeb]" />
                                    )}
                                  </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#50ceeb] mb-1">
                                    {mapData?.activeJobs?.length ? "Live Installation" : "Latest Installation"}
                                  </div>
                                <h4 className="text-xl font-black text-white leading-tight uppercase italic truncate">
                                  {(mapData?.activeJobs?.[0] || mapData?.completedJobs?.[0])?.car || "New Activity"}
                                </h4>
                                <div className="flex items-center gap-2 text-sm font-bold text-white/40 mt-1">
                                  <span>{(mapData?.activeJobs?.[0] || mapData?.completedJobs?.[0])?.city}</span>
                                  <span className="w-1 h-1 rounded-full bg-white/10" />
                                  <span>{getRelativeTime((mapData?.activeJobs?.[0] || mapData?.completedJobs?.[0])?.createdAt || "")}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                 <ChevronDown className="w-5 h-5 text-white animate-bounce" />
                                 <span className="text-[8px] font-black uppercase tracking-widest text-white">More</span>
                              </div>
                            </button>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between px-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Recent Activity</h4>
                                    <button 
                                      onClick={() => setIsExpanded(false)}
                                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#50ceeb] hover:text-white transition-colors"
                                    >
                                      Collapse <ChevronDown className="w-3 h-3 rotate-180" />
                                    </button>
                                </div>
                                
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="space-y-2.5"
                                >
                                  {[...(mapData?.activeJobs || []), ...(mapData?.completedJobs || [])].slice(0, 6).map((job, idx) => {
                                    const isActive = job.status === 'in_progress';
                                    return (
                                      <button 
                                        key={job.id}
                                        onClick={(e) => handleJobClick(e, job.coordinates, job.id)}
                                        className={`w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-2xl p-4 flex items-center justify-between group cursor-pointer transition-all hover:border-[#50ceeb]/20 hover:translate-x-1 ${isActive ? 'bg-white/[0.05] border-white/10' : ''}`}
                                      >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-white/10' : 'bg-white/5 group-hover:bg-[#50ceeb]/20'}`}>
                                              {isActive ? (
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                              ) : (
                                                <Car className="w-5 h-5 text-white/40 group-hover:text-[#50ceeb] transition-colors" />
                                              )}
                                            </div>
                                          <div className="text-left min-w-0">
                                            <div className="flex items-center gap-2">
                                              <div className="text-sm font-black text-white uppercase italic tracking-tight truncate">
                                                {job.car || "New Installation"}
                                              </div>
                                              {isActive && (
                                                <span className="text-[8px] font-black bg-white text-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Live</span>
                                              )}
                                            </div>
                                            <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mt-0.5 flex items-center gap-2">
                                              <span className="text-[#50ceeb]/60">{job.city}</span>
                                              <span className="w-1 h-1 rounded-full bg-white/10" />
                                              <span>{job.service}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                          <div className="text-[10px] font-black text-white/20 uppercase tracking-widest tabular-nums">
                                            {getRelativeTime(job.createdAt)}
                                          </div>
                                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#50ceeb]/20 transition-colors">
                                            <MapPin className="w-4 h-4 text-white/20 group-hover:text-[#50ceeb] transition-colors" />
                                          </div>
                                        </div>
                                      </button>
                                  );
                                })}
                              </motion.div>
                            </div>
                          )}
                        </>
                      ) : (


                    <div className="py-8 text-center bg-white/[0.02] rounded-2xl border border-white/5">
                      <div className="text-sm font-bold text-white/20 uppercase tracking-widest">No recent data</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

        </div>
      </div>
    </section>
  );
}
