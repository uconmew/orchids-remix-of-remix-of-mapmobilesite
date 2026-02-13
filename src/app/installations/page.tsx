"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Clock, Tag, CheckCircle2, Shield, Zap, Wrench, ShoppingCart, Gift, AlertCircle, Plus, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const FREE_INSTALL_SERVICE_ID = "95b90d6a-3d6c-4a33-af81-000da028dae7";

export default function InstallationsPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { totalItems, addServiceToCart, hasInstallation, getInstallation } = useCart();
  const hasCartItems = totalItems > 0;

  useEffect(() => {
    async function fetchServices() {
      const { data, error } = await supabase.from("services").select("*").eq("active", true).order("base_price", { ascending: true });
      if (!error && data) setServices(data);
      setLoading(false);
    }
    fetchServices();
  }, []);

  const freeInstallService = services.find(s => s.id === FREE_INSTALL_SERVICE_ID);
  const paidServices = services.filter(s => s.id !== FREE_INSTALL_SERVICE_ID);

  const categories = ["ALL", ...new Set(paidServices.map(s => s.category))];
  const [activeCategory, setActiveCategory] = useState("ALL");

  const filteredServices = activeCategory === "ALL" 
    ? paidServices 
    : paidServices.filter(s => s.category === activeCategory);

  const handleAddToCart = (service: any) => {
    addServiceToCart(service);
    toast.success(`${service.name} added to cart!`);
  };

  const currentInstallation = getInstallation();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-sm font-black uppercase tracking-[0.4em] text-primary">Deployment Hub</h1>
        <h2 className="mt-2 text-5xl font-black tracking-tighter sm:text-6xl uppercase italic">
          Professional <span className="text-primary">Install Packages</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/60 font-medium">
          Expert car audio, security, and electronics installations brought directly to your location. Premium components, elite craftsmanship.
        </p>
      </div>

      {freeInstallService && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12"
        >
          <div className={`relative overflow-hidden rounded-[2.5rem] border-2 ${hasCartItems && !hasInstallation ? 'border-green-500/50 bg-gradient-to-r from-green-500/10 to-primary/10' : 'border-white/10 bg-white/5'} p-8 transition-all`}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="h-24 w-24 rounded-3xl bg-green-500/20 flex items-center justify-center border border-green-500/30 shrink-0">
                <Gift className="h-12 w-12 text-green-500" />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">{freeInstallService.name}</h3>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-[9px] font-black uppercase tracking-widest border border-green-500/30">
                    Free with Purchase
                  </span>
                </div>
                <p className="text-sm text-foreground/60 leading-relaxed font-medium max-w-xl">
                  {freeInstallService.description}
                </p>
                
                {!hasCartItems && (
                  <div className="mt-4 flex items-center gap-2 justify-center md:justify-start text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      Add products to your cart to unlock free installation
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                {hasCartItems && !hasInstallation ? (
                  <Button asChild className="bg-green-500 hover:bg-green-600 text-white border-none h-14 px-10 font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-green-500/20 group">
                    <Link href="/checkout/cart?freeInstall=true" className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Checkout with Free Install
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="border-white/10 h-14 px-10 font-black uppercase tracking-widest text-xs rounded-xl">
                    <Link href="/products" className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Browse Products
                    </Link>
                  </Button>
                )}
                
                <p className="text-[8px] text-foreground/40 font-bold uppercase tracking-widest text-center">
                  {hasCartItems ? `${totalItems} items in cart` : 'Cart is empty'}
                </p>
              </div>
            </div>
            
            {!hasCartItems && (
              <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider text-center">
                  <span className="text-amber-400 mr-2">Note:</span>
                  If you don&apos;t select free installation with your product purchase, a separate installation service fee will apply at a later time.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {hasInstallation && currentInstallation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <div className="p-6 rounded-2xl bg-primary/10 border-2 border-primary/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Installation in Cart</p>
                  <p className="font-bold text-lg">{currentInstallation.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-primary">${currentInstallation.price.toLocaleString()}</span>
                <Button asChild className="blue-gradient text-white h-12 px-8 font-black uppercase tracking-widest text-xs rounded-xl">
                  <Link href="/checkout/cart">Proceed to Checkout</Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-12 flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-xl px-8 h-12 text-xs font-black uppercase tracking-widest transition-all ${
              activeCategory === cat 
                ? 'blue-gradient border-none shadow-lg shadow-primary/20' 
                : 'border-white/10 hover:bg-white/5 text-foreground/40'
            }`}
          >
            {cat.replace('_', ' ')}
          </Button>
        ))}
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-80 rounded-[2.5rem] bg-white/5 animate-pulse border border-white/5" />
          ))
        ) : (
          filteredServices.map((service, idx) => {
            const isInCart = currentInstallation?.id === service.id;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`glass-card flex flex-col overflow-hidden rounded-[2.5rem] border md:flex-row group transition-colors ${isInCart ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-primary/40'}`}
              >
                <div className="relative h-64 w-full md:h-auto md:w-2/5 overflow-hidden">
                  <Image
                    src={service.image_url || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f"}
                    alt={service.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md text-[9px] font-black uppercase tracking-widest border border-primary/30 text-white">
                      {service.category.replace('_', ' ')}
                    </span>
                    {isInCart && (
                      <span className="px-3 py-1 rounded-full bg-green-500/20 backdrop-blur-md text-[9px] font-black uppercase tracking-widest border border-green-500/30 text-green-400">
                        In Cart
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-8 bg-black/40">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{service.name}</h3>
                  </div>
                  <p className="text-sm text-foreground/60 leading-relaxed font-medium mb-6">
                    {service.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-black uppercase text-foreground/30 tracking-widest">Est. Time</p>
                        <p className="text-xs font-bold">{service.estimated_time || service.duration_minutes} MINS</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <Tag className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-black uppercase text-foreground/30 tracking-widest">Base Rate</p>
                        <p className="text-xs font-bold">${Number(service.base_price).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-3">
                    <Button 
                      onClick={() => handleAddToCart(service)}
                      variant="outline"
                      className={`flex-1 h-14 font-black uppercase tracking-widest text-xs rounded-xl ${isInCart ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-white/10 hover:bg-white/10'}`}
                    >
                      {isInCart ? (
                        <><Check className="h-4 w-4 mr-2" />In Cart</>
                      ) : (
                        <><Plus className="h-4 w-4 mr-2" />Add to Cart</>
                      )}
                    </Button>
                    <Button asChild className="flex-1 blue-gradient text-white border-none h-14 font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-primary/20 group">
                      <Link href={`/book?serviceId=${service.id}`} className="flex items-center justify-center gap-2">
                        Book Now
                        <Wrench className="h-4 w-4 group-hover:rotate-45 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <section className="mt-32 rounded-[3rem] bg-white/5 p-12 md:p-16 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48" />
        <h3 className="text-4xl font-black text-center mb-16 italic tracking-tighter">THE <span className="text-primary">MAPmobile</span> ADVANTAGE</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative z-10">
          {[
            { title: "Lifetime Warranty", desc: "Our craftsmanship is guaranteed for as long as you own your vehicle.", icon: Shield },
            { title: "Certified Expertise", desc: "MECP certified technicians with years of complex integration experience.", icon: CheckCircle2 },
            { title: "Mobile Deployment", desc: "Zero downtime for you. We deploy to your home, office, or job site.", icon: Zap },
            { title: "Precision Tools", desc: "We utilize oscilloscope-tuned audio and factory-grade diagnostic tools.", icon: Wrench },
            { title: "Full Liability Shield", desc: "Comprehensive insurance coverage for total peace of mind during service.", icon: Shield },
            { title: "Expert Engineering", desc: "Customized solutions designed specifically for your vehicle's architecture.", icon: Zap }
          ].map((feature) => (
            <div key={feature.title} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="font-black text-lg uppercase italic tracking-tighter">{feature.title}</span>
              </div>
              <p className="text-foreground/50 text-sm leading-relaxed font-medium pl-16">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
