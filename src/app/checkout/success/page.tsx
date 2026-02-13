"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, ShoppingBag, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CheckoutSuccessPage() {

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
        >
          <CheckCircle className="h-12 w-12 text-white" />
        </motion.div>

        <h1 className="text-4xl font-black uppercase tracking-tight mb-4">
          Payment Successful!
        </h1>
        <p className="text-foreground/60 mb-8 leading-relaxed">
          Thank you for your purchase. Your order has been confirmed and a receipt has been sent to your email.
        </p>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
          <div className="flex items-center justify-center gap-3 text-primary mb-3">
            <Mail className="h-5 w-5" />
            <span className="font-bold text-sm uppercase tracking-widest">Confirmation Sent</span>
          </div>
          <p className="text-sm text-foreground/50">
            Check your inbox for order details and tracking information.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            asChild
            className="flex-1 blue-gradient text-white font-bold h-12"
          >
            <Link href="/products">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1 h-12 border-white/10 bg-white/5"
          >
            <Link href="/dashboard">
              Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <p className="text-[10px] text-foreground/40 mt-8 uppercase tracking-widest font-bold">
          Questions? Contact us at support@MAPmobile.co
        </p>
      </motion.div>
    </div>
  );
}
