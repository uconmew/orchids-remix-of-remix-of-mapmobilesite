"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Activity, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  MapPin, 
  Shield, 
  Lock, 
  CheckCircle,
  AlertTriangle,
  Search,
  Filter
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Technician {
  id: string;
  full_name: string;
  map_id: string;
  tech_status: string;
  is_clocked_in: boolean;
  current_job?: any;
}

interface Booking {
  id: string;
  customer_legal_name: string;
  scheduled_time: string;
  status: string;
  service: { name: string } | null;
  address: { city: string; state: string } | null;
}

export default function ShopHub() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [pendingJobs, setPendingJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Assignment Modal State
  const [selectedJob, setSelectedJob] = useState<Booking | null>(null);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [verificationCode1, setVerificationCode1] = useState("");
  const [verificationCode2, setVerificationCode2] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Override State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideMapId, setOverrideMapId] = useState("");
  const [overrideCode, setOverrideCode] = useState("");
  const [isOverriding, setIsOverriding] = useState(false);

  const fetchData = async () => {
    try {
      // Release expired grace periods
      await fetch("/api/admin/staff/release-expired-jobs", { method: "POST" });

      // Fetch Clocked In Techs
      const { data: techs, error: techError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "technician")
        .eq("is_clocked_in", true);

      if (techError) throw techError;

      // Fetch Pending Jobs
      const { data: jobs, error: jobError } = await supabase
        .from("bookings")
        .select(`
          *,
          service:service_id(name),
          address:address_id(city, state)
        `)
        .in("status", ["pending", "confirmed"])
        .is("assigned_tech_id", null)
        .order("booking_date", { ascending: true });

      if (jobError) throw jobError;

      setTechnicians(techs || []);
      setPendingJobs(jobs || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAssign = async () => {
    if (!selectedJob || !selectedTech || verificationCode1 !== verificationCode2) return;
    setIsAssigning(true);
    try {
      const res = await fetch("/api/admin/staff/accept-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedJob.id,
          techId: selectedTech.id,
          mapId: selectedTech.map_id,
          techName: selectedTech.full_name,
          verificationCode: verificationCode1 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.locked) {
          setOverrideMapId(selectedTech.map_id);
          setShowOverrideModal(true);
          toast.error("Technician Locked");
        } else {
          throw new Error(data.error || "Assignment failed");
        }
        return;
      }
      
      toast.success(`Job assigned to ${selectedTech.full_name}`);
      setSelectedJob(null);
      setSelectedTech(null);
      setVerificationCode1("");
      setVerificationCode2("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleOverride = async () => {
    setIsOverriding(true);
    try {
      const res = await fetch("/api/admin/staff/admin-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapId: overrideMapId,
          overrideCode
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Override failed");

      toast.success("Lockout purged. Re-attempt assignment.");
      setShowOverrideModal(false);
      setOverrideCode("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsOverriding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
                <Activity className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter">Shop <span className="text-primary">Monitor</span> Hub</h1>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">24/7 Real-Time Deployment & Technician Oversight</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
              <div className="flex flex-col items-end">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Clocked In</p>
                <p className="text-sm font-black text-primary">{technicians.length}</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex flex-col items-end">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Pending Jobs</p>
                <p className="text-sm font-black text-red-500">{pendingJobs.length}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Tech Lobby */}
          <section className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Tech <span className="text-primary">Lobby</span>
              </h2>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
              {technicians.length > 0 ? (
                technicians.map((tech) => (
                  <motion.div 
                    key={tech.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-5 rounded-3xl border transition-all ${
                      selectedTech?.id === tech.id 
                      ? 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/10' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                    } cursor-pointer`}
                    onClick={() => setSelectedTech(tech)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 overflow-hidden">
                           <Shield className="h-5 w-5 text-foreground/40" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase italic">{tech.full_name}</p>
                          <p className="text-[9px] font-bold text-foreground/40">{tech.map_id}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        tech.tech_status === 'available' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                        tech.tech_status === 'deployed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                        'bg-white/5 text-white/40'
                      }`}>
                        {tech.tech_status}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
                       <span className="text-foreground/30">Activity Window</span>
                       <span className="text-primary">Online</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-10 border border-dashed border-white/10 rounded-3xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">No technicians clocked in</p>
                </div>
              )}
            </div>
          </section>

          {/* Pending Jobs */}
          <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-500" />
                Pending <span className="text-red-500">Deployments</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
              {pendingJobs.length > 0 ? (
                pendingJobs.map((job) => (
                  <motion.div 
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-3xl border transition-all ${
                      selectedJob?.id === job.id
                      ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/10'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                    } cursor-pointer group`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-red-500">Awaiting Assign</p>
                        <h3 className="text-xl font-black italic uppercase tracking-tighter group-hover:text-red-500 transition-colors">{job.customer_legal_name}</h3>
                      </div>
                      <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                        <MapPin className="h-4 w-4 text-foreground/40" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <p className="text-[7px] font-black uppercase tracking-widest text-foreground/30 mb-1">Service</p>
                          <p className="text-[10px] font-bold uppercase truncate">{job.service?.name}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <p className="text-[7px] font-black uppercase tracking-widest text-foreground/30 mb-1">Scheduled</p>
                          <p className="text-[10px] font-bold uppercase truncate">{job.scheduled_time}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                         <div className="text-[9px] font-bold text-foreground/40 italic">
                            {job.address?.city}, {job.address?.state}
                         </div>
                         <Button 
                           size="sm"
                           className="h-8 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[8px]"
                         >
                           Assign
                         </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full p-20 border border-dashed border-white/10 rounded-3xl text-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">No pending deployments available</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Assignment Modal Overlay */}
      <AnimatePresence>
        {selectedJob && selectedTech && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => {
                setSelectedJob(null);
                setSelectedTech(null);
              }}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 space-y-8 shadow-2xl"
            >
              <div className="text-center space-y-3">
                <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <Activity className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Confirm <span className="text-primary">Assignment</span></h2>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Assigning job for</p>
                  <p className="text-lg font-black uppercase italic text-primary">{selectedJob.customer_legal_name}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">To Technician</p>
                  <p className="text-lg font-black uppercase italic">{selectedTech.full_name}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Primary Access Code</Label>
                    <div className="relative group">
                      <Input 
                        type="password"
                        value={verificationCode1}
                        onChange={(e) => setVerificationCode1(e.target.value)}
                        placeholder="••••"
                        className="h-14 bg-white/5 border-white/10 rounded-xl px-12 text-center text-2xl tracking-[1em] font-black focus:border-primary/50 text-white"
                        autoFocus
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/20 group-focus-within:text-primary transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Confirm Access Code</Label>
                    <div className="relative group">
                      <Input 
                        type="password"
                        value={verificationCode2}
                        onChange={(e) => setVerificationCode2(e.target.value)}
                        placeholder="••••"
                        className="h-14 bg-white/5 border-white/10 rounded-xl px-12 text-center text-2xl tracking-[1em] font-black focus:border-primary/50 text-white"
                      />
                      <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/20 group-focus-within:text-primary transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedJob(null);
                      setSelectedTech(null);
                      setVerificationCode1("");
                      setVerificationCode2("");
                    }}
                    className="flex-1 h-14 border-white/10 rounded-xl font-black uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAssign}
                    disabled={isAssigning || !verificationCode1 || verificationCode1 !== verificationCode2}
                    className="flex-[2] h-14 blue-gradient text-white border-none rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
                  >
                    {isAssigning ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Assign"}
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                   <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                   <p className="text-[8px] font-bold text-red-500/80 uppercase leading-relaxed tracking-wider">
                     Assignment triggers immediate notification to customer and initiates the 15-minute grace period if technician is currently deployed.
                   </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Override Modal */}
      <Dialog open={showOverrideModal} onOpenChange={setShowOverrideModal}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[2.5rem] max-w-md p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
              Admin <span className="text-red-500">Override</span>
            </DialogTitle>
            <DialogDescription className="text-foreground/40 text-[10px] font-black uppercase tracking-widest">
              Manual bypass required for Technician Lockout
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-1">Technician MAP ID</Label>
              <Input 
                value={overrideMapId}
                onChange={(e) => setOverrideMapId(e.target.value.toUpperCase())}
                placeholder="MAPXXXXX"
                className="h-12 bg-white/5 border-white/10 rounded-xl px-4 font-bold focus:border-red-500/50 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-1">Admin Override Code</Label>
              <div className="relative group">
                <Input 
                  type="password"
                  value={overrideCode}
                  onChange={(e) => setOverrideCode(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 bg-white/5 border-white/10 rounded-xl px-10 text-center text-xl font-black focus:border-red-500/50 text-white tracking-widest"
                />
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20 group-focus-within:text-red-500 transition-colors" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
               <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
               <p className="text-[8px] font-bold text-red-500/80 uppercase leading-relaxed tracking-wider">
                 Overrides are logged for audit purposes. This action will purge the 20-minute lockout and reset the transition timer.
               </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowOverrideModal(false)}
              className="rounded-xl border-white/10 font-black uppercase text-[10px] flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleOverride}
              disabled={isOverriding || !overrideMapId || !overrideCode}
              className="bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase text-[10px] px-8 flex-[2]"
            >
              {isOverriding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Purge Lockout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
