"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Auto-show disabled per user request
      // const timer = setTimeout(() => setIsVisible(true), 2000);
      // return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:max-w-md"
          >
            <div className="relative overflow-hidden rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-3xl bg-background/90 border border-white/10">
              <div className="absolute top-0 left-0 w-full h-1 blue-gradient" />
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                    <Cookie className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase italic tracking-tighter">Cookie Control</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Privacy & Experience</p>
                  </div>
                </div>
                
                <p className="text-sm text-foreground/70 font-medium leading-relaxed">
                  We use essential cookies to ensure our mobile installation booking flows correctly. By continuing, you agree to our use of tech-enhancing cookies.
                </p>
                
                <div className="flex gap-4">
                  <Button 
                    onClick={acceptCookies} 
                    className="blue-gradient flex-1 font-black uppercase tracking-widest text-xs h-12 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                  >
                    Accept All
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsVisible(false)} 
                    className="px-6 border border-white/5 hover:bg-white/5 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
              
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
}
