import Link from "next/link";
import { Radio, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-foreground/10 bg-card py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center gap-2 h-16 w-40 relative">
                <Image 
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/project-uploads/b6d040d1-fad3-40b6-acb5-529a409fa8e6/PENUP_20260106_122704-resized-1767728177530.webp?width=400&height=200&resize=contain" 
                  alt="MAPmobile"
                  fill
                  className="object-contain"
                />
              </Link>
            <p className="mt-4 max-w-xs text-foreground/60 leading-relaxed">
              Mobile Audio Professionals. We bring premium car audio, security, and electronics installations directly to your doorstep. MECP Certified.
            </p>
              <div className="mt-6 flex gap-4">
                <Link href="https://instagram.com" target="_blank" className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 text-foreground/60 hover:bg-primary hover:text-white transition-all">
                  <Instagram className="h-5 w-5" />
                </Link>
                <Link href="https://facebook.com" target="_blank" className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 text-foreground/60 hover:bg-primary hover:text-white transition-all">
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link href="https://twitter.com" target="_blank" className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 text-foreground/60 hover:bg-primary hover:text-white transition-all">
                  <Twitter className="h-5 w-5" />
                </Link>
              </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Installations</h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/installations" className="text-foreground/60 hover:text-primary transition-colors">Audio Systems</Link></li>
              <li><Link href="/installations" className="text-foreground/60 hover:text-primary transition-colors">Head Units</Link></li>
              <li><Link href="/installations" className="text-foreground/60 hover:text-primary transition-colors">Car Security</Link></li>
              <li><Link href="/installations" className="text-foreground/60 hover:text-primary transition-colors">Remote Starts</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Contact</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center gap-3 text-foreground/60">
                <Phone className="h-4 w-4 text-primary" />
                <span>(720) 663-9243</span>
              </li>
              <li className="flex items-center gap-3 text-foreground/60">
                <Mail className="h-4 w-4 text-primary" />
                <span>install@MAPmobileco.com</span>
              </li>
              <li className="flex items-center gap-3 text-foreground/60">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Mobile Service Area</span>
              </li>
            </ul>
          </div>
        </div>
      <div className="mt-16 border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-foreground/40 relative">
        <p>&copy; 2026 MAPmobile & Co. All rights reserved</p>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link>
          <Link href="/technician" className="opacity-10 hover:opacity-100 transition-opacity">Tech Portal</Link>
        </div>
        <Link href="/technician" className="absolute -bottom-8 right-0 opacity-0 hover:opacity-20 text-[8px] cursor-default px-2 py-1">.</Link>
      </div>
      </div>
    </footer>
  );
}
