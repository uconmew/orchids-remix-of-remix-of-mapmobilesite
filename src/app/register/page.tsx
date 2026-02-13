"use client";

import { Suspense, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Car, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function RegisterContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTOS, setAgreedToTOS] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "customer",
          },
          emailRedirectTo: `${window.location.origin}/login?redirect=${encodeURIComponent(redirect)}`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Registration successful! Please check your email to verify your account.");
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
    } catch (err) {
      console.error("Unexpected registration catch error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 rounded-3xl border border-white/10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tighter mb-4">
            <Car className="h-8 w-8 text-accent" />
            <span>MAP<span className="text-accent">MOBILE</span></span>
          </Link>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-foreground/60 mt-2">Join the premium car care community</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-white/5 border-white/10 h-12"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 h-12"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 h-12"
              required
            />
          </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <input
                type="checkbox"
                id="tos"
                checked={agreedToTOS}
                onChange={(e) => setAgreedToTOS(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
              />
              <label htmlFor="tos" className="text-[10px] font-black uppercase tracking-widest text-foreground/60 cursor-pointer">
                I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </label>
            </div>

            <Button type="submit" className="w-full gold-gradient text-white border-none h-12 text-lg font-bold" disabled={loading || !agreedToTOS}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign Up"}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-foreground/60">
          Already have an account?{" "}
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-accent font-bold hover:underline">Log In</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
