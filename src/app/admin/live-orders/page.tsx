"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Bell, 
  Clock, 
  MapPin, 
  Car, 
  CheckCircle2, 
  User, 
  Speaker,
  AlertCircle,
  Loader2,
  RefreshCcw,
  ExternalLink,
  Zap,
  Check,
  Timer,
  AlertTriangle,
  History,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

import { useDiagnostics } from "@/hooks/use-diagnostics";

export default function LiveOrdersPage() {
  const { reportError } = useDiagnostics();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [newOrder, setNewOrder] = useState<any>(null);
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);

  const fetchOrders = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          user:user_id (full_name, email),
          service:service_id (name),
          vehicle:vehicle_id (make, model, year),
          address:address_id (street, city, state)
        `)
        .in('status', ['pending', 'confirmed', 'in_progress', 'completed'])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Check for new orders to trigger pop-up
      if (!isInitial && data && data.length > orders.length) {
        const latestOrder = data[0];
        const isAlreadyKnown = orders.find(o => o.id === latestOrder.id);
        if (!isAlreadyKnown) {
          setNewOrder(latestOrder);
          setIsNewOrderDialogOpen(true);
          const audio = new Audio('/sounds/alert.mp3');
          audio.play().catch(e => console.log("Audio play failed", e));
          toast.success("New Installation Order Received!");
        }
      }

        setOrders(data || []);
      } catch (error: any) {
        reportError('F55667', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setCountdown(30);
      }
    }, [orders, reportError]);
  
    useEffect(() => {
      fetchOrders(true);
      const getAdmin = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          setAdminProfile(data);
        }
      };
      getAdmin();
    }, [fetchOrders]);
  
    useEffect(() => {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            fetchOrders();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
  
      return () => clearInterval(timer);
    }, [fetchOrders]);
  
    const forceRelease = async (bookingId: string) => {
      if (!adminProfile) {
        toast.error("Admin session required");
        return;
      }
      
      try {
        const res = await fetch("/api/admin/staff/force-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            adminId: adminProfile.id
          }),
        });
  
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to release job");
        
        toast.success("Job force-released to Completed status");
        fetchOrders();
      } catch (error: any) {
        reportError('S44556', error);
      }
    };


  const bookedOrders = orders.filter(o => o.status === 'pending' || (o.status === 'confirmed' && !o.assigned_tech_id));
  const liveOrders = orders.filter(o => o.status === 'in_progress' || (o.status === 'confirmed' && o.assigned_tech_id));
  const completedOrders = orders.filter(o => o.status === 'completed');

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight italic flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary animate-pulse" />
            Field Operations <span className="text-primary">Monitor</span>
          </h1>
          <p className="text-foreground/60 text-sm mt-1 uppercase font-bold tracking-widest">Global Terminal • Real-time Sync</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 leading-none">Terminal Sync</p>
            <p className="text-xl font-black text-primary italic leading-none mt-1">{countdown}s</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fetchOrders()}
            disabled={refreshing}
            className="h-10 w-10 hover:bg-white/10"
          >
            <RefreshCcw className={`h-5 w-5 ${refreshing ? "animate-spin text-primary" : "text-foreground/40"}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">Awaiting encrypted field link...</p>
        </div>
      ) : (
        <div className="space-y-16">
          {/* LIVE INSTALLS */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary animate-pulse" />
              <h2 className="text-xl font-black uppercase italic tracking-widest">Live Installations <span className="text-primary ml-2 bg-primary/10 px-2 rounded">{liveOrders.length}</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveOrders.map(order => (
                <OrderCard key={order.id} order={order} status="live" onRelease={forceRelease} />
              ))}
              {liveOrders.length === 0 && <EmptyState text="No installations currently in progress" />}
            </div>
          </section>

          {/* BOOKED / PENDING */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-black uppercase italic tracking-widest">Booked / Pending <span className="text-amber-500 ml-2 bg-amber-500/10 px-2 rounded">{bookedOrders.length}</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookedOrders.map(order => (
                <OrderCard key={order.id} order={order} status="booked" onRelease={forceRelease} />
              ))}
              {bookedOrders.length === 0 && <EmptyState text="Queue is currently clear" />}
            </div>
          </section>

          {/* COMPLETED */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-black uppercase italic tracking-widest text-foreground/40">Recently Completed <span className="text-green-500 ml-2 bg-green-500/10 px-2 rounded">{completedOrders.length}</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {completedOrders.slice(0, 8).map(order => (
                <OrderCard key={order.id} order={order} status="completed" />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* New Order Pop-up */}
      <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
        <DialogContent className="glass-card border-primary/30 bg-black/95 text-white sm:max-w-lg shadow-2xl shadow-primary/20 p-0 overflow-hidden">
          <div className="bg-primary/10 p-8 flex items-center justify-center border-b border-primary/20">
            <Bell className="h-16 w-16 text-primary animate-bounce" />
          </div>
          <div className="p-8">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">New Order Received</h2>
            <div className="space-y-4">
               <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="font-bold text-lg">{newOrder?.service?.name}</p>
                  <p className="font-black text-primary">${newOrder?.total_amount}</p>
               </div>
               <p className="text-sm font-medium text-foreground/60">{newOrder?.user?.full_name} • {newOrder?.address?.city}</p>
            </div>
          </div>
          <DialogFooter className="p-8 bg-white/5 border-t border-white/10">
            <Button onClick={() => setIsNewOrderDialogOpen(false)} className="w-full blue-gradient text-white h-14 font-black uppercase tracking-widest rounded-xl">Acknowledge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderCard({ order, status, onRelease }: { order: any, status: 'live' | 'booked' | 'completed', onRelease?: (id: string) => void }) {
  return (
    <Card className={`glass-card border-white/5 overflow-hidden group transition-all duration-500 ${
      status === 'live' ? 'border-primary/20 bg-primary/5' : ''
    } ${status === 'completed' ? 'opacity-60' : 'hover:translate-y-[-4px]'}`}>
      <CardContent className="p-0">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <Badge className={`${
            status === 'live' ? 'bg-primary text-black' : 
            status === 'booked' ? 'bg-amber-500/20 text-amber-500' : 
            'bg-green-500/20 text-green-500'
          } border-none uppercase text-[8px] font-black px-2 py-0.5`}>
            {order.status === 'in_progress' ? 'Installation Live' : 
             order.status === 'confirmed' ? 'Tech Assigned' : 
             order.status === 'pending' ? 'Booked Successfully' : 'Deployment Complete'}
          </Badge>
          <span className="text-[10px] font-black text-white/40 italic">ID: {order.id.slice(0, 8)}</span>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black italic text-lg uppercase leading-none">{order.service?.name}</h3>
            <p className="text-xl font-black italic text-white">${Number(order.total_amount).toLocaleString()}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <User className="h-3 w-3 text-primary" />
              <p className="text-xs font-bold">{order.user?.full_name}</p>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-3 w-3 text-primary" />
              <p className="text-xs font-medium text-foreground/60 leading-none">{order.address?.city}, {order.address?.state}</p>
            </div>
            {order.status === 'in_progress' && order.start_time && (
              <div className="flex items-center gap-3 text-primary">
                <Timer className="h-3 w-3 animate-spin-slow" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Elapsed: {Math.round((Date.now() - new Date(order.start_time).getTime()) / 60000)}m
                </p>
              </div>
            )}
            {order.status === 'completed' && order.elapsed_time && (
              <div className="flex items-center gap-3 text-green-500">
                <Check className="h-3 w-3" />
                <p className="text-[10px] font-black uppercase tracking-widest">Duration: {order.elapsed_time}m</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-white/5">
            <Car className="h-3 w-3 text-foreground/40" />
            <p className="text-[10px] font-bold text-foreground/40 uppercase">
              {order.vehicle?.year} {order.vehicle?.make} {order.vehicle?.model}
            </p>
          </div>
        </div>

        {status !== 'completed' && (
          <div className="p-3 bg-black/20 flex gap-2">
            <Button asChild variant="ghost" className="flex-1 h-9 border border-white/5 hover:bg-white/5 font-bold uppercase text-[8px] tracking-widest">
              <a href={`/admin/appointments?id=${order.id}`}>Review</a>
            </Button>
            <Button 
              onClick={() => onRelease?.(order.id)}
              variant="outline" 
              className="flex-1 h-9 border-red-500/20 text-red-500 hover:bg-red-500/10 font-black uppercase text-[8px] tracking-widest"
            >
              Force Release
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="col-span-full py-12 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center opacity-30">
       <Speaker className="h-8 w-8 mb-3" />
       <p className="text-[10px] font-black uppercase tracking-[0.4em]">{text}</p>
    </div>
  );
}

function Activity({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
