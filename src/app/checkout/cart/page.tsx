"use client";

import React, { useState, useEffect, Suspense, useCallback, useRef } from "react";
import Cookies from "js-cookie";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ArrowLeft, ShieldCheck, Lock, CreditCard, Loader2, CheckCircle, Mail, ShoppingBag, ArrowRight, AlertCircle, Trash2, MapPin, Plus, Home, Building2, AlertTriangle, User, Smartphone, Gift, Shield, Eye, EyeOff, UserPlus, Truck, X, LogIn, Minus, Scale, FileText, Anchor, Bike, Wrench, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { getStripe } from "@/lib/stripe-client";
import { detectVehicleType } from "@/lib/vehicle-type-detector";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getAvailableSlots, Slot } from "@/lib/availability";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

const stripePromise = getStripe();

const FREE_INSTALL_SERVICE_ID = "95b90d6a-3d6c-4a33-af81-000da028dae7";

interface ValidationErrors {
  email?: string;
  fullName?: string;
  phone?: string;
  vehicle?: string;
  address?: string;
}

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  agreedToTOS: boolean;
}

function PaymentForm({ clientSecret, amount, onSuccess, agreedToTOS }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elementsReady, setElementsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !agreedToTOS || !elementsReady) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setErrorMessage("Payment could not be completed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 max-h-[400px] overflow-y-auto custom-scrollbar">
        <PaymentElement onReady={() => setElementsReady(true)} options={{ layout: "tabs" }} />
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {!agreedToTOS && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-400">Please agree to the Terms of Service above to proceed with payment.</p>
        </div>
      )}

      <Button type="submit" disabled={!stripe || !elements || isProcessing || !agreedToTOS || !elementsReady} className="w-full blue-gradient text-white font-black h-16 text-lg shadow-xl shadow-primary/20 rounded-xl flex flex-col items-center justify-center gap-1">
        {isProcessing ? (
          <><Loader2 className="h-6 w-6 animate-spin" /><span className="text-[10px] opacity-70 uppercase tracking-widest font-bold font-sans">Processing...</span></>
        ) : !elementsReady ? (
          <><Loader2 className="h-6 w-6 animate-spin" /><span className="text-[10px] opacity-70 uppercase tracking-widest font-bold font-sans">Loading Payment...</span></>
        ) : (
          <><span className="flex items-center gap-2">Pay ${amount.toFixed(2)}</span><span className="text-[10px] opacity-70 uppercase tracking-widest font-bold font-sans">Secure Payment</span></>
        )}
      </Button>
    </form>
  );
}

interface ArrivalFeeFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

function ArrivalFeeForm({ clientSecret, amount, onSuccess, onCancel }: ArrivalFeeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elementsReady, setElementsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !elementsReady) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setErrorMessage("Payment could not be completed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 max-h-[400px] overflow-y-auto custom-scrollbar">
        <PaymentElement onReady={() => setElementsReady(true)} options={{ layout: "tabs" }} />
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing} className="flex-1 h-14 border-white/10">
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || !elements || isProcessing || !elementsReady} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black h-14 text-lg shadow-xl shadow-amber-500/20 rounded-xl">
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : !elementsReady ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>Pay ${amount.toFixed(2)}</>
          )}
        </Button>
      </div>
    </form>
  );
}

function SuccessView({ withInstall, isGuest }: { withInstall: boolean; bookingId?: string; isGuest?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
          <CheckCircle className="h-12 w-12 text-white" />
        </motion.div>
        <h1 className="text-4xl font-black uppercase tracking-tight mb-4">{withInstall ? 'Order & Install Confirmed!' : 'Payment Successful!'}</h1>
        <p className="text-foreground/60 mb-8 leading-relaxed">{withInstall ? 'Your products have been ordered and your free installation has been scheduled. Our technician will bring your products directly - no shipping required!' : 'Thank you for your purchase. Your order has been confirmed and a receipt will be sent to your email.'}</p>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
          <div className="flex items-center justify-center gap-3 text-primary mb-3"><Mail className="h-5 w-5" /><span className="font-bold text-sm uppercase tracking-widest">Confirmation Sent</span></div>
          <p className="text-sm text-foreground/50">Check your inbox for order details {withInstall ? 'and installation schedule.' : 'and tracking information.'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1 blue-gradient text-white font-bold h-12">
            <Link href={withInstall && !isGuest ? "/dashboard" : "/products"}>{withInstall && !isGuest ? (<>Dashboard<ArrowRight className="h-4 w-4 ml-2" /></>) : (<><ShoppingBag className="h-4 w-4 mr-2" />Continue Shopping</>)}</Link>
          </Button>
        </div>
        {!withInstall && (
          <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider"><span className="text-amber-300 mr-2">Note:</span>Since you didn&apos;t select free installation, a separate installation service fee will apply if you book later.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface SignInModalProps { isOpen: boolean; onClose: () => void; onSuccess: (userData: { user: any; profile: any; addresses: any[]; vehicles: any[] }) => void; }

function SignInModal({ isOpen, onClose, onSuccess }: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password"); return; }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (!data.user) throw new Error("Failed to sign in");
      const [addrRes, vehRes, profileRes] = await Promise.all([
        supabase.from("addresses").select("*").eq("user_id", data.user.id),
        supabase.from("vehicles").select("*").eq("user_id", data.user.id),
        supabase.from("profiles").select("*").eq("id", data.user.id).single()
      ]);
      toast.success("Signed in successfully!");
      onSuccess({ user: data.user, profile: profileRes.data, addresses: addrRes.data || [], vehicles: vehRes.data || [] });
      onClose();
    } catch (err: any) { setError(err.message || "Invalid email or password"); } finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-primary/10"><LogIn className="h-5 w-5 text-primary" /></div><div><h3 className="text-lg font-black uppercase tracking-tight">Sign In</h3><p className="text-[10px] text-foreground/60">Continue with your existing account</p></div></div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSignIn} className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"><p className="text-[10px] text-green-400 font-bold uppercase tracking-widest"><CheckCircle className="h-3 w-3 inline mr-1" />Your cart items will be preserved & fields auto-filled</p></div>
          <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" /><Input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10 h-12 pl-10" /></div>
          <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" /><Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 h-12 pl-10 pr-10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"><p className="text-xs text-red-400">{error}</p></div>}
          <Button type="submit" disabled={isLoading} className="w-full blue-gradient text-white font-black h-12 uppercase tracking-widest">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In & Continue"}</Button>
          <p className="text-center text-[9px] text-foreground/40 uppercase tracking-widest font-bold">Don&apos;t have an account? Create one below instead</p>
        </form>
      </motion.div>
    </motion.div>
  );
}

interface TermsModalProps { isOpen: boolean; onClose: () => void; onAccept: () => void; includeFreeInstall: boolean; }

function TermsModal({ isOpen, onClose, onAccept, includeFreeInstall }: TermsModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 20) setHasScrolledToBottom(true);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-primary/10"><Scale className="h-5 w-5 text-primary" /></div><div><h3 className="text-lg font-black uppercase tracking-tight">Terms of Service</h3><p className="text-[10px] text-foreground/60">Please read and accept to continue</p></div></div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="h-5 w-5" /></button>
        </div>
        
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <section className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs">1</span>Agreement to Terms</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">By accessing or using MAPmobile&apos;s services, including our website and mobile installation services, you agree to be bound by these Terms of Service. MAPmobile is a mobile automotive and marine electronics installation service operating in the Denver Metro area.</p>
          </section>
          <section className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs">2</span>Service Appointments</h4>
            <ul className="text-sm text-foreground/70 leading-relaxed space-y-2 list-disc pl-5">
              <li>Customers must provide a safe and legal location for installation (private driveway, garage, etc.).</li>
              <li>An adult (18+) must be present for the duration of the installation or at the beginning and end as agreed upon.</li>
              <li>Cancellations or rescheduling requests must be made at least 24 hours in advance.</li>
            </ul>
          </section>
          <section className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs">3</span>Pricing and Payment</h4>
              <p className="text-sm text-foreground/70 leading-relaxed font-bold">Full payment of the Grand Total is a mandatory prerequisite for the commencement of any installation or service provision. Exceptions to this policy will only be considered if substantiated by a formally executed, written agreement.</p>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-2">
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider"><span className="text-amber-300">Pay on Arrival:</span> When selecting this option, a $10.00 arrival fee must be paid at booking to secure your appointment. The remaining balance is due upon technician arrival before work begins.</p>
              </div>
            </section>
          <section className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs">4</span>Warranty and Liability</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">MAPmobile warrants the labor for our installations for a period of 12 months from the date of service. This warranty covers the installation work only, not the products themselves. Product warranties are provided by the respective manufacturers.</p>
          </section>
          {includeFreeInstall && (
            <section className="space-y-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <h4 className="text-sm font-black uppercase tracking-widest text-amber-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Cancellation Policy</h4>
              <p className="text-sm text-amber-400/80 leading-relaxed font-bold">A $20.00 restocking fee applies to all cancellations within 24 hours of the installation window. By proceeding, you acknowledge and accept this policy.</p>
            </section>
          )}
          <section className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs">5</span>Customer-Provided Equipment</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">While we install customer-provided equipment, we do not warrant the functionality of such equipment. If equipment is found to be defective during or after installation, additional labor charges may apply for diagnosis or replacement.</p>
          </section>
        </div>

        <div className="p-6 border-t border-white/10 shrink-0 space-y-4">
          {!hasScrolledToBottom && <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest text-center"><AlertCircle className="h-3 w-3 inline mr-1" />Please scroll to read all terms before accepting</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 h-12 border-white/10">Cancel</Button>
            <Button onClick={onAccept} disabled={!hasScrolledToBottom} className="flex-1 h-12 blue-gradient text-white font-black uppercase tracking-widest">{hasScrolledToBottom ? (<><CheckCircle className="h-4 w-4 mr-2" />I Accept</>) : "Scroll to Accept"}</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CartCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wantsFreeInstall = searchParams.get("freeInstall") === "true";
  
  const { cart, totalPrice: cartPrice, totalItems, clearCart, removeFromCart, updateQuantity, hasInstallation, getInstallation } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTOS, setAgreedToTOS] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"now" | "arrival">("now");
  const [arrivalFeeClientSecret, setArrivalFeeClientSecret] = useState<string | null>(null);
  const [showArrivalFeePayment, setShowArrivalFeePayment] = useState(false);
  const [pendingArrivalBookingId, setPendingArrivalBookingId] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [newAddress, setNewAddress] = useState({ street: "", city: "", state: "", zip_code: "", label: "Home" });
  const [newVehicle, setNewVehicle] = useState({ make: "", model: "", year: "", type: "Sedan" });
  const [shippingRates, setShippingRates] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const cartInstallation = getInstallation();
  const [includeFreeInstall, setIncludeFreeInstall] = useState(wantsFreeInstall);
  const requiresInstallation = includeFreeInstall || hasInstallation;
  const [addressType, setAddressType] = useState<"residential" | "business">("residential");
  const [businessAuthorized, setBusinessAuthorized] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [techContactPhone, setTechContactPhone] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [fetchingAvailability, setFetchingAvailability] = useState(false);

  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [hasLoadedCookies, setHasLoadedCookies] = useState(false);

  // Load from cookies on mount
  useEffect(() => {
    const savedData = Cookies.get("checkout_form_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.guestEmail) setGuestEmail(parsed.guestEmail);
        if (parsed.guestName) setGuestName(parsed.guestName);
        if (parsed.legalName) setLegalName(parsed.legalName);
        if (parsed.preferredName) setPreferredName(parsed.preferredName);
        if (parsed.techContactPhone) setTechContactPhone(parsed.techContactPhone);
        if (parsed.newAddress) setNewAddress(parsed.newAddress);
        if (parsed.newVehicle) setNewVehicle(parsed.newVehicle);
        if (parsed.addressType) setAddressType(parsed.addressType);
        if (parsed.businessAuthorized !== undefined) setBusinessAuthorized(parsed.businessAuthorized);
      } catch (e) {
        console.error("Failed to parse checkout cookies", e);
      }
    }
    setHasLoadedCookies(true);
  }, []);

  // Save to cookies on change
  useEffect(() => {
    if (!hasLoadedCookies) return;

    const dataToSave = {
      guestEmail,
      guestName,
      legalName,
      preferredName,
      techContactPhone,
      newAddress,
      newVehicle,
      addressType,
      businessAuthorized,
      selectedAddressId: selectedAddress?.id,
      selectedVehicleId: selectedVehicle?.id
    };
    Cookies.set("checkout_form_data", JSON.stringify(dataToSave), { expires: 7 });
  }, [guestEmail, guestName, legalName, preferredName, techContactPhone, newAddress, newVehicle, addressType, businessAuthorized, selectedAddress, selectedVehicle, hasLoadedCookies]);

  const [showSignInModal, setShowSignInModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isValidating, setIsValidating] = useState(false);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const [addrRes, vehRes, profileRes] = await Promise.all([
        supabase.from("addresses").select("*").eq("user_id", session.user.id),
        supabase.from("vehicles").select("*").eq("user_id", session.user.id),
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
      ]);
      
      const addrs = addrRes.data || [];
      const vehs = vehRes.data || [];
      setAddresses(addrs);
      setVehicles(vehs);

      // Restore selected items from cookies if they exist
      const savedData = Cookies.get("checkout_form_data");
      let cookieAddressId, cookieVehicleId;
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          cookieAddressId = parsed.selectedAddressId;
          cookieVehicleId = parsed.selectedVehicleId;
        } catch {}
      }

      if (cookieAddressId) {
        const found = addrs.find(a => a.id === cookieAddressId);
        if (found) setSelectedAddress(found);
        else if (addrs[0]) setSelectedAddress(addrs[0]);
      } else if (addrs[0] && !selectedAddress) {
        setSelectedAddress(addrs[0]);
      }

      if (cookieVehicleId) {
        const found = vehs.find(v => v.id === cookieVehicleId);
        if (found) setSelectedVehicle(found);
        else if (vehs[0]) setSelectedVehicle(vehs[0]);
      } else if (vehs[0] && !selectedVehicle) {
        setSelectedVehicle(vehs[0]);
      }

      if (profileRes.data) {
        setLegalName(prev => prev || profileRes.data.full_name || "");
        setPreferredName(prev => prev || profileRes.data.full_name?.split(' ')[0] || "");
        setTechContactPhone(prev => prev || profileRes.data.phone_number || "");
        setGuestEmail(prev => prev || session.user.email || "");
        setGuestName(prev => prev || profileRes.data.full_name || "");
      }
    }
  };

  useEffect(() => {
    async function init() {
      await loadUserData();
      const { data: ratesData } = await supabase.from("shipping_rates").select("*").eq("active", true).limit(1).single();
      setShippingRates(ratesData);
    }
    init();
  }, []);

  useEffect(() => {
    async function fetchAvailability() {
      if (!selectedDate || !requiresInstallation) return;
      setFetchingAvailability(true);
      try {
        const slots = await getAvailableSlots(selectedDate);
        const now = new Date();
        const filteredSlots = slots.map(slot => {
          const [start] = slot.time.split(' - ');
          const [time, period] = start.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          const slotDate = new Date(selectedDate);
          slotDate.setHours(hours, minutes, 0, 0);
          if (slotDate < now) return { ...slot, available: false };
          return slot;
        });
        setAvailableSlots(filteredSlots);
        if (selectedTime) {
          const stillAvailable = filteredSlots.find(s => s.time === selectedTime && s.available);
          if (!stillAvailable) setSelectedTime(null);
        }
      } catch { toast.error("Failed to load availability"); } finally { setFetchingAvailability(false); }
    }
    fetchAvailability();
  }, [selectedDate, requiresInstallation]);

  const runValidation = useCallback(async () => {
    setIsValidating(true);
    try {
      const response = await fetch("/api/validate-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: guestEmail || user?.email,
          fullName: legalName || guestName,
          phone: techContactPhone,
          vehicle: !selectedVehicle && newVehicle.make ? newVehicle : null,
          address: !selectedAddress && newAddress.street ? newAddress : null
        })
      });
      const data = await response.json();
      setValidationErrors(data.errors || {});
      if (data.autoDetectedType && !selectedVehicle && newVehicle.make) {
        setNewVehicle(prev => ({ ...prev, type: data.autoDetectedType }));
      }
    } catch { } finally { setIsValidating(false); }
  }, [guestEmail, user?.email, legalName, guestName, techContactPhone, newVehicle, newAddress, selectedVehicle, selectedAddress]);

  useEffect(() => {
    if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    validationTimeoutRef.current = setTimeout(() => {
      if (guestEmail || guestName || legalName || techContactPhone || newVehicle.make || newAddress.street) runValidation();
    }, 800);
    return () => { if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current); };
  }, [guestEmail, guestName, legalName, techContactPhone, newVehicle, newAddress, runValidation]);

    const calculateShippingFee = () => {
      if (includeFreeInstall) return 0;
      if (!shippingRates) return 0;
      const productsOnly = cart.filter(item => !item.isService);
      if (productsOnly.length === 0) return 0;
      const totalWeight = productsOnly.reduce((sum, item) => sum + (Number(item.weight_lbs || 2.5) * item.quantity), 0);
      let fee = Number(shippingRates.base_fee || 15);
      
      // Residential surcharge only applies to residential addresses
      if (addressType === "residential") {
        fee += Number(shippingRates.residential_surcharge || 6.5);
      }
      
      fee += totalWeight * Number(shippingRates.per_lb_rate || 0.85);
      const state = (selectedAddress?.state || newAddress.state || "").trim().toUpperCase();
      if (state === 'CO') fee += Number(shippingRates.co_retail_delivery_fee || 0.28);
      return fee;
    };

    const getProductsSubtotal = () => {
      return cart.filter(item => !item.isService).reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    };

    const getInstallPackagesSubtotal = () => {
      return cart.filter(item => item.isService).reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    };

  const calculateArrivalFee = () => {
    if (requiresInstallation && paymentMethod === "arrival") return 10;
    return 0;
  };

  const totalWithShipping = getProductsSubtotal() + getInstallPackagesSubtotal() + calculateShippingFee() + calculateArrivalFee();

  const handleCreateAccount = async () => {
    if (!guestEmail || !accountPassword || !guestName) { toast.error("Please fill in all account fields"); return false; }
    if (accountPassword.length < 6) { toast.error("Password must be at least 6 characters"); return false; }
    setCreatingAccount(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: guestEmail, password: accountPassword, options: { data: { full_name: guestName, role: 'customer' } } });
      if (error) throw error;
      if (!data.user) throw new Error("Failed to create account");
      await supabase.from('profiles').upsert({ id: data.user.id, full_name: guestName, email: guestEmail, role: 'customer' });
      setUser(data.user);
      setLegalName(guestName);
      setPreferredName(guestName.split(' ')[0] || guestName);
      toast.success("Account created successfully!");
      return true;
    } catch (e: any) { toast.error(e.message || "Failed to create account"); return false; } finally { setCreatingAccount(false); }
  };

  const validateForm = async () => {
    await runValidation();
    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError);
      return false;
    }
    if (!guestEmail.trim() || !guestName.trim()) { toast.error("Please provide your name and email"); return false; }
    if (!selectedAddress && (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zip_code)) { toast.error("Please provide a complete address"); return false; }
    if (requiresInstallation) {
      if (!user && !accountPassword) { toast.error("Account required for installation - please create a password or sign in"); return false; }
      if (!legalName.trim()) { toast.error("Legal name is required for installation"); return false; }
      if (!preferredName.trim()) { toast.error("Preferred name is required"); return false; }
      if (!techContactPhone.trim()) { toast.error("Contact phone is required for installation"); return false; }
      if (!selectedVehicle && (!newVehicle.make || !newVehicle.model || !newVehicle.year)) { toast.error("Please provide vehicle details for installation"); return false; }
      if (!selectedDate || !selectedTime) { toast.error("Please select a date and time for installation"); return false; }
      if (addressType === 'business' && !businessAuthorized) { toast.error("Please authorize the business installation"); return false; }
    }
    if (!agreedToTOS) { toast.error("Please read and accept the Terms of Service"); return false; }
    return true;
  };

  const handlePayOnArrival = async () => {
      if (cart.length === 0) return;
      const isValid = await validateForm();
      if (!isValid) return;
      if (!user) { const success = await handleCreateAccount(); if (!success) return; }
      setIsLoading(true);
      setError(null);
      try {
        let vehicleId = selectedVehicle?.id;
        let addressId = selectedAddress?.id;
        let currentUser = user;
        if (!currentUser) { const { data: { session } } = await supabase.auth.getSession(); currentUser = session?.user; }
        if (!addressId && currentUser) {
          const { data: aData, error: aErr } = await supabase.from("addresses").insert({ ...newAddress, user_id: currentUser.id }).select().single();
          if (aErr) throw aErr;
          addressId = aData.id;
        }
        if (!vehicleId && currentUser) {
          const { data: vData, error: vErr } = await supabase.from("vehicles").insert({ ...newVehicle, year: parseInt(newVehicle.year), user_id: currentUser.id }).select().single();
          if (vErr) throw vErr;
          vehicleId = vData.id;
        }
        
        const serviceId = cartInstallation?.id || (includeFreeInstall ? FREE_INSTALL_SERVICE_ID : null);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        
        // Create pending booking first
        const { data: bData, error: bErr } = await supabase.from("bookings").insert({
          user_id: currentUser?.id,
          service_id: serviceId,
          vehicle_id: vehicleId || null,
          address_id: addressId,
          booking_date: selectedDate?.toISOString(),
          scheduled_time: selectedTime,
          customer_legal_name: legalName,
          customer_preferred_name: preferredName,
          address_type: addressType,
          business_install_authorized: businessAuthorized,
          tech_contact_phone: techContactPhone,
          payment_method: 'arrival',
          total_amount: totalWithShipping,
          status: 'pending',
          payment_status: 'unpaid',
          expires_at: expiresAt,
          metadata: {
            cart_items: cart.map(item => ({ id: item.id, quantity: item.quantity, name: item.name, price: item.price })),
            shipping_fee: calculateShippingFee(),
            is_free_install: includeFreeInstall
          }
        }).select().single();

        if (bErr) throw bErr;
        setBookingId(bData.id);

        const arrivalFeeRes = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            arrivalFeeOnly: true,
            bookingId: bData.id
          }),
        });
        
        const arrivalFeeData = await arrivalFeeRes.json();
        if (arrivalFeeData.error) throw new Error(arrivalFeeData.error);
        
        setArrivalFeeClientSecret(arrivalFeeData.clientSecret);
        setShowArrivalFeePayment(true);
      } catch (e) { 
        const message = e instanceof Error ? e.message : "Failed to prepare booking"; 
        setError(message); 
        toast.error(message); 
      } finally { setIsLoading(false); }
    };

    const handleArrivalFeeSuccess = async (paymentIntentId: string) => {
      try {
        await fetch("/api/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId, bookingId })
        });
        setPaymentSuccess(true);
        clearCart();
        toast.success("Arrival fee paid! Your installation is confirmed.");
      } catch (err) {
        toast.error("Failed to confirm payment");
      }
    };

    const handleArrivalFeeCancel = () => {
      setShowArrivalFeePayment(false);
      setArrivalFeeClientSecret(null);
      setPendingArrivalBookingId(null);
    };

  const handleCreatePaymentIntent = async () => {
    if (cart.length === 0) return;
    const isValid = await validateForm();
    if (!isValid) return;

    if (!user && requiresInstallation) {
      const success = await handleCreateAccount();
      if (!success) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let vehicleId = selectedVehicle?.id;
      let addressId = selectedAddress?.id;
      let currentUser = user;

      if (!currentUser) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user;
      }

      if (!addressId && currentUser) {
        const { data: aData, error: aErr } = await supabase.from("addresses").insert({ ...newAddress, user_id: currentUser.id }).select().single();
        if (aErr) throw aErr;
        addressId = aData.id;
      }

      if (requiresInstallation && !vehicleId && currentUser) {
        const { data: vData, error: vErr } = await supabase.from("vehicles").insert({ ...newVehicle, year: parseInt(newVehicle.year), user_id: currentUser.id }).select().single();
        if (vErr) throw vErr;
        vehicleId = vData.id;
      }

      const serviceId = cartInstallation?.id || (includeFreeInstall ? FREE_INSTALL_SERVICE_ID : null);
      
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalWithShipping,
          cartItems: cart.map(item => ({ id: item.id, quantity: item.quantity, name: item.name, price: item.price, isService: item.isService })),
          shippingFee: calculateShippingFee(),
          bookingDetails: requiresInstallation ? {
            serviceId,
            vehicleId,
            addressId,
            date: selectedDate?.toISOString(),
            time: selectedTime,
            customerLegalName: legalName,
            customerPreferredName: preferredName,
            addressType,
            businessAuthorized,
            techContactPhone
          } : {
            addressId,
            customerName: guestName,
            customerEmail: guestEmail || user?.email
          }
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setClientSecret(data.clientSecret);
      if (data.bookingId) setBookingId(data.bookingId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create payment intent";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToSplitPayment = async () => {
    const isValid = await validateForm();
    if (!isValid) return;
    if (requiresInstallation && !user) { const success = await handleCreateAccount(); if (!success) return; }
    if (!user && !requiresInstallation) { toast.error("Split payment requires an account"); router.push(`/login?redirect=${encodeURIComponent('/checkout/cart' + (wantsFreeInstall ? '?freeInstall=true' : ''))}`); return; }
    setIsLoading(true);
    try {
      let vehicleId = selectedVehicle?.id;
      let addressId = selectedAddress?.id;
      let currentUser = user;
      if (!currentUser) { const { data: { session } } = await supabase.auth.getSession(); currentUser = session?.user; }
      if (!addressId && currentUser) { const { data: aData, error: aErr } = await supabase.from("addresses").insert({ ...newAddress, user_id: currentUser.id }).select().single(); if (aErr) throw aErr; addressId = aData.id; }
      if (requiresInstallation && !vehicleId && currentUser) { const { data: vData, error: vErr } = await supabase.from("vehicles").insert({ ...newVehicle, year: parseInt(newVehicle.year), user_id: currentUser.id }).select().single(); if (vErr) throw vErr; vehicleId = vData.id; }
      const serviceId = cartInstallation?.id || (includeFreeInstall ? FREE_INSTALL_SERVICE_ID : null);
      const { data: bData, error: bErr } = await supabase.from("bookings").insert({ user_id: currentUser?.id, service_id: serviceId, vehicle_id: vehicleId || null, address_id: addressId, booking_date: requiresInstallation ? selectedDate?.toISOString() : null, scheduled_time: requiresInstallation ? selectedTime : 'No Installation', customer_legal_name: legalName || guestName || null, customer_preferred_name: preferredName || guestName?.split(' ')[0] || null, address_type: addressType, business_install_authorized: businessAuthorized, tech_contact_phone: techContactPhone || null, payment_method: 'now', total_amount: totalWithShipping, status: 'pending', payment_status: 'unpaid' }).select().single();
      if (bErr) throw bErr;
      router.push(`/checkout/split/${bData.id}`);
    } catch (e) { const message = e instanceof Error ? e.message : "Failed to create booking"; toast.error(message); } finally { setIsLoading(false); }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    await fetch("/api/confirm-payment", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ paymentIntentId }) 
    });
    setPaymentSuccess(true);
    clearCart();
    toast.success("Payment successful!");
  };

  const handleSignInSuccess = (userData: { user: any; profile: any; addresses: any[]; vehicles: any[] }) => {
    setUser(userData.user);
    setAddresses(userData.addresses);
    setVehicles(userData.vehicles);
    if (userData.addresses.length > 0) { setSelectedAddress(userData.addresses[0]); setNewAddress({ street: "", city: "", state: "", zip_code: "", label: "Home" }); }
    if (userData.vehicles.length > 0) { setSelectedVehicle(userData.vehicles[0]); setNewVehicle({ make: "", model: "", year: "", type: "Sedan" }); }
    if (userData.profile) { setLegalName(userData.profile.full_name || ""); setPreferredName(userData.profile.full_name?.split(' ')[0] || ""); setTechContactPhone(userData.profile.phone_number || ""); setGuestEmail(userData.user.email || ""); setGuestName(userData.profile.full_name || ""); } else { setGuestEmail(userData.user.email || ""); }
  };

  const handleTermsAccept = () => { setAgreedToTOS(true); setShowTermsModal(false); toast.success("Terms accepted!"); };

  if (paymentSuccess) return <SuccessView withInstall={includeFreeInstall} bookingId={bookingId || undefined} isGuest={!user} />;

  if (totalItems === 0 && !paymentSuccess) return (
    <div className="container mx-auto px-4 py-24 text-center max-w-xl">
      <ShoppingCart className="h-16 w-16 text-foreground/20 mx-auto mb-6" />
      <h1 className="text-3xl font-black uppercase tracking-tight mb-4">Your Cart is Empty</h1>
      <p className="text-foreground/60 mb-8">Add some premium electronics to your cart to proceed with checkout.</p>
      <Button asChild className="blue-gradient text-white font-bold h-12 px-8"><Link href="/products">Browse Products</Link></Button>
    </div>
  );

  return (
    <>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <AnimatePresence>
          {showSignInModal && <SignInModal isOpen={showSignInModal} onClose={() => setShowSignInModal(false)} onSuccess={handleSignInSuccess} />}
          {showTermsModal && <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} onAccept={handleTermsAccept} includeFreeInstall={includeFreeInstall} />}
        </AnimatePresence>

        <Link href="/products" className="inline-flex items-center text-sm font-bold text-primary mb-8 hover:opacity-70 transition-opacity"><ArrowLeft className="h-4 w-4 mr-2" />Back to Products</Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h1 className="text-3xl font-black uppercase tracking-tight italic">Checkout</h1>
              <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{totalItems} Items</div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-primary">Contact Information</h2>
              {user ? (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500" /><div><p className="font-bold text-sm">{user.email}</p><p className="text-[10px] text-foreground/60">Signed in</p></div></div>
              ) : (
                <div className="space-y-3">
                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" /><Input placeholder="Full Name (First & Last) *" value={guestName} onChange={(e) => setGuestName(e.target.value)} className={`bg-white/5 border-white/10 h-12 pl-10 ${validationErrors.fullName ? 'border-red-500/50' : ''}`} /></div>
                    {validationErrors.fullName && <p className="text-[10px] text-red-400 font-bold">{validationErrors.fullName}</p>}
                    <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" /><Input type="email" placeholder="Email Address *" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className={`bg-white/5 border-white/10 h-12 pl-10 ${validationErrors.email ? 'border-red-500/50' : ''}`} /></div>
                    {validationErrors.email && <p className="text-[10px] text-red-400 font-bold">{validationErrors.email}</p>}
                    <p className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest">{requiresInstallation ? 'Account required for installation scheduling' : 'Checkout as guest or sign in'}</p>
                    <button onClick={() => setShowSignInModal(true)} className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-widest hover:underline"><LogIn className="h-3 w-3" />Already have an account? Sign in</button>
                  </div>
                )}
              </div>

                {hasInstallation && cartInstallation && (
                  <div className="p-6 rounded-2xl border-2 border-primary/50 bg-primary/5">
                    <div className="flex items-center gap-3 mb-2">
                      <Wrench className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-black uppercase text-sm">Install Package</h3>
                        <p className="text-[10px] text-foreground/60">{cartInstallation.name}</p>
                      </div>
                      <span className="ml-auto text-xl font-black text-primary">${cartInstallation.price.toLocaleString()}</span>
                    </div>
                    <p className="text-[9px] text-primary/80 font-bold uppercase tracking-wider">Install package included in cart - complete booking details below</p>
                  </div>
                )}

              {!hasInstallation && (
                <div className={`p-6 rounded-2xl border-2 transition-all ${includeFreeInstall ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3"><Gift className={`h-6 w-6 ${includeFreeInstall ? 'text-green-500' : 'text-foreground/40'}`} /><div><h3 className="font-black uppercase text-sm">Free Product Installation</h3><p className="text-[10px] text-foreground/60">Schedule professional installation at no extra cost</p></div></div>
                    <button onClick={() => setIncludeFreeInstall(!includeFreeInstall)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${includeFreeInstall ? 'bg-green-500 text-white' : 'bg-white/10 text-foreground/60 hover:bg-white/20'}`}>{includeFreeInstall ? 'Included' : 'Add Free Install'}</button>
                  </div>
                  {includeFreeInstall && <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-2"><Truck className="h-4 w-4 text-green-400 shrink-0 mt-0.5" /><p className="text-[9px] text-green-400 font-bold uppercase tracking-wider">No shipping fees! Our technician will bring your products directly to your installation appointment.</p></div>}
                  {!includeFreeInstall && <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"><p className="text-[9px] text-amber-400/80 font-bold uppercase tracking-wider"><AlertCircle className="h-3 w-3 inline mr-1" />If you don&apos;t select free installation now, a separate service fee will apply later.</p></div>}
                </div>
              )}

              {requiresInstallation && !user && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border-2 border-primary/50 bg-primary/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><UserPlus className="h-6 w-6 text-primary" /><div><h3 className="font-black uppercase text-sm">Create Account</h3><p className="text-[10px] text-foreground/60">Required for installation scheduling & tracking</p></div></div>
                  <button onClick={() => setShowSignInModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-[9px] font-black uppercase tracking-widest"><LogIn className="h-3 w-3" />Sign In Instead</button>
                </div>
                <div className="space-y-3">
                  <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" /><Input type={showPassword ? "text" : "password"} placeholder="Create Password (min 6 chars) *" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} className="bg-white/5 border-white/10 h-12 pl-10 pr-10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
                  <p className="text-[8px] text-foreground/40 font-bold uppercase tracking-widest">Your account lets you track orders, manage installations, and rebook services</p>
                </div>
              </motion.div>
            )}

              {requiresInstallation && (
                <>
                  <div className="space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-primary">Client Profile</h2>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" /><Input placeholder="Legal Full Name (First & Last) *" value={legalName} onChange={(e) => setLegalName(e.target.value)} className={`bg-white/5 border-white/10 h-12 pl-10 ${validationErrors.fullName ? 'border-red-500/50' : ''}`} /></div>
                    {validationErrors.fullName && <p className="text-[10px] text-red-400 font-bold">{validationErrors.fullName}</p>}
                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" /><Input placeholder="Preferred Name *" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} className="bg-white/5 border-white/10 h-12 pl-10" /></div>
                    <div className="relative"><Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" /><Input placeholder="Phone (10 digits) *" value={techContactPhone} onChange={(e) => setTechContactPhone(e.target.value)} className={`bg-white/5 border-white/10 h-12 pl-10 ${validationErrors.phone ? 'border-red-500/50' : ''}`} /></div>
                    {validationErrors.phone && <p className="text-[10px] text-red-400 font-bold">{validationErrors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xs font-black uppercase tracking-widest text-primary">Vehicle Details</h2>
                  {vehicles.length > 0 && (
                    <div className="grid grid-cols-1 gap-2">
                      {vehicles.map((v) => (
                        <div key={v.id} onClick={() => { setSelectedVehicle(v); setNewVehicle({ make: "", model: "", year: "", type: "Sedan" }); }} className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${selectedVehicle?.id === v.id ? "border-primary bg-primary/5" : "border-white/5 hover:border-white/20"}`}>
                          <p className="font-bold text-sm">{v.year} {v.make} {v.model}</p><p className="text-[10px] text-foreground/60">{v.type}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setSelectedVehicle(null)} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all ${!selectedVehicle ? "border-primary bg-primary/5 text-primary" : "border-white/10 text-foreground/40 hover:border-white/30"}`}><Plus className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">New Vehicle</span></button>
                  {!selectedVehicle && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Make (e.g. Toyota)" value={newVehicle.make} onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})} className={`bg-white/5 border-white/10 h-10 ${validationErrors.vehicle ? 'border-red-500/50' : ''}`} />
                          <Input placeholder="Model (e.g. Camry)" value={newVehicle.model} onChange={(e) => { const model = e.target.value; const detectedType = detectVehicleType(model); setNewVehicle({...newVehicle, model, type: detectedType}); }} className={`bg-white/5 border-white/10 h-10 ${validationErrors.vehicle ? 'border-red-500/50' : ''}`} />
                        <Input placeholder="Year (e.g. 2024)" value={newVehicle.year} onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})} className="bg-white/5 border-white/10 h-10" />
                        <select value={newVehicle.type} onChange={(e) => setNewVehicle({...newVehicle, type: e.target.value})} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm">
                          <option value="Sedan">Sedan</option>
                          <option value="SUV">SUV</option>
                          <option value="Truck">Truck</option>
                          <option value="Coupe">Coupe</option>
                          <option value="Motorcycle">Motorcycle</option>
                          <option value="Marine">Marine/Boat</option>
                        </select>
                      </div>
                      {validationErrors.vehicle && <p className="text-[10px] text-red-400 font-bold">{validationErrors.vehicle}</p>}
                      {newVehicle.type && (
                        <div className="flex items-center gap-2 text-[9px] text-foreground/50 font-bold uppercase tracking-widest">
                          {newVehicle.type === 'Motorcycle' && <><Bike className="h-3 w-3 text-primary" />Motorcycle detected</>}
                          {newVehicle.type === 'Marine' && <><Anchor className="h-3 w-3 text-primary" />Marine vessel detected</>}
                          {!['Motorcycle', 'Marine'].includes(newVehicle.type) && <><CheckCircle className="h-3 w-3 text-green-500" />Type: {newVehicle.type}</>}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h2 className="text-xs font-black uppercase tracking-widest text-primary">Installation Schedule</h2>
                    <CalendarComponent 
                      mode="single" 
                      selected={selectedDate} 
                      onSelect={setSelectedDate} 
                      disabled={(date) => { const today = new Date(); today.setHours(0,0,0,0); return date < today; }} 
                      className="rounded-2xl border border-white/5 bg-white/5" 
                    />
                  {selectedDate && (
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/60">Available Windows</h3>
                      {fetchingAvailability ? <div className="flex items-center gap-2 text-sm text-foreground/40"><Loader2 className="h-4 w-4 animate-spin" />Checking...</div> : (
                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                          {availableSlots.map((slot) => (
                            <button key={slot.time} disabled={!slot.available} onClick={() => setSelectedTime(slot.time)} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${selectedTime === slot.time ? "border-primary bg-primary/10 text-primary" : !slot.available ? "border-white/5 bg-white/5 text-foreground/20 cursor-not-allowed opacity-50" : "border-white/5 hover:border-white/20 text-foreground/60"}`}>
                              <span className="font-bold text-sm">{slot.time}</span>
                              {!slot.available ? <span className="text-[10px] uppercase font-black tracking-widest opacity-50">Unavailable</span> : <div className={`h-2 w-2 rounded-full ${selectedTime === slot.time ? "bg-primary" : "bg-green-500"}`} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-primary">Location Type</h2>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setAddressType("residential")} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${addressType === "residential" ? "border-primary bg-primary/10" : "border-white/5 bg-white/5"}`}><Home className="h-6 w-6" /><span className="text-[10px] font-black uppercase tracking-widest">Residential</span></button>
                <button onClick={() => setAddressType("business")} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${addressType === "business" ? "border-primary bg-primary/10" : "border-white/5 bg-white/5"}`}><Building2 className="h-6 w-6" /><span className="text-[10px] font-black uppercase tracking-widest">Business</span></button>
              </div>
              {addressType === 'business' && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-start gap-3"><AlertTriangle className="h-5 w-5 text-primary shrink-0" /><p className="text-[9px] font-bold uppercase leading-relaxed text-foreground/60">By selecting a business location, you acknowledge that conditions are appropriate for automotive installation and assume full responsibility.</p></div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="business-auth" checked={businessAuthorized} onChange={(e) => setBusinessAuthorized(e.target.checked)} className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary" /><label htmlFor="business-auth" className="text-[10px] font-black uppercase tracking-widest text-primary cursor-pointer">I assume legal responsibility</label></div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-primary">{includeFreeInstall ? 'Installation Address' : 'Shipping Address'}</h2>
              {addresses.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {addresses.map((a) => (
                    <div key={a.id} onClick={() => { setSelectedAddress(a); setNewAddress({ street: "", city: "", state: "", zip_code: "", label: "Home" }); }} className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${selectedAddress?.id === a.id ? "border-primary bg-primary/5" : "border-white/5 hover:border-white/20"}`}>
                      <div className="flex items-center justify-between"><div><p className="font-bold text-sm">{a.street}</p><p className="text-[10px] text-foreground/60 uppercase font-bold">{a.city}, {a.state} {a.zip_code}</p></div>{selectedAddress?.id === a.id && <CheckCircle className="h-4 w-4 text-primary" />}</div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setSelectedAddress(null)} className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all ${!selectedAddress ? "border-primary bg-primary/5 text-primary" : "border-white/10 text-foreground/40 hover:border-white/30"}`}><Plus className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">Use New Address</span></button>
              {!selectedAddress && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                  <Input placeholder="Street Address (with number)" value={newAddress.street} onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} className={`bg-white/5 border-white/10 h-12 ${validationErrors.address ? 'border-red-500/50' : ''}`} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} className="bg-white/5 border-white/10 h-12" />
                    <Input placeholder="State (e.g. CO)" value={newAddress.state} onChange={(e) => setNewAddress({...newAddress, state: e.target.value})} className={`bg-white/5 border-white/10 h-12 ${validationErrors.address ? 'border-red-500/50' : ''}`} />
                  </div>
                  <Input placeholder="Zip Code (e.g. 80202)" value={newAddress.zip_code} onChange={(e) => setNewAddress({...newAddress, zip_code: e.target.value})} className={`bg-white/5 border-white/10 h-12 ${validationErrors.address ? 'border-red-500/50' : ''}`} />
                  {validationErrors.address && <p className="text-[10px] text-red-400 font-bold">{validationErrors.address}</p>}
                </motion.div>
              )}
            </div>

              <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-primary">Cart Items</h2>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.filter(item => !item.isService).map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/20 transition-all">
                      <div className="h-16 w-16 relative rounded-xl overflow-hidden shrink-0"><Image src={item.image_url} alt={item.name} fill className="object-cover" /></div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-sm italic">{item.name}</h3>
                          <span className="font-black text-primary text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {includeFreeInstall && (
                          <div className="flex items-center gap-2 mt-1">
                            <Gift className="h-3 w-3 text-green-400" />
                            <span className="text-[9px] text-green-400 font-bold uppercase tracking-widest">Free Install Included</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"><Minus className="h-3 w-3" /></button>
                            <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"><Plus className="h-3 w-3" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cart.filter(item => item.isService).map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 group hover:border-primary/40 transition-all">
                      <div className="h-16 w-16 relative rounded-xl overflow-hidden shrink-0 bg-primary/20 flex items-center justify-center"><Wrench className="h-8 w-8 text-primary" /></div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[8px] text-primary font-black uppercase tracking-widest">Install Package</span>
                            <h3 className="font-bold text-sm italic">{item.name}</h3>
                          </div>
                          <span className="font-black text-primary text-sm">${item.price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-end mt-2">
                          <button onClick={() => removeFromCart(item.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2"><FileText className="h-3 w-3" />Order Summary</h3>
                    
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {cart.map((item) => {
                        const expandedLines = [];
                        for (let i = 0; i < item.quantity; i++) {
                          expandedLines.push(
                            <div key={`${item.id}-${i}`} className="space-y-1 pb-2 border-b border-white/5 last:border-0 last:pb-0">
                              <div className="flex justify-between text-[10px] font-bold text-foreground/60">
                                <span className="truncate max-w-[180px] flex items-center gap-2">
                                  {item.isService ? <Wrench className="h-3 w-3 text-primary" /> : <div className="h-1 w-1 rounded-full bg-foreground/30" />}
                                  {item.name}
                                </span>
                                <span>${Number(item.price).toFixed(2)}</span>
                              </div>
                              {!item.isService && includeFreeInstall && (
                                <div className="flex justify-between text-[9px] font-bold text-green-400 pl-4">
                                  <span className="flex items-center gap-1"><Gift className="h-2.5 w-2.5" />Free Installation + {item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}</span>
                                  <span>$0.00</span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return expandedLines;
                      })}
                    </div>
                    
                    <div className="border-t border-white/10 pt-2 mt-4 space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-foreground/40">
                        <span>Products Subtotal</span>
                        <span>${getProductsSubtotal().toFixed(2)}</span>
                      </div>
                      {getInstallPackagesSubtotal() > 0 && (
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-foreground/40">
                          <span>Install Packages</span>
                          <span>${getInstallPackagesSubtotal().toFixed(2)}</span>
                        </div>
                      )}
                      {includeFreeInstall ? (
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-green-400">
                          <span>Shipping (Tech Delivery)</span>
                          <span>$0.00</span>
                        </div>
                      ) : getProductsSubtotal() > 0 ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-foreground/40">
                            <span>Shipping & Handling</span>
                            <span className="text-primary">${calculateShippingFee().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-foreground/30 px-1 italic">
                            <span>Based on {addressType} address {(selectedAddress?.state || newAddress.state) && `in ${selectedAddress?.state || newAddress.state}`}</span>
                          </div>
                        </div>
                      ) : null}
                      {requiresInstallation && paymentMethod === 'arrival' && (
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-amber-400">
                          <span>Pay on Arrival Fee</span>
                          <span>$10.00</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                      <span className="text-sm font-black uppercase tracking-widest italic">Grand Total</span>
                      <span className="text-4xl font-black text-primary italic leading-none">${totalWithShipping.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
            </div>

            <div className="glass-card p-8 rounded-3xl border border-white/10 h-fit sticky top-24">
              <div className="mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Secure Checkout</h2>
                <p className="text-sm text-foreground/60">{requiresInstallation ? (hasInstallation ? 'Products + Installation' : 'Products + Free Installation') : user ? 'Product Order' : 'Guest Checkout'}</p>
              </div>

                <AnimatePresence mode="wait">
                  {(!selectedAddress && !newAddress.zip_code) ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center"><MapPin className="h-10 w-10 text-amber-500/30 mx-auto mb-4" /><p className="text-sm text-amber-500 font-bold uppercase tracking-widest">Address Required</p><p className="text-[10px] text-foreground/40 mt-1">Please provide an address to enable payment.</p></motion.div>
                  ) : isLoading || creatingAccount ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16"><Loader2 className="h-10 w-10 animate-spin text-primary mb-4" /><p className="text-sm text-foreground/60">{creatingAccount ? 'Creating account...' : 'Preparing checkout...'}</p></motion.div>
                  ) : error ? (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6"><div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"><AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" /><p className="text-sm text-red-400 font-medium">{error}</p></div><Button onClick={handleCreatePaymentIntent} className="w-full blue-gradient text-white font-bold h-12">Try Again</Button></motion.div>
                  ) : showArrivalFeePayment && arrivalFeeClientSecret ? (
                    <motion.div key="arrival-fee-payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                      <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                        <div className="flex items-center gap-3 mb-4">
                          <CreditCard className="h-5 w-5 text-amber-400" />
                          <div>
                            <h4 className="text-sm font-black uppercase tracking-tight">Pay Arrival Fee</h4>
                            <p className="text-[10px] text-foreground/40 uppercase font-bold">$10.00 Required to Book</p>
                          </div>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                          <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider leading-relaxed">
                            This $10.00 arrival fee secures your appointment. The remaining balance of ${(totalWithShipping - 10).toFixed(2)} will be due upon the technician&apos;s arrival before work begins.
                          </p>
                        </div>

                        <Elements stripe={stripePromise} options={{ clientSecret: arrivalFeeClientSecret, appearance: { theme: "night", variables: { colorPrimary: "#f59e0b", colorBackground: "#1a1a1a", colorText: "#ffffff", borderRadius: "12px" } } }}>
                          <ArrivalFeeForm clientSecret={arrivalFeeClientSecret} amount={10} onSuccess={handleArrivalFeeSuccess} onCancel={handleArrivalFeeCancel} />
                        </Elements>
                      </div>
                    </motion.div>
                  ) : clientSecret ? (
                    <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night", variables: { colorPrimary: "#1a9999", colorBackground: "#1a1a1a", colorText: "#ffffff", borderRadius: "12px" } } }}>
                        <PaymentForm clientSecret={clientSecret} amount={totalWithShipping} onSuccess={handlePaymentSuccess} agreedToTOS={agreedToTOS} />
                      </Elements>
                    </motion.div>
                  ) : (
                    <motion.div key="checkout-options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                      {requiresInstallation && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Payment Method</h4>
                          <button onClick={() => setPaymentMethod("now")} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === "now" ? "border-primary bg-primary/10" : "border-white/5 hover:border-white/20"}`}>
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5" />
                              <span className="text-xs font-black uppercase tracking-widest">Pay Now</span>
                            </div>
                            {paymentMethod === "now" && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </button>
                          <button onClick={() => setPaymentMethod("arrival")} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === "arrival" ? "border-amber-500 bg-amber-500/10" : "border-white/5 hover:border-white/20"}`}>
                            <div className="text-left">
                              <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5" />
                                <span className="text-xs font-black uppercase tracking-widest">Pay on Arrival</span>
                              </div>
                              <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-black mt-1 inline-block ml-8">$10.00 FEE DUE NOW</span>
                            </div>
                            {paymentMethod === "arrival" && <div className="h-2 w-2 rounded-full bg-amber-500" />}
                          </button>
                          
                          {paymentMethod === "arrival" && (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                              <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider leading-relaxed">
                                Pay $10.00 now to secure your appointment. Remaining balance of ${(totalWithShipping - 10).toFixed(2)} due when technician arrives.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-start gap-3">
                          <input type="checkbox" id="tos" checked={agreedToTOS} onChange={() => { if (!agreedToTOS) setShowTermsModal(true); else setAgreedToTOS(false); }} className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary mt-1" />
                          <label htmlFor="tos" className="text-[9px] font-black uppercase tracking-widest text-foreground/60 leading-relaxed cursor-pointer">
                            I accept the <button type="button" onClick={() => setShowTermsModal(true)} className="text-primary hover:underline">Terms of Service</button> {requiresInstallation && 'and understand the $20.00 restocking fee applies to all cancellations within 24 hours of the installation window.'}
                          </label>
                        </div>
                      </div>

                      {!agreedToTOS && <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3"><Shield className="h-5 w-5 text-amber-400 shrink-0" /><p className="text-sm text-amber-400">Please read and accept the Terms of Service to proceed.</p></div>}
                      {requiresInstallation && !user && !accountPassword && <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3"><UserPlus className="h-5 w-5 text-primary shrink-0" /><p className="text-sm text-primary">Create a password above or sign in to proceed with installation booking.</p></div>}
                      {Object.keys(validationErrors).length > 0 && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"><AlertCircle className="h-5 w-5 text-red-400 shrink-0" /><p className="text-sm text-red-400">Please fix the validation errors above before proceeding.</p></div>}

                      {paymentMethod === "now" ? (
                        <Button onClick={handleCreatePaymentIntent} className="w-full blue-gradient text-white border-none h-16 text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/30 rounded-xl" disabled={!agreedToTOS || isLoading || (requiresInstallation && !user && !accountPassword) || Object.keys(validationErrors).length > 0}>
                          {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (<><CreditCard className="mr-2 h-5 w-5" />Pay ${totalWithShipping.toFixed(2)}</>)}
                        </Button>
                      ) : (
                        <Button onClick={handlePayOnArrival} className="w-full bg-amber-500 hover:bg-amber-600 text-white border-none h-16 text-lg font-black uppercase tracking-widest shadow-2xl shadow-amber-500/30 rounded-xl" disabled={!agreedToTOS || isLoading || !user && !accountPassword || Object.keys(validationErrors).length > 0}>
                          {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (<><Clock className="mr-2 h-5 w-5" />Pay $10.00 Now to Book</>)}
                        </Button>
                      )}

                      {user && paymentMethod === "now" && <Button variant="outline" onClick={handleGoToSplitPayment} disabled={!agreedToTOS || isLoading} className="w-full border-primary/20 text-primary hover:bg-primary/10 h-14 rounded-xl font-black uppercase tracking-widest text-[10px]">Initialize Split Payment</Button>}
                    </motion.div>
                  )}
                </AnimatePresence>

              <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><span className="text-[9px] font-bold uppercase tracking-tight text-foreground/40">Secure SSL</span></div>
                <div className="flex items-center gap-2 justify-end"><Lock className="h-4 w-4 text-primary" /><span className="text-[9px] font-bold uppercase tracking-tight text-foreground/40">Encrypted</span></div>
              </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CartCheckoutPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <CartCheckoutContent />
    </Suspense>
  );
}
// Trigger recompile
