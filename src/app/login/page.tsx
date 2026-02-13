"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Car, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    supabase.auth.getSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    console.log("Login sequence started for:", email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Authentication failed:", error.message);
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        throw new Error("No user data returned after successful auth");
      }

        console.log("Authentication successful for user:", data.user.id);
        
        let metadataRole = data.user.user_metadata?.role;

        // Fallback: check profiles table if metadata role is customer or missing
        if (!metadataRole || metadataRole === 'customer') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          
          if (profile?.role) {
            metadataRole = profile.role;
          }
        }

        let targetPath = redirect;
        
        if (metadataRole === 'admin' && redirect === '/dashboard') {
          targetPath = "/admin";
        } else if (metadataRole === 'technician' && redirect === '/dashboard') {
          targetPath = "/technician";
        }

        console.log("Redirecting to:", targetPath);
      toast.success("Login successful! Redirecting...");

      setTimeout(() => {
        window.location.assign(targetPath);
      }, 100);

    } catch (err: any) {
      console.error("Unexpected error during login process:", err);
      toast.error(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 rounded-3xl border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tighter mb-4">
            <Car className="h-8 w-8 text-primary" />
            <span>MAP<span className="text-primary">MOBILE</span></span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-foreground/60 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 h-12 rounded-xl"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Password</label>
                <Link href="/forgot-password" virtual-link="true" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 h-12 rounded-xl"
              required
              autoComplete="current-password"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full blue-gradient text-white border-none h-12 text-lg font-black uppercase tracking-widest rounded-xl mt-4" 
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
          </Button>
        </form>

        <p className="text-center mt-8 text-sm text-foreground/60">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary font-bold hover:underline">Sign Up</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
