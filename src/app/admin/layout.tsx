"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Calendar, Wrench, Users, Star, Settings, ChevronRight, MessageSquare, Loader2, Package, User, ShieldCheck, History as HistoryIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/error-boundary";

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Appointments', href: '/admin/appointments', icon: Calendar },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Installations', href: '/admin/installations', icon: Wrench },
    { name: 'Staff', href: '/admin/staff', icon: ShieldCheck },
    { name: 'Audits', href: '/admin/audits', icon: HistoryIcon },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
    { name: 'Reviews', href: '/admin/reviews', icon: Star },
  ];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login?redirect=" + pathname);
        return;
      }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
    
        if (profile?.role === 'suspended') {
          router.push("/dashboard");
          return;
        }

        if (profile?.role !== 'admin') {
          router.push("/dashboard");
          return;
        }

      setIsAdmin(true);
      setLoading(false);
    }

    checkAdmin();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] dark">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

    return (
      <div className="flex min-h-screen bg-[#050505] dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col fixed h-full bg-[#0a0a0a]">
        <div className="p-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-black tracking-tighter">
            <span className="text-white">MAP</span>
            <span className="text-primary">MOBILE</span>
          </Link>
          <div className="mt-1 text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">Admin Control Panel</div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group",
                  isActive 
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(0,102,255,0.2)]" 
                    : "text-foreground/60 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-foreground/40 group-hover:text-primary")} />
                {item.name}
                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-foreground/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <Settings className="h-5 w-5 text-foreground/40" />
            Back to User View
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
          <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-8">
              <h1 className="text-sm font-bold uppercase tracking-widest text-foreground/60">
                {navigation.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))?.name || 'Admin'}
              </h1>

              <div className="hidden md:flex bg-white/5 border border-white/10 p-1 rounded-xl items-center gap-1">
                <Button 
                  onClick={() => router.push("/dashboard")}
                  variant="ghost" 
                  className="rounded-lg px-4 py-1.5 h-auto text-[9px] font-black uppercase tracking-widest text-foreground/40 hover:text-white hover:bg-white/5"
                >
                  <User className="h-3 w-3 mr-2" />
                  Client View
                </Button>
                <Button 
                  variant="ghost" 
                  className="rounded-lg px-4 py-1.5 h-auto text-[9px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary"
                >
                  <ShieldCheck className="h-3 w-3 mr-2" />
                  Admin Panel
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">AD</span>
            </div>
          </div>
        </header>

          <div className="p-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>

      </main>
    </div>
  );
}
