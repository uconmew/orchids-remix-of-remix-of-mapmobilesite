"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Volume2, 
  VolumeX,
  Bell,
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
  Timer
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
}

export default function DeploymentsHub() {
  const router = useRouter();
  
  // Auth State
  const [techSession, setTechSession] = useState<{ mapId: string; id: string; name: string; role?: string; expiresAt: number } | null>(null);
  const [mapIdInput, setMapIdInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  
  // Data State
  const [availableDeployments, setAvailableDeployments] = useState<Booking[]>([]);
  const [myDeployments, setMyDeployments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI State
  const [isMuted, setIsMuted] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [shouldAlert, setShouldAlert] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [verificationCode1, setVerificationCode1] = useState("");
  const [verificationCode2, setVerificationCode2] = useState("");
  const [showCompletionDoubleCheck, setShowCompletionDoubleCheck] = useState(false);
  const [techProfile, setTechProfile] = useState<any>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideMapId, setOverrideMapId] = useState("");
  const [overrideCode, setOverrideCode] = useState("");
  const [isOverriding, setIsOverriding] = useState(false);

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
        } else {
          localStorage.removeItem("tech_auth_session");
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, map_id")
          .eq("id", session.user.id)
          .single();
        
        if (profile?.role === "admin" || profile?.role === "technician") {
          const adminSession = {
            mapId: profile.map_id || "ADMIN",
            id: session.user.id,
            name: profile.full_name || "Administrator",
            role: profile.role,
            expiresAt: Date.now() + 10 * 60 * 60 * 1000
          };
          setTechSession(adminSession);
          localStorage.setItem("tech_auth_session", JSON.stringify(adminSession));
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Fetch Logic
  const fetchDeployments = async () => {
    if (!techSession) return;
    setRefreshing(true);
    try {
      // Release expired grace periods
      await fetch("/api/admin/staff/release-expired-jobs", { method: "POST" });

      // Fetch Tech Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", techSession.id)
        .single();
      
      setTechProfile(profile);

      // Fetch My Current Jobs
      const { data: myJobs, error: myError } = await supabase
        .from("bookings")
        .select(`
          *,
          service:service_id(name),
          vehicle:vehicle_id(make, model, year, type),
          address:address_id(street, city, state)
        `)
        .eq("assigned_tech_id", techSession.id)
        .in("status", ["confirmed", "in_progress"])
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });

      if (myError) throw myError;
      setMyDeployments(myJobs || []);

      // Fetch Available Jobs
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          service:service_id(name),
          vehicle:vehicle_id(make, model, year, type),
          address:address_id(street, city, state)
        `)
        .in("status", ["confirmed", "pending"])
        .eq("payment_status", "paid")
        .is("assigned_tech_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAvailableDeployments(data);
      setLastChecked(new Date());

      if (data.length > 0 && !isMuted) {
        setShouldAlert(true);
      } else {
        setShouldAlert(false);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (techSession) {
      fetchDeployments();
      const interval = setInterval(fetchDeployments, 30000);
      return () => clearInterval(interval);
    }
  }, [techSession, isMuted]);

  useEffect(() => {
    if (shouldAlert && !isMuted) {
      if (audioRef.current) {
        audioRef.current.loop = true;
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [shouldAlert, isMuted]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, map_id, access_code")
        .eq("map_id", mapIdInput)
        .eq("access_code", codeInput)
        .single();

      if (error || !data || (data.role !== 'admin' && data.role !== 'technician')) {
        toast.error("Invalid credentials or unauthorized");
        return;
      }

      const sessionData = {
        mapId: data.map_id!,
        id: data.id,
        name: data.full_name || "Technician",
        role: data.role,
        expiresAt: Date.now() + 10 * 60 * 60 * 1000
      };

      setTechSession(sessionData);
      localStorage.setItem("tech_auth_session", JSON.stringify(sessionData));
      toast.success(`Session established: ${sessionData.name}`);
    } catch (err) {
      toast.error("Authentication failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tech_auth_session");
    setTechSession(null);
    setShouldAlert(false);
  };

  const acceptJob = async (bookingId: string) => {
    if (!techSession) return;
    try {
      // Get current location
      let techLat, techLon;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        techLat = pos.coords.latitude;
        techLon = pos.coords.longitude;
      } catch (e) {
        console.warn("Geolocation failed, proceeding without distance check");
      }

      const res = await fetch("/api/admin/staff/accept-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          techId: techSession.id,
          mapId: techSession.mapId,
          techName: techSession.name,
          techLat,
          techLon
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.locked) {
          setOverrideMapId(techSession.mapId);
          setShowOverrideModal(true);
          toast.error("Technician Locked");
        } else {
          throw new Error(data.error || "Failed to accept job");
        }
        return;
      }
      
      toast.success(data.message || "Job assigned to you");
      fetchDeployments();
    } catch (err: any) {
      toast.error(err.message || "Could not assign job");
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

      toast.success("Lockout purged. You can now re-attempt assignment.");
      setShowOverrideModal(false);
      setOverrideCode("");
      fetchDeployments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsOverriding(false);
    }
  };

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
      
      toast.success("Installation started. Timer is now running.");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!techSession) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-xl w-full max-w-md space-y-8 shadow-2xl"
        >
          <div className="text-center space-y-3">
            <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner">
              <Smartphone className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Deployments <span className="text-primary">Hub</span></h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">Authorized Technician Access Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">MAP ID</Label>
              <div className="relative group">
                <Input 
                  value={mapIdInput}
                  onChange={(e) => setMapIdInput(e.target.value.toUpperCase())}
                  placeholder="MAPXXXXX"
                  className="h-14 bg-white/5 border-white/10 rounded-xl px-12 font-bold focus:border-primary/50 text-white"
                  required
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/20 group-focus-within:text-primary transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Access Code</Label>
              <div className="relative group">
                <Input 
                  type="password"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="••••"
                  className="h-14 bg-white/5 border-white/10 rounded-xl px-12 text-center text-2xl tracking-[1em] font-black focus:border-primary/50 text-white"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/20 group-focus-within:text-primary transition-colors" />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={verifying}
              className="w-full h-16 blue-gradient text-white border-none rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 group overflow-hidden"
            >
              {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authenticate Hub Session"}
            </Button>
          </form>

          <p className="text-[9px] text-center text-foreground/30 font-bold uppercase tracking-widest leading-relaxed">
            Session persistence: 10 Hours. MAP ID and Access Code required for deployment authorization.
          </p>
        </motion.div>
      </div>
    );
  }

  const activeJob = myDeployments.find(d => d.status === "in_progress" || d.status === "confirmed");

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 pb-24">
      <audio ref={audioRef} src="/sounds/alert.mp3" />
      
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
              <Bell className={`h-5 w-5 text-primary ${shouldAlert ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter">Deployments</h1>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-foreground/40">
                  Live Feed • Refresh in 30s
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/technician/tools")}
              className="h-10 border-primary/30 text-primary hover:bg-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              <Wrench className="mr-2 h-4 w-4" />
              Tech Tools
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/technician")}
              className="h-10 border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hidden md:flex"
            >
              <Banknote className="mr-2 h-4 w-4" />
              Payments
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className={`rounded-xl border border-white/5 ${isMuted ? 'text-red-400 bg-red-400/10' : 'text-primary bg-primary/10'}`}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">{techSession.name}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-foreground/40">{techSession.mapId}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="h-10 border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Exit</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
        {/* Alerts Section (Available) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-red-500 animate-pulse" />
              <h2 className="text-lg font-black uppercase italic tracking-widest text-red-500">
                Available Deployments <span className="bg-red-500/10 px-2 py-0.5 rounded ml-2">{availableDeployments.length}</span>
              </h2>
            </div>
          </div>

          {availableDeployments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {availableDeployments.map((b) => (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="glass-card rounded-3xl border border-red-500/20 bg-red-500/5 p-6 space-y-6 shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2">
                       <div className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">Unassigned</div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                          <User className="h-6 w-6 text-foreground/60" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black italic uppercase leading-none">{b.customer_legal_name}</h3>
                          <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter mt-1 italic">Prefer: {b.customer_preferred_name}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">Vehicle</p>
                          <p className="text-[10px] font-bold uppercase truncate">{b.vehicle?.year || 'N/A'} {b.vehicle?.make || ''}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">Window</p>
                          <p className="text-[10px] font-bold uppercase truncate">{new Date(b.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          <p className="text-[9px] text-primary font-black uppercase truncate">{b.scheduled_time}</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                         <div className="flex items-center gap-2">
                            <Wrench className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{b.service?.name || 'Standard Service'}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-foreground/40" />
                            <span className="text-[10px] font-bold text-foreground/60">{b.address?.city || 'Location Pending'}, {b.address?.state || ''}</span>
                         </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => acceptJob(b.id)}
                      className="w-full h-14 blue-gradient text-white border-none rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                    >
                      Accept Job
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-20 text-center">
               <Info className="h-8 w-8 text-foreground/10 mx-auto mb-4" />
               <p className="text-xs font-black uppercase tracking-[0.3em] text-foreground/20">No pending deployments</p>
            </div>
          )}
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

      <footer className="max-w-7xl mx-auto p-8 border-t border-white/5">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[8px] font-black uppercase tracking-[0.5em] text-foreground/20">
            <span>MAPmobile • Deployment Notification Hub v2.5</span>
            <div className="flex gap-4">
             <span>System Secure</span>
             <span>{new Date().getFullYear()} ©</span>
          </div>
       </div>
      </footer>

      {/* Sticky Information Bar */}
      <div 
        onClick={() => setShowDashboard(true)}
        className="fixed bottom-0 left-0 right-0 h-20 bg-black/90 backdrop-blur-2xl border-t border-white/10 px-6 flex items-center justify-between z-[60] cursor-pointer hover:bg-black/80 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{techSession.name}</p>
            <p className="text-[12px] font-bold text-white/40">{techSession.mapId}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Current Status</p>
            <p className={`text-[10px] font-black uppercase tracking-widest ${
              techProfile?.tech_status === 'available' ? 'text-green-500' :
              techProfile?.tech_status === 'deployed' ? 'text-blue-500' :
              'text-foreground/40'
            }`}>
              {techProfile?.tech_status || 'Inactive'}
            </p>
          </div>
          <div className={`h-12 px-6 rounded-2xl flex items-center justify-center border font-black uppercase tracking-widest text-[10px] ${
            techProfile?.tech_status === 'available' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
            techProfile?.tech_status === 'deployed' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
            'bg-white/5 border-white/10 text-white/40'
          }`}>
            {techProfile?.tech_status === 'deployed' ? 'Active Deployment' : 'Tap to View Dashboard'}
          </div>
        </div>
      </div>

      {/* Deployment Dashboard Slide-up */}
      <AnimatePresence>
        {showDashboard && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDashboard(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-[#0a0a0a] border-t border-white/10 rounded-t-[2.5rem] shadow-2xl z-[80] overflow-y-auto"
            >
              <div className="sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">Tech <span className="text-primary">Dashboard</span></h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowDashboard(false)} className="rounded-full bg-white/5">
                  <LogOut className="h-5 w-5 rotate-90" />
                </Button>
              </div>

              <div className="p-8 space-y-8 pb-32">
                {activeJob ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Currently Deployed</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground/40">
                        <Clock className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Active Timer: {activeJob.elapsed_time || 0}m</span>
                      </div>
                    </div>

                    <div className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-8 space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Customer Name</p>
                          <h3 className="text-3xl font-black italic uppercase tracking-tighter">{activeJob.customer_legal_name}</h3>
                          <div className="flex items-center gap-2 text-foreground/40 text-[10px] font-bold uppercase">
                            <Smartphone className="h-3 w-3" />
                            {activeJob.tech_contact_phone}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className={`px-4 py-2 rounded-xl border font-black uppercase tracking-widest text-[10px] ${
                            activeJob.payment_status === 'paid' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'
                          }`}>
                            {activeJob.payment_status === 'paid' ? 'Paid' : 'Unpaid - Collect Payment'}
                          </div>
                          {activeJob.payment_status !== 'paid' && (
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-500 text-right">Persistent Alert: Pay on Arrival</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                          <p className="text-[8px] font-black uppercase tracking-widest text-primary">Service</p>
                          <p className="text-xs font-bold uppercase">{activeJob.service?.name}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                          <p className="text-[8px] font-black uppercase tracking-widest text-primary">Vehicle</p>
                          <p className="text-xs font-bold uppercase">{activeJob.vehicle?.year} {activeJob.vehicle?.make} {activeJob.vehicle?.model}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                          <p className="text-[8px] font-black uppercase tracking-widest text-primary">Address</p>
                          <p className="text-xs font-bold uppercase truncate">{activeJob.address?.street}, {activeJob.address?.city}</p>
                        </div>
                      </div>

                      <div className="pt-4">
                        {activeJob.status === 'confirmed' ? (
                          <Button 
                            onClick={() => startJob(activeJob.id)}
                            className="w-full h-16 blue-gradient text-white border-none rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
                          >
                            <Play className="mr-2 h-5 w-5" />
                            Start Install
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => {
                              setCompletingJob(activeJob);
                              setShowDashboard(false);
                            }}
                            className="w-full h-16 bg-green-600 hover:bg-green-500 text-white border-none rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-green-500/20"
                          >
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Complete Install
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 space-y-4">
                    <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-dashed border-white/10">
                      <Timer className="h-8 w-8 text-foreground/20" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black uppercase italic tracking-tighter text-foreground/40">No Active Deployment</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">Accept a job from the hub to begin</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">System Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Tech ID</p>
                      <p className="text-[10px] font-bold text-white">{techSession.mapId}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Last Sync</p>
                      <p className="text-[10px] font-bold text-white">{lastChecked.toLocaleTimeString()}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Alert Mode</p>
                      <p className={`text-[10px] font-bold ${isMuted ? 'text-red-400' : 'text-green-500'}`}>{isMuted ? 'SILENT' : 'ACTIVE'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Hub Version</p>
                      <p className="text-[10px] font-bold text-white">v3.0.4</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Double Verification Completion Overlay */}
      <AnimatePresence>
        {showCompletionDoubleCheck && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 space-y-8 shadow-2xl"
            >
              <div className="text-center space-y-3">
                <div className="h-20 w-20 bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-green-500/20 shadow-inner">
                  <Shield className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Double <span className="text-green-500">Verification</span></h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Enter Access Code Twice to Finalize</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-green-500 ml-1">Primary Entry</Label>
                  <div className="relative group">
                    <Input 
                      type="password"
                      value={verificationCode1}
                      onChange={(e) => setVerificationCode1(e.target.value)}
                      placeholder="••••"
                      className="h-14 bg-white/5 border-white/10 rounded-xl px-12 text-center text-2xl tracking-[1em] font-black focus:border-green-500/50 text-white"
                      autoFocus
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/20 group-focus-within:text-green-500 transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-green-500 ml-1">Confirmation Entry</Label>
                  <div className="relative group">
                    <Input 
                      type="password"
                      value={verificationCode2}
                      onChange={(e) => setVerificationCode2(e.target.value)}
                      placeholder="••••"
                      className="h-14 bg-white/5 border-white/10 rounded-xl px-12 text-center text-2xl tracking-[1em] font-black focus:border-green-500/50 text-white"
                    />
                    <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/20 group-focus-within:text-green-500 transition-colors" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowCompletionDoubleCheck(false);
                      setVerificationCode1("");
                      setVerificationCode2("");
                    }}
                    className="flex-1 h-14 border-white/10 rounded-xl font-black uppercase tracking-widest text-[10px]"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (verificationCode1 !== verificationCode2) {
                        toast.error("Access codes do not match");
                        return;
                      }
                      // Proceed to finalize
                      completeJob();
                      setShowCompletionDoubleCheck(false);
                      setVerificationCode1("");
                      setVerificationCode2("");
                    }}
                    disabled={!verificationCode1 || !verificationCode2 || verificationCode1 !== verificationCode2}
                    className="flex-[2] h-14 bg-green-600 hover:bg-green-500 text-white border-none rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-green-500/20"
                  >
                    Verify & Complete
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Override Modal */}
      <Dialog open={showOverrideModal} onOpenChange={setShowOverrideModal}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[2rem] max-w-md p-8">
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
    </div>
  );
}

