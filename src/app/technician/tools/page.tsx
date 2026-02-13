"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Lock, 
  User, 
  Clock, 
  MapPin, 
  Car, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ChevronRight,
  LogOut,
  Smartphone,
  Info,
  Banknote,
  Wrench,
  Activity,
  UserCheck,
  Play,
  CheckCircle,
  Timer,
  History,
  XCircle,
  ArrowRightLeft,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Booking {
  id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  booking_date: string;
  scheduled_time: string;
  customer_legal_name: string;
  customer_preferred_name: string;
  tech_contact_phone: string;
  service: { name: string } | null;
  vehicle: { make: string; model: string; year: number; type: string } | null;
  address: { street: string; city: string; state: string } | null;
  assigned_tech_id: string | null;
  start_time: string | null;
  updated_at: string;
}

export default function TechTools() {
  const router = useRouter();
  
  // Auth State
  const [techSession, setTechSession] = useState<{ mapId: string; id: string; name: string; role?: string; expiresAt: number } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [deployments, setDeployments] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Completion Dialog State
  const [completingJob, setCompletingJob] = useState<Booking | null>(null);
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [installType, setInstallType] = useState("");
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  // Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      const saved = localStorage.getItem("tech_auth_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Date.now() < parsed.expiresAt) {
          setTechSession(parsed);
          setLoading(false);
          return;
        }
      }
      router.push("/technician/deployments");
    };
    initAuth();
  }, [router]);

  // Fetch Logic
  const fetchDeployments = async () => {
    if (!techSession) return;
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          service:service_id(name),
          vehicle:vehicle_id(make, model, year, type),
          address:address_id(street, city, state)
        `)
        .eq("assigned_tech_id", techSession.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      setDeployments(data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load history");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (techSession) {
      fetchDeployments();
    }
  }, [techSession]);

  const startJob = async (bookingId: string) => {
    if (!techSession) return;
    try {
      const res = await fetch("/api/admin/staff/start-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          techId: techSession.id
        }),
      });

      if (!res.ok) throw new Error("Failed to start job");
      
      toast.success("Installation started");
      fetchDeployments();
    } catch (err) {
      toast.error("Could not start installation");
    }
  };

  const completeJob = async () => {
    if (!techSession || !completingJob) return;
    setIsSubmittingCompletion(true);
    try {
      const res = await fetch("/api/admin/staff/complete-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: completingJob.id,
          techId: techSession.id,
          vehicleYear,
          vehicleMake,
          vehicleModel,
          installType
        }),
      });

      if (!res.ok) throw new Error("Failed to complete job");
      
      toast.success("Installation marked as complete");
      setCompletingJob(null);
      fetchDeployments();
    } catch (err) {
      toast.error("Could not complete installation");
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'in_progress': return 'text-primary bg-primary/10 border-primary/20';
      case 'assigned': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'terminated': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'transfered': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'admin': return 'text-[#50ceeb] bg-[#50ceeb]/10 border-[#50ceeb]/20';
      default: return 'text-foreground/40 bg-white/5 border-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'in_progress': return <Timer className="h-4 w-4 animate-spin-slow" />;
      case 'assigned': return <UserCheck className="h-4 w-4" />;
      case 'terminated': return <XCircle className="h-4 w-4" />;
      case 'transfered': return <ArrowRightLeft className="h-4 w-4" />;
      case 'admin': return <ShieldAlert className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Filter deployments based on roles and visibility
  const filteredDeployments = deployments.filter(b => {
    if (b.status === 'terminated' || b.status === 'admin') {
      return techSession?.role === 'admin';
    }
    return true;
  });

  const activeJobs = filteredDeployments.filter(b => ['assigned', 'in_progress'].includes(b.status));
  const historyJobs = filteredDeployments.filter(b => !['assigned', 'in_progress'].includes(b.status));

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter">Tech <span className="text-primary">Tools</span></h1>
              <p className="text-[8px] font-black uppercase tracking-widest text-foreground/40">Deployment Management & History</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/technician/deployments")}
              className="h-10 border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Deployments
            </Button>
            
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">{techSession?.name}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-foreground/40">{techSession?.mapId}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
        {/* Active Jobs */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black uppercase italic tracking-widest">Active Assignments</h2>
          </div>

          {activeJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeJobs.map((b) => (
                <div
                  key={b.id}
                  className={`glass-card rounded-3xl border p-6 space-y-6 shadow-xl transition-all ${
                    b.status === 'in_progress' ? 'border-primary bg-primary/5' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                       <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                         b.status === 'in_progress' ? 'bg-primary/20 border-primary/30' : 'bg-blue-500/20 border-blue-500/30'
                       }`}>
                          {b.status === 'in_progress' ? <Timer className="h-5 w-5 text-primary animate-spin-slow" /> : <UserCheck className="h-5 w-5 text-blue-400" />}
                       </div>
                       <div>
                          <p className="text-xs font-black uppercase italic">{b.customer_legal_name}</p>
                          <p className={`text-[8px] font-black uppercase tracking-widest ${
                            b.status === 'in_progress' ? 'text-primary' : 'text-blue-400'
                          }`}>
                            {b.status === 'in_progress' ? 'Installation In Progress' : 'Assigned Deployment'}
                          </p>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">Service</p>
                      <p className="text-[10px] font-bold uppercase truncate">{b.service?.name || 'Standard Install'}</p>
                    </div>
                    {b.status === 'in_progress' && b.start_time && (
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Elapsed</span>
                         </div>
                         <span className="text-[10px] font-black text-primary">
                            {Math.round((Date.now() - new Date(b.start_time).getTime()) / 60000)} MINS
                         </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {b.status !== 'in_progress' ? (
                      <Button
                        onClick={() => startJob(b.id)}
                        className="w-full h-12 bg-primary hover:bg-primary/80 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                      >
                        <Play className="mr-2 h-4 w-4 fill-current" />
                        Start Installation
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setCompletingJob(b);
                          setVehicleYear(b.vehicle?.year?.toString() || "");
                          setVehicleMake(b.vehicle?.make || "");
                          setVehicleModel(b.vehicle?.model || "");
                        }}
                        className="w-full h-12 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-500/20"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete Job
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/technician?id=${b.id.slice(0, 8).toUpperCase()}`)}
                      className="w-full h-12 border-white/10 hover:bg-white/10 rounded-xl font-black uppercase tracking-widest text-[10px]"
                    >
                      Field Ops Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center">
               <Info className="h-6 w-6 text-foreground/10 mx-auto mb-3" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20">No active assignments</p>
            </div>
          )}
        </section>

        {/* History */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-foreground/60" />
            <h2 className="text-lg font-black uppercase italic tracking-widest text-foreground/60">Deployment History</h2>
          </div>

          <div className="glass-card rounded-3xl border border-white/5 bg-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">Status</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">Customer</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">Service</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">Date</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historyJobs.length > 0 ? (
                    historyJobs.map((b) => (
                      <tr key={b.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${getStatusColor(b.status)}`}>
                            {getStatusIcon(b.status)}
                            {b.status}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-black italic uppercase">{b.customer_legal_name}</p>
                          <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">
                            {b.vehicle?.year} {b.vehicle?.make}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">{b.service?.name}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                            {new Date(b.booking_date).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/technician?id=${b.id.slice(0, 8).toUpperCase()}`)}
                            className="rounded-xl hover:bg-primary/10 hover:text-primary"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">
                        No historical records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Completion Dialog */}
      <Dialog open={!!completingJob} onOpenChange={(o) => !o && setCompletingJob(null)}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[2rem] max-w-lg p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
              Complete <span className="text-primary">Installation</span>
            </DialogTitle>
            <DialogDescription className="text-foreground/40 text-[10px] font-black uppercase tracking-widest">
              Review and finalize the deployment details for {completingJob?.customer_legal_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Vehicle Year</Label>
                <Input 
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(e.target.value)}
                  placeholder="2024"
                  className="bg-white/5 border-white/10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Vehicle Make</Label>
                <Input 
                  value={vehicleMake}
                  onChange={(e) => setVehicleMake(e.target.value)}
                  placeholder="Toyota"
                  className="bg-white/5 border-white/10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Vehicle Model</Label>
              <Input 
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Camry TRD"
                className="bg-white/5 border-white/10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Installation Type</Label>
              <select 
                value={installType}
                onChange={(e) => setInstallType(e.target.value)}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="" disabled className="bg-black">Select Type...</option>
                <option value="Headunit" className="bg-black">Headunit / Multimedia</option>
                <option value="Security" className="bg-black">Security / Alarm</option>
                <option value="Remote Start" className="bg-black">Remote Start</option>
                <option value="Audio System" className="bg-black">Full Audio System</option>
                <option value="Speakers" className="bg-black">Speaker Replacement</option>
                <option value="Marine" className="bg-black">Marine Audio</option>
                <option value="Other" className="bg-black">Other Specialty</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompletingJob(null)}
              className="rounded-xl border-white/10 font-black uppercase text-[10px]"
            >
              Cancel
            </Button>
            <Button
              onClick={completeJob}
              disabled={isSubmittingCompletion || !vehicleYear || !vehicleMake || !vehicleModel || !installType}
              className="blue-gradient text-white rounded-xl font-black uppercase text-[10px] px-8"
            >
              {isSubmittingCompletion ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalize & Release"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
