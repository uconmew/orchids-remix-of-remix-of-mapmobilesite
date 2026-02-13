"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight } from "lucide-react";

export function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="relative h-12 px-6 rounded-2xl border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all">
          <ShoppingCart className="h-5 w-5 mr-3 text-primary" />
          <span className="font-bold text-lg">Cart</span>
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-[10px] font-black flex items-center justify-center text-white border-2 border-background shadow-lg">
              {totalItems}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-w-md mx-auto bg-card border-white/10">
        <DrawerHeader>
          <DrawerTitle className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            Selection
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10 text-foreground/20" />
              </div>
              <p className="text-foreground/40 font-bold uppercase tracking-widest">Your cart is empty</p>
              <Button asChild variant="link" className="text-primary mt-4 font-black">
                <Link href="/products">BROWSE GEAR →</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group transition-colors hover:bg-white/10">
                  <div className="h-24 w-24 relative rounded-xl overflow-hidden shrink-0 border border-white/5">
                    <Image
                      src={item.image_url || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm leading-tight line-clamp-2">{item.name}</h4>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-foreground/20 hover:text-destructive transition-colors shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-primary font-black mt-1">${Number(item.price).toLocaleString()}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8 flex items-center justify-center hover:text-primary transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-10 text-center text-sm font-black">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 flex items-center justify-center hover:text-primary transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-white/10 bg-black/40 p-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-foreground/40 font-black uppercase tracking-widest text-xs">Total Est. Price</span>
            <span className="text-4xl font-black text-primary">${totalPrice.toLocaleString()}</span>
          </div>
            <Button 
              disabled={cart.length === 0}
              asChild
              className="w-full blue-gradient text-white font-black h-14 text-xl rounded-2xl shadow-xl shadow-primary/30"
            >
              <Link href="/checkout/cart">
                {cart.some(item => !['Car', 'Truck', 'Marine'].includes(item.category)) ? 'PROCEED TO BOOKING' : 'PROCEED TO CHECKOUT'}
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
          <p className="text-[10px] text-center text-foreground/40 mt-4 uppercase tracking-[0.2em] font-black">
            Prices do not include installation labor
          </p>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
