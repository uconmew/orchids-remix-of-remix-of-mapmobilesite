"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Package, Calendar, Settings, LogOut, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          router.push("/login?redirect=/dashboard");
          return;
        }

        // Fetch user profile to check for admin role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authUser.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }

        if (profile?.role === "admin") {
          router.push("/admin");
          return;
        }

        if (profile?.role === "technician") {
          router.push("/technician");
          return;
        }

        setUser(authUser);
      } catch (err) {
        console.error("Error in checkUser:", err);
        toast.error("Failed to load dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    window.location.assign("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-foreground/60 animate-pulse uppercase tracking-widest font-bold text-xs">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">My Account</h1>
            <p className="text-foreground/60 mt-1">Welcome back, <span className="text-primary font-bold">{user.email}</span></p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="w-fit border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-xl gap-2 font-bold uppercase tracking-widest text-xs h-12 px-6">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/orders" className="glass-card p-8 rounded-3xl border border-white/10 hover:border-primary/50 transition-all group">
            <Package className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold uppercase tracking-tight">Orders</h3>
            <p className="text-sm text-foreground/60 mt-2">View and track your recent orders and installations.</p>
          </Link>
          <Link href="/dashboard/bookings" className="glass-card p-8 rounded-3xl border border-white/10 hover:border-primary/50 transition-all group">
            <Calendar className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold uppercase tracking-tight">Bookings</h3>
            <p className="text-sm text-foreground/60 mt-2">Schedule a new service or manage upcoming appointments.</p>
          </Link>
          <Link href="/dashboard/profile" className="glass-card p-8 rounded-3xl border border-white/10 hover:border-primary/50 transition-all group">
            <Settings className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold uppercase tracking-tight">Settings</h3>
            <p className="text-sm text-foreground/60 mt-2">Update your personal information and preferences.</p>
          </Link>
        </div>

        <div className="glass-card p-12 rounded-3xl border border-white/10 bg-white/5 text-center">
          <User className="h-16 w-16 text-primary/20 mx-auto mb-6" />
          <h2 className="text-2xl font-bold uppercase">Account Overview</h2>
          <p className="text-foreground/60 mt-2 mb-8 max-w-lg mx-auto">
            You are logged in as <span className="text-foreground font-bold">{user.email}</span>.
            Your account allows you to manage your vehicles, bookings, and service history.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild className="blue-gradient rounded-xl px-8 h-12 font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20">
              <Link href="/book">Schedule Service</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
