"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  if (!mounted) {
    return (
      <div className="p-2 rounded-xl bg-white/5 border border-white/10 w-9 h-9" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-xl bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-all group flex items-center justify-center"
      aria-label="Toggle theme"
      title={`Theme: ${theme}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {theme === "light" ? (
          <Sun className="h-5 w-5 text-amber-500 transition-all" />
        ) : (
          <Moon className="h-5 w-5 text-blue-400 transition-all" />
        )}
      </div>
    </button>
  );
}
