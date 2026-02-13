"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { Car, Loader2, ShieldCheck } from "lucide-react";

import { logAudit } from "@/lib/audit-logger";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

        if (error) {
          toast.error(error.message);
        } else {
          await logAudit({
            action: "PASSWORD_RESET",
            entityType: "profile",
            metadata: { type: "user_reset" }
          });
          toast.success("Password reset successfully! You can now log in.");
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
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-foreground/60 mt-2">Enter your new password below to secure your account.</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/70">New Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 h-12"
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/70">Confirm New Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-white/5 border-white/10 h-12"
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full blue-gradient text-white border-none h-12 text-lg font-bold" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
          </Button>
        </form>

        <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4 items-start text-sm">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          <p className="text-foreground/60">
            Make sure your password is at least 8 characters long and includes a mix of letters and numbers.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
