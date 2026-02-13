"use client";

// Force refresh to resolve Turbopack cache issue
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Product, useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/CartDrawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Search, Filter, Trash2, Plus, Minus, Check, X, ArrowRight, Package, Ship, Truck, Radio, Shield, Zap, Speaker, Music, Box, Camera, Volume2, Lightbulb, Waves, Layers, Settings, Grid, Award, Car, Info } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("All");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to load products");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  const filteredProducts = products.filter((p) => {
    const matchesVehicle = selectedVehicle === "All" || (p.category && p.category === selectedVehicle);
    const matchesSubCategory = selectedSubCategory === "All" || (p.sub_category && p.sub_category === selectedSubCategory);
    const matchesBrand = selectedBrand === "All" || (p.brand && p.brand === selectedBrand);
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesVehicle && matchesSubCategory && matchesBrand && matchesSearch;
  });

  const vehicleTypes = [
    { name: "All", icon: <Grid className="h-4 w-4" /> },
    { name: "Car", icon: <Car className="h-4 w-4" /> },
    { name: "Marine", icon: <Waves className="h-4 w-4" /> },
    { name: "Truck", icon: <Truck className="h-4 w-4" /> },
  ];

  const subCategories = [
    { name: "All", id: "All", icon: <Layers className="h-4 w-4" /> },
    { name: "Headunits", id: "HEAD_UNIT", icon: <Radio className="h-4 w-4" /> },
    { name: "Amplifiers", id: "AMPLIFIER", icon: <Volume2 className="h-4 w-4" /> },
    { name: "Subwoofers", id: "SUBWOOFER", icon: <Music className="h-4 w-4" /> },
    { name: "Speakers", id: "SPEAKERS", icon: <Speaker className="h-4 w-4" /> },
    { name: "Security", id: "SECURITY", icon: <Shield className="h-4 w-4" /> },
    { name: "Remote Start", id: "REMOTE_START", icon: <Zap className="h-4 w-4" /> },
    { name: "Lighting", id: "LIGHTING", icon: <Lightbulb className="h-4 w-4" /> },
    { name: "Custom Gear", id: "CUSTOM", icon: <Settings className="h-4 w-4" /> },
  ];

  const availableBrands = ["All", ...Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort()] as string[];

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase mb-2">Professional Catalog</h1>
          <p className="text-foreground/60 max-w-xl text-lg">
            Authorized dealer of premium mobile electronics. 
            All products include professional mobile installation options.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Search products, brands, or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            />
          </div>

          <CartDrawer />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-6">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                <Car className="h-3 w-3" /> Vehicle Type
              </h2>
              <div className="flex flex-col gap-2">
                {vehicleTypes.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => setSelectedVehicle(v.name)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      selectedVehicle === v.name 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "hover:bg-white/5 text-foreground/60"
                    }`}
                  >
                    {v.icon}
                    {v.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                <Grid className="h-3 w-3" /> Categories
              </h2>
              <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {subCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedSubCategory(cat.id)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      selectedSubCategory === cat.id 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "hover:bg-white/5 text-foreground/60"
                    }`}
                  >
                    {cat.icon}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                <Award className="h-3 w-3" /> Top Brands
              </h2>
              <div className="flex flex-wrap gap-2">
                {availableBrands.slice(0, 15).map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBrand(b || "All")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                      selectedBrand === b 
                      ? "bg-white text-black border-white" 
                      : "border-white/10 text-foreground/40 hover:border-white/30"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[450px] rounded-3xl bg-white/5 animate-pulse border border-white/5" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group relative flex flex-col rounded-3xl bg-card border border-white/5 overflow-hidden transition-all hover:border-primary/40 hover:shadow-[0_0_40px_-15px_rgba(var(--primary-rgb),0.3)]"
                    >
                      <div 
                        className="aspect-square relative overflow-hidden cursor-pointer"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Image
                          src={product.image_url || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2"}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl text-[9px] font-black uppercase tracking-widest border border-white/10 text-white">
                            {product.category}
                          </span>
                        </div>
                        <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                           <div className="p-2 rounded-full bg-primary text-white shadow-xl">
                              <Info className="h-5 w-5" />
                           </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      <div className="p-6 flex flex-col flex-1">
                        <div className="mb-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">{product.brand}</p>
                          <h3 
                            className="font-black text-xl leading-tight cursor-pointer hover:text-primary transition-colors"
                            onClick={() => setSelectedProduct(product)}
                          >
                            {product.name}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                          <span className="text-2xl font-black text-primary">${Number(product.price).toLocaleString()}</span>
                          <Button 
                            onClick={() => {
                              addToCart(product);
                              toast.success(`Added ${product.name} to cart`);
                            }}
                            className="blue-gradient text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-primary/20"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-32 glass-card rounded-3xl border border-white/5">
                  <Package className="h-16 w-16 text-foreground/10 mx-auto mb-6" />
                  <h3 className="text-2xl font-black uppercase tracking-tight">No products match</h3>
                  <p className="text-foreground/40 mt-2 max-w-sm mx-auto">Try broadening your search or switching filters to find the right gear.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {setSelectedVehicle("All"); setSelectedSubCategory("All"); setSelectedBrand("All"); setSearchQuery("");}}
                    className="mt-8 rounded-xl border-white/10 hover:bg-white/5 font-bold"
                  >
                    Reset All Filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-white/10 rounded-3xl">
          {selectedProduct && (
            <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto md:overflow-hidden">
              <div className="md:w-1/2 relative aspect-square md:aspect-auto h-full min-h-[300px]">
                <Image
                  src={selectedProduct.image_url || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2"}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent md:hidden" />
              </div>
              
              <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-between bg-card">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                      {selectedProduct.brand}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/5 text-foreground/40 text-[10px] font-black uppercase tracking-widest border border-white/10">
                      {(selectedProduct.sub_category || '').replace('_', ' ')}
                    </span>
                  </div>
                  
                  <h2 className="text-4xl font-black tracking-tight uppercase mb-6 leading-none">
                    {selectedProduct.name}
                  </h2>
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-lg text-foreground/70 leading-relaxed mb-8">
                      {selectedProduct.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6 py-6 border-y border-white/5">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Availability</h4>
                        <div className="flex items-center gap-2 text-sm font-bold text-green-500">
                          <Check className="h-4 w-4" /> In Stock & Ready to Install
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Category</h4>
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground/60 capitalize">
                          {selectedProduct.category} Professional Gear
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">Total Product Price</p>
                    <p className="text-4xl font-black text-primary">${Number(selectedProduct.price).toLocaleString()}</p>
                  </div>
                  <Button 
                    onClick={() => {
                      addToCart(selectedProduct);
                      toast.success(`Added ${selectedProduct.name} to cart`);
                      setSelectedProduct(null);
                    }}
                    size="lg"
                    className="w-full sm:w-auto blue-gradient text-white font-black h-14 px-10 rounded-2xl text-lg shadow-xl shadow-primary/30"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
