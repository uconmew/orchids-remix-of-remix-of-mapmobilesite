"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { Car, Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Reset link sent! Please check your email.");
        router.push("/login");
      }
    } catch (err) {
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
            <Car className="h-8 w-8 text-primary" />
            <span>MAP<span className="text-primary">MOBILE</span></span>
          </Link>
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-foreground/60 mt-2">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleResetRequest} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/70">Email Address</label>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 h-12"
              required
            />
          </div>
          <Button type="submit" className="w-full blue-gradient text-white border-none h-12 text-lg font-bold" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
