"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getCookie, setCookie, deleteCookie } from '@/lib/cookies';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sub_category: string;
  image_url: string;
  weight_lbs?: number;
  brand?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  base_price: number;
  category: string;
  image_url: string;
  estimated_time?: number;
  duration_minutes?: number;
}

interface CartItem extends Product {
  quantity: number;
  isService?: boolean;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  addServiceToCart: (service: Service) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  hasInstallation: boolean;
  getInstallation: () => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<any>(null);

    useEffect(() => {
      const savedCartCookie = getCookie('map_mobile_cart');
      const savedCartStorage = localStorage.getItem('map_mobile_cart');
      
      if (savedCartCookie) {
        try {
          setCart(JSON.parse(savedCartCookie));
        } catch (e) {
          console.error('Failed to parse cart from cookie', e);
        }
      } else if (savedCartStorage) {
        try {
          setCart(JSON.parse(savedCartStorage));
        } catch (e) {
          console.error('Failed to parse cart from storage', e);
        }
      }
      setIsInitialized(true);


    // Initialize Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

    // Persist to storage and cookies
    useEffect(() => {
      if (isInitialized) {
        const cartString = JSON.stringify(cart);
        localStorage.setItem('map_mobile_cart', cartString);
        
        // Use cookies for unauthenticated users as requested
        if (!user) {
          setCookie('map_mobile_cart', cartString, 7);
        } else {
          // Optional: clear cookie when logged in if you want strictly "unless logged in"
          // but usually it's better to keep it or let DB take over.
          // The prompt says "unless user is logged in", so let's follow that.
          deleteCookie('map_mobile_cart');
        }
      }
    }, [cart, isInitialized, user]);

  // Fetch and merge when user logs in
  useEffect(() => {
    if (user && isInitialized) {
      const syncCart = async () => {
        const { data: dbItems, error } = await supabase
          .from('cart_items')
          .select(`
            quantity,
            product:product_id (*)
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching cart items:', error);
          return;
        }

        if (dbItems && dbItems.length > 0) {
          const formattedDbItems: CartItem[] = dbItems.map((item: any) => ({
            ...item.product,
            quantity: item.quantity
          }));

          setCart(prev => {
            const merged = [...prev];
            formattedDbItems.forEach(dbItem => {
              const existingIndex = merged.findIndex(i => i.id === dbItem.id);
              if (existingIndex !== -1) {
                // If item exists in both, keep the higher quantity or some other logic
                // Here we just merge them and take the max quantity
                merged[existingIndex].quantity = Math.max(merged[existingIndex].quantity, dbItem.quantity);
              } else {
                merged.push(dbItem);
              }
            });
            return merged;
          });
        }
      };

      syncCart();
    }
  }, [user, isInitialized]);

  // Sync to database on cart change
  useEffect(() => {
    if (user && isInitialized) {
      const updateDb = async () => {
        const upsertData = cart.map(item => ({
          user_id: user.id,
          product_id: item.id,
          quantity: item.quantity
        }));

        if (upsertData.length > 0) {
          await supabase.from('cart_items').upsert(upsertData, { onConflict: 'user_id,product_id' });
        }
        
        // Remove items from DB that are not in local cart
        const currentIds = cart.map(i => i.id);
        const { data: dbItems } = await supabase.from('cart_items').select('product_id').eq('user_id', user.id);
        const dbIds = dbItems?.map(i => i.product_id) || [];
        const toRemove = dbIds.filter(id => !currentIds.includes(id));
        
        if (toRemove.length > 0) {
          await supabase.from('cart_items').delete().eq('user_id', user.id).in('product_id', toRemove);
        }
      };

      const timer = setTimeout(updateDb, 500); // Debounce DB sync
      return () => clearTimeout(timer);
    }
  }, [cart, user, isInitialized]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, isService: false }];
    });
  }, []);

  const addServiceToCart = useCallback((service: Service) => {
    setCart(prev => {
      // Remove any existing service first (only one installation at a time)
      const withoutServices = prev.filter(item => !item.isService);
      const serviceAsCartItem: CartItem = {
        id: service.id,
        name: service.name,
        description: service.description,
        price: Number(service.base_price),
        category: service.category,
        sub_category: 'installation',
        image_url: service.image_url || 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f',
        quantity: 1,
        isService: true,
      };
      return [...withoutServices, serviceAsCartItem];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const hasInstallation = cart.some(item => item.isService);
  const getInstallation = useCallback(() => cart.find(item => item.isService), [cart]);

  return (
    <CartContext.Provider value={{ cart, addToCart, addServiceToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, hasInstallation, getInstallation }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
