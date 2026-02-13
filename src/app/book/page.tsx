"use client";

import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Car, MapPin, Calendar, CreditCard, ChevronRight, ChevronLeft, Loader2, CheckCircle2, Speaker, ShieldCheck, ShoppingBag, Wrench, ShoppingCart, XCircle, Shield, Trash2, Info, Building2, Home, User, Smartphone, AlertTriangle, UserCheck, Clock, AlertCircle, Bike, Anchor, Scale, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import Link from "next/link";
import { getAvailableSlots, Slot } from "@/lib/availability";
import { useCart } from "@/context/CartContext";
import { getStripe } from "@/lib/stripe-client";
import { detectVehicleType } from "@/lib/vehicle-type-detector";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = getStripe();

const FREE_INSTALL_SERVICE_ID = "95b90d6a-3d6c-4a33-af81-000da028dae7";

interface EmbeddedCheckoutFormProps {
  clientSecret: string;
  bookingId: string;
  amount: number;
  onSuccess: (bookingId: string) => void;
  onCancel: () => void;
}

function TermsModal({ isOpen, onClose, onAccept, includeFreeInstall }: { isOpen: boolean; onClose: () => void; onAccept: () => void; includeFreeInstall: boolean; }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 20) setHasScrolledToBottom(true);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
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
          <section className="space-y-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <h4 className="text-sm font-black uppercase tracking-widest text-amber-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Cancellation Policy</h4>
            <p className="text-sm text-amber-400/80 leading-relaxed font-bold">A $20.00 restocking fee applies to all cancellations within 24 hours of the installation window. By proceeding, you acknowledge and accept this policy.</p>
          </section>
          <section className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs">5</span>Customer-Provided Equipment</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">While we install customer-provided equipment, we do not warrant the functionality of such equipment. If equipment is found to be defective during or after installation, additional labor charges may apply for diagnosis or replacement.</p>
          </section>
        </div>

        <div className="p-6 border-t border-white/10 shrink-0 space-y-4">
          {!hasScrolledToBottom && <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest text-center"><AlertCircle className="h-3 w-3 inline mr-1" />Please scroll to read all terms before accepting</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 h-12 border-white/10">Cancel</Button>
            <Button onClick={onAccept} disabled={!hasScrolledToBottom} className="flex-1 h-12 blue-gradient text-white font-black uppercase tracking-widest">{hasScrolledToBottom ? (<><CheckCircle2 className="h-4 w-4 mr-2" />I Accept</>) : "Scroll to Accept"}</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EmbeddedCheckoutForm({ clientSecret, bookingId, amount, onSuccess, onCancel }: EmbeddedCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: { type: string; code?: string; decline_code?: string; message?: string }) => {
    if (err.type === 'card_error' || err.type === 'validation_error') {
      if (err.decline_code === 'insufficient_funds') {
        return 'Your payment method has insufficient funds. Please try a different payment method.';
      }
      if (err.decline_code === 'generic_decline' || err.code === 'payment_intent_authentication_failure') {
        return 'Your payment was declined. Please check your payment app and try again.';
      }
      if (err.code === 'payment_method_not_available') {
        return 'This payment method is not available. Please try a different payment method.';
      }
      return err.message || 'Your payment was declined. Please try a different payment method.';
    }
    return err.message || 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (submitError) {
      const errorMessage = getErrorMessage(submitError as { type: string; code?: string; decline_code?: string; message?: string });
      setError(errorMessage);
      setProcessing(false);
      return;
    }

    if (paymentIntent) {
      if (paymentIntent.status === "succeeded") {
        const res = await fetch("/api/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id, bookingId }),
        });

        if (res.ok) {
          onSuccess(bookingId);
        } else {
          setError("Payment succeeded but failed to update booking. Please contact support.");
        }
      } else if (paymentIntent.status === "requires_action") {
        setError("Additional verification required. Please complete authentication in your payment app and try again.");
      } else if (paymentIntent.status === "requires_payment_method") {
        setError("Payment failed. Please try a different payment method.");
      } else {
        setError(`Payment status: ${paymentIntent.status}. Please try again or contact support.`);
      }
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 max-h-[400px] overflow-y-auto">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 h-14 border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-xs"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || processing}
          className="flex-1 h-14 blue-gradient text-white border-none font-black uppercase tracking-widest shadow-xl shadow-primary/20"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-foreground/40">
        <Shield className="h-4 w-4" />
        <span>Secured by Stripe. Your payment info is never stored.</span>
      </div>
    </form>
  );
}

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialServiceId = searchParams.get("serviceId");
  const editId = searchParams.get("edit");
  const { cart, totalPrice: cartTotal, clearCart, removeFromCart } = useCart();
  const [user, setUser] = useState<any>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"now" | "arrival">("now");
  const [installRequired, setInstallRequired] = useState(true);
  const [agreedToTOS, setAgreedToTOS] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isExistingBookingPaid, setIsExistingBookingPaid] = useState(false);
  const [originalPaymentMethod, setOriginalPaymentMethod] = useState<"now" | "arrival" | null>(null);
  const [originalBookingDate, setOriginalBookingDate] = useState<string | null>(null);
  const [originalScheduledTime, setOriginalScheduledTime] = useState<string | null>(null);
  const [shippingRates, setShippingRates] = useState<any>(null);

  // New Fields
  const [legalName, setLegalName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [addressType, setAddressType] = useState<"residential" | "business">("residential");
  const [businessAuthorized, setBusinessAuthorized] = useState(false);
  const [techContactPhone, setTechContactPhone] = useState("");

  // Stripe State
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [arrivalFeeClientSecret, setArrivalFeeClientSecret] = useState<string | null>(null);
  const [showArrivalFeePayment, setShowArrivalFeePayment] = useState(false);
  const [pendingArrivalBookingId, setPendingArrivalBookingId] = useState<string | null>(null);

  // Data from Supabase
  const [services, setServices] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);

  // Selection state
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [fetchingAvailability, setFetchingAvailability] = useState(false);

  // Success state from URL
  const success = searchParams.get("success") === "true";
  const bookingId = searchParams.get("booking_id");
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  useEffect(() => {
    if (success && bookingId) {
      const fetchConfirmedBooking = async () => {
        const { data } = await supabase
          .from("bookings")
          .select(`
            *,
            service:service_id (name),
            vehicle:vehicle_id (make, model, year, type),
            address:address_id (street, city, state, zip_code),
            assigned_tech:assigned_tech_id (full_name, map_id)
          `)
          .eq("id", bookingId)
          .single();
        setConfirmedBooking(data);
        if (data) clearCart();
      };
      fetchConfirmedBooking();

      const interval = setInterval(fetchConfirmedBooking, 10000);
      return () => clearInterval(interval);
    }
  }, [success, bookingId, clearCart]);

  // Pricing calculation
  const calculateTimeFee = () => {
    if (!shippingRates) return 0;
    const isServiceInstallation = selectedService && installRequired;
    if (isServiceInstallation) return 0;
    return Number(shippingRates.time_fee || 0);
  };

  const calculateShippingFee = () => {
    if (!shippingRates) return 0;
    
    const isServiceInstallation = selectedService && installRequired;
    if (isServiceInstallation) return 0;
    
    const serviceWeight = Number(selectedService?.weight_lbs || 0);
    const cartWeight = cart.reduce((sum, item) => sum + (Number(item.weight_lbs || 2.5) * item.quantity), 0);
    const totalWeight = serviceWeight + cartWeight;
    
    const effectiveWeight = (cart.length > 0 && totalWeight === 0) ? 2.5 : totalWeight;
    
    let fee = Number(shippingRates.base_fee || 15.00);
    fee += Number(shippingRates.residential_surcharge || 6.50);
    fee += effectiveWeight * Number(shippingRates.per_lb_rate || 0.85);
    
    const state = selectedAddress?.state || newAddress.state;
    if (state?.toUpperCase() === 'CO') {
      fee += Number(shippingRates.co_retail_delivery_fee || 0.28);
    }
    
    return fee;
  };

  const calculateBookingTotal = () => {
    let total = Number(selectedService?.base_price || 0);
    
    const isServiceInstallation = selectedService && installRequired;
    
    if (!isServiceInstallation) {
      if (selectedService && !installRequired) total -= 50;
      total += calculateShippingFee();
      total += calculateTimeFee();
    }
    
    if (paymentMethod === "arrival" && installRequired) total += 10;

    // Add reschedule fee if applicable
    if (editId && installRequired && selectedTime !== originalScheduledTime) {
      const originalTime = parseSlotStartTime(originalScheduledTime, originalBookingDate);
      if (originalTime && (originalTime.getTime() - Date.now()) < 3600000) {
        total += 5; // $5 Reschedule Fee
      }
    }
    
    return total;
  };

  const parseSlotStartTime = (slot: string | null, dateStr: string | null) => {
    if (!slot || !dateStr) return null;
    const [start] = slot.split(' - ');
    const [time, period] = start.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const calculateGrandTotal = () => {
    return calculateBookingTotal() + (paymentMethod === "now" ? cartTotal : 0);
  };

  // New entry state
  const [newVehicle, setNewVehicle] = useState({ make: "", model: "", year: "", trim: "", color: "", type: "Sedan" });
  const [newAddress, setNewAddress] = useState({ street: "", city: "", state: "", zip_code: "", label: "Home" });

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        const { data: servicesData, error: servicesError } = await supabase.from("services").select("*").eq("active", true);
        if (servicesError) throw servicesError;
        setServices(servicesData || []);

        const { data: ratesData } = await supabase.from("shipping_rates").select("*").eq("active", true).limit(1).single();
        setShippingRates(ratesData);

        if (initialServiceId && servicesData) {
          setSelectedService(servicesData.find(s => s.id === initialServiceId));
        }

        if (currentUser) {
          const [vehiclesRes, addressesRes, profileRes] = await Promise.all([
            supabase.from("vehicles").select("*").eq("user_id", currentUser.id),
            supabase.from("addresses").select("*").eq("user_id", currentUser.id),
            supabase.from("profiles").select("*").eq("id", currentUser.id).single()
          ]);
          setVehicles(vehiclesRes.data || []);
          setAddresses(addressesRes.data || []);
          if (profileRes.data) {
            setLegalName(profileRes.data.full_name || "");
            setTechContactPhone(profileRes.data.phone_number || "");
          }

          if (editId) {
            const { data: editBooking, error: editError } = await supabase
              .from("bookings")
              .select("*, service:service_id(*), vehicle:vehicle_id(*), address:address_id(*)")
              .eq("id", editId)
              .single();
            
            if (editError) {
              console.error("Error fetching booking for edit:", editError);
              toast.error("Failed to load booking for editing");
            } else if (editBooking) {
              setSelectedService(editBooking.service);
              setSelectedVehicle(editBooking.vehicle);
              setSelectedAddress(editBooking.address);
              setLegalName(editBooking.customer_legal_name || "");
              setPreferredName(editBooking.customer_preferred_name || "");
              setAddressType(editBooking.address_type || "residential");
              setBusinessAuthorized(editBooking.business_install_authorized || false);
              setTechContactPhone(editBooking.tech_contact_phone || "");

              if (editBooking.booking_date) {
                setSelectedDate(new Date(editBooking.booking_date));
                setOriginalBookingDate(editBooking.booking_date);
              }
              if (editBooking.scheduled_time && editBooking.scheduled_time !== 'No Installation') {
                setSelectedTime(editBooking.scheduled_time);
                setOriginalScheduledTime(editBooking.scheduled_time);
                setInstallRequired(true);
              } else {
                setInstallRequired(false);
              }
              setPaymentMethod(editBooking.payment_method);
              setOriginalPaymentMethod(editBooking.payment_method);
              setIsExistingBookingPaid(editBooking.payment_status === 'paid');
              setStep(3);
            }
          }
        }
      } catch (err) {
        console.error("BookingPage: Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [initialServiceId, editId]);

  useEffect(() => {
    async function fetchAvailability() {
      if (!selectedDate || !installRequired) return;
      setFetchingAvailability(true);
      try {
        const slots = await getAvailableSlots(selectedDate);
        
        // Filter out past slots if the selected date is today
        const now = new Date();
        const filteredSlots = slots.map(slot => {
          const slotStartTime = parseSlotStartTime(slot.time, selectedDate.toISOString());
          if (slotStartTime && slotStartTime < now) {
            return { ...slot, available: false };
          }
          return slot;
        });

        setAvailableSlots(filteredSlots);
        
        if (selectedTime) {
          const stillAvailable = filteredSlots.find(s => s.time === selectedTime && s.available);
          if (!stillAvailable) setSelectedTime(null);
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
        toast.error("Failed to load availability");
      } finally {
        setFetchingAvailability(false);
      }
    }
    fetchAvailability();
  }, [selectedDate, installRequired]);

  const nextStep = () => {
    if (step === 1 && !selectedService && cart.length === 0) return toast.error("Please select an installation or add products to cart");
    if (step === 2) {
      if (!selectedVehicle) {
        if (!newVehicle.make.trim() || !newVehicle.model.trim() || !newVehicle.year.trim() || !newVehicle.type) {
          return toast.error("Please complete all vehicle fields including car type");
        }
        const year = parseInt(newVehicle.year);
        if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
          return toast.error("Please enter a valid vehicle year");
        }
      }
    }
    if (step === 3) {
      if (!legalName.trim()) return toast.error("Customer Legal Name is mandatory");
      if (!preferredName.trim()) return toast.error("Preferred Name is mandatory");
      if (installRequired && !techContactPhone.trim()) return toast.error("Technician Contact Phone is mandatory for installations");
      
      if (addressType === 'business' && !businessAuthorized) {
        return toast.error("You must authorize the installation at this business location");
      }

      if (!selectedAddress) {
        if (!newAddress.street.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.zip_code.trim()) {
          return toast.error("Please complete all address fields");
        }
      }
      if (installRequired && selectedService) {
        if (!selectedDate) return toast.error("Please select a date");
        if (!selectedTime) return toast.error("Please select an available time slot");
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleProceedToPayment = async (redirectToSplit = false) => {
    if (!user) {
      toast.error("Please log in to complete your booking");
      const redirectUrl = editId ? `/book?edit=${editId}` : "/book";
      return router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }

    setSubmitting(true);
    try {
      let vehicleId = selectedVehicle?.id;
      let addressId = selectedAddress?.id;

      if (!vehicleId) {
        const { data: vData, error: vErr } = await supabase.from("vehicles").insert({
          ...newVehicle,
          year: parseInt(newVehicle.year),
          user_id: user.id
        }).select().single();
        if (vErr) throw vErr;
        vehicleId = vData.id;
      }

      if (!addressId) {
        const { data: aData, error: aErr } = await supabase.from("addresses").insert({
          ...newAddress,
          user_id: user.id
        }).select().single();
        if (aErr) throw aErr;
        addressId = aData.id;
      }

      const totalAmount = calculateBookingTotal();
      const expirationDate = paymentMethod === "now" 
        ? new Date(Date.now() + 5 * 60 * 1000).toISOString() 
        : null;

        let booking;
        const bookingData = {
          vehicle_id: vehicleId,
          address_id: addressId,
          service_id: selectedService?.id || null,
          booking_date: installRequired ? selectedDate?.toISOString() : null,
          scheduled_time: installRequired ? selectedTime : 'No Installation',
          customer_legal_name: legalName,
          customer_preferred_name: preferredName,
          address_type: addressType,
          business_install_authorized: businessAuthorized,
          tech_contact_phone: techContactPhone,
          payment_method: paymentMethod,
          total_amount: totalAmount,
        };

        if (editId) {
          const { data: bData, error: bErr } = await supabase
            .from("bookings")
            .update(bookingData)
            .eq("id", editId)
            .select()
            .single();
          if (bErr) throw bErr;
          booking = bData;

          await logAudit({
            action: "UPDATE_BOOKING",
            entityType: "booking",
            entityId: booking.id,
            metadata: { type: "edit", changes: bookingData }
          });
        } else {
          const { data: bData, error: bErr } = await supabase.from("bookings").insert({
            ...bookingData,
            user_id: user.id,
            status: paymentMethod === "arrival" ? 'confirmed' : 'pending',
            payment_status: 'unpaid',
            expires_at: expirationDate
          }).select().single();
          if (bErr) throw bErr;
          booking = bData;

          await logAudit({
            action: "CREATE",
            entityType: "booking",
            entityId: booking.id,
            metadata: { service: selectedService?.name || 'Products Only', total: totalAmount }
          });
        }

      if (!editId) {
        if (selectedService) {
          await supabase.from("booking_items").insert({
            booking_id: booking.id,
            service_id: selectedService.id,
            quantity: 1,
            price: selectedService.base_price
          });
        }
      }

      if (redirectToSplit) {
        router.push(`/checkout/split/${booking.id}`);
        return;
      }

        if (paymentMethod === "arrival") {
          const arrivalFeeRes = await fetch("/api/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              bookingId: booking.id,
              arrivalFeeOnly: true,
              amount: 10
            }),
          });
          
          const arrivalFeeData = await arrivalFeeRes.json();
          if (arrivalFeeData.error) throw new Error(arrivalFeeData.error);
          
          setPendingArrivalBookingId(booking.id);
          setArrivalFeeClientSecret(arrivalFeeData.clientSecret);
          setShowArrivalFeePayment(true);
        } else if (editId && booking.payment_status === 'paid' && totalAmount <= booking.total_amount) {
          toast.success("Booking updated successfully!");
          router.push(`/book?success=true&booking_id=${booking.id}`);
        } else {
        const cartItems = cart.map(item => ({ id: item.id, quantity: item.quantity }));
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            bookingId: booking.id,
            cartItems: cartItems.length > 0 ? cartItems : undefined
          }),
        });
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        setCurrentBookingId(booking.id);
        setClientSecret(data.clientSecret);
        setShowPayment(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = (bookingId: string) => {
    clearCart();
    toast.success("Payment successful!");
    router.push(`/book?success=true&booking_id=${bookingId}`);
  };

  const handleArrivalFeeSuccess = async (bookingId: string) => {
    await supabase
      .from("bookings")
      .update({ 
        arrival_fee_paid: true,
        status: 'confirmed'
      })
      .eq("id", bookingId);
    
    clearCart();
    toast.success("Arrival fee paid! Your installation is confirmed.");
    router.push(`/book?success=true&booking_id=${bookingId}`);
  };

  const handleArrivalFeeCancel = async () => {
    if (pendingArrivalBookingId && !editId) {
      await supabase.from("bookings").delete().eq("id", pendingArrivalBookingId);
    }
    setShowArrivalFeePayment(false);
    setArrivalFeeClientSecret(null);
    setPendingArrivalBookingId(null);
  };

  const handlePaymentCancel = async () => {
    if (currentBookingId && !editId) {
      await supabase.from("bookings").delete().eq("id", currentBookingId);
    }
    setShowPayment(false);
    setClientSecret(null);
    setCurrentBookingId(null);
  };

  const handleTermsAccept = () => {
    setAgreedToTOS(true);
    setShowTermsModal(false);
    toast.success("Terms accepted!");
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-12 rounded-[2.5rem] border border-primary/30 shadow-2xl shadow-primary/20 bg-black/40 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="mx-auto w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center mb-8 rotate-12 shadow-inner">
            <CheckCircle2 className="h-12 w-12 text-primary animate-bounce" />
          </div>
          <h2 className="text-5xl font-black uppercase tracking-tighter italic mb-2">
            {confirmedBooking?.scheduled_time === 'No Installation' ? 'Order Confirmed' : 'Deployment Confirmed'}
          </h2>
          <p className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-8">
            Transaction Successfully Processed
          </p>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/5 mb-6 text-left">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-white/10 pb-2 mb-4">Deployment Status</h3>
            {confirmedBooking?.assigned_tech ? (
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                  <UserCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase italic">Install Assigned: {confirmedBooking.assigned_tech.full_name}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">MAP ID: {confirmedBooking.assigned_tech.map_id}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 animate-pulse">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase italic">Waiting for Assignment</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Broadcasting to regional technicians...</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-10">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-white/10 pb-2 mb-4">Installation Profile</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-foreground/40 font-bold uppercase">Installation</span>
                  <span className="font-bold text-sm italic">{confirmedBooking?.service?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-foreground/40 font-bold uppercase">Vehicle</span>
                  <span className="font-bold text-sm">{confirmedBooking?.vehicle?.year} {confirmedBooking?.vehicle?.make}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-white/10 pb-2 mb-4">Deployment Schedule</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-foreground/40 font-bold uppercase">Arrival Window</span>
                  <span className="font-black text-primary text-sm italic">{confirmedBooking?.scheduled_time}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="blue-gradient text-white border-none h-14 px-10 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 rounded-xl">
              <Link href="/dashboard">Operations Hub</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 hover:bg-white/5 h-14 px-10 text-xs font-black uppercase tracking-widest rounded-xl">
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const steps = [
    { id: 1, name: "Installation", icon: <Wrench className="h-5 w-5" /> },
    { id: 2, name: "Vehicle", icon: <Car className="h-5 w-5" /> },
    { id: 3, name: "Site", icon: <MapPin className="h-5 w-5" /> },
    { id: 4, name: "Checkout", icon: <CreditCard className="h-5 w-5" /> },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 flex justify-between">
        {steps.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
              step >= s.id ? "border-primary bg-primary text-white" : "border-white/10 text-foreground/40"
            }`}>
              {s.icon}
            </div>
            <span className={`text-xs font-bold uppercase tracking-widest ${step >= s.id ? "text-primary" : "text-foreground/40"}`}>
              {s.name}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card min-h-[500px] p-8 rounded-3xl border border-white/10"
        >
          {step === 1 && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tight">
                  {editId ? 'Update Installation' : 'Select Installation'}
                </h2>
                <p className="text-sm text-foreground/60">Choose the premium electronics for your vehicle.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {services.filter(s => s.id !== FREE_INSTALL_SERVICE_ID).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedService(s)}
                    className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                      selectedService?.id === s.id ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg">{s.name}</h3>
                      <span className="text-primary font-black text-lg">${Number(s.base_price).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-foreground/60 leading-snug">{s.description}</p>
                  </div>
                ))}

                {cart.length > 0 && (
                  <div
                    onClick={() => { setSelectedService(null); setInstallRequired(false); }}
                    className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex flex-col justify-center items-center text-center group ${
                      !selectedService ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ShoppingCart className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Product Order Only</h3>
                    <p className="text-sm text-foreground/60 leading-snug">Proceed with only the items in your cart.</p>
                  </div>
                )}
              </div>

              {selectedService && (
                <div className="pt-8 border-t border-white/10 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary">Deployment Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => setInstallRequired(true)}
                      className={`cursor-pointer flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                        installRequired ? "border-primary bg-primary/10" : "border-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${installRequired ? "bg-primary text-white" : "bg-white/5 text-foreground/40"}`}>
                        <Wrench className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold uppercase text-xs tracking-wider">Pro Installation</p>
                        <p className="text-[10px] text-foreground/40 font-bold uppercase">Included in price</p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setInstallRequired(false)}
                      className={`cursor-pointer flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                        !installRequired ? "border-primary bg-primary/10" : "border-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${!installRequired ? "bg-primary text-white" : "bg-white/5 text-foreground/40"}`}>
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold uppercase text-xs tracking-wider">No Installation</p>
                        <p className="text-[10px] text-primary font-black uppercase">Save $50.00</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black uppercase tracking-tight">Vehicle Details</h2>
              {vehicles.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary">Your Vehicles</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {vehicles.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => { setSelectedVehicle(v); setNewVehicle({ make: "", model: "", year: "", trim: "", color: "", type: "Sedan" }); }}
                        className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                          selectedVehicle?.id === v.id ? "border-primary bg-primary/5" : "border-white/5 hover:border-white/20"
                        }`}
                      >
                        <h4 className="font-bold">{v.year} {v.make} {v.model}</h4>
                        <p className="text-sm text-foreground/60">{v.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-6 border-t border-white/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary">Add New Vehicle</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Make (e.g. Ford)"
                    value={newVehicle.make}
                    onChange={(e) => { setNewVehicle({...newVehicle, make: e.target.value}); setSelectedVehicle(null); }}
                    className="bg-white/5 border-white/10 h-12"
                  />
                  <Input
                      placeholder="Model (e.g. F-150)"
                      value={newVehicle.model}
                      onChange={(e) => { 
                        const model = e.target.value;
                        const detectedType = detectVehicleType(model);
                        setNewVehicle({...newVehicle, model, type: detectedType}); 
                        setSelectedVehicle(null); 
                      }}
                      className="bg-white/5 border-white/10 h-12"
                    />
                  <Input
                    placeholder="Year"
                    value={newVehicle.year}
                    onChange={(e) => { setNewVehicle({...newVehicle, year: e.target.value}); setSelectedVehicle(null); }}
                    className="bg-white/5 border-white/10 h-12"
                  />
                  <select
                    value={newVehicle.type}
                    onChange={(e) => { setNewVehicle({...newVehicle, type: e.target.value}); setSelectedVehicle(null); }}
                    className="flex h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Truck">Truck</option>
                    <option value="Coupe">Coupe</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Marine">Marine/Boat</option>
                  </select>
                </div>
                  {newVehicle.type && (
                    <div className="flex items-center gap-2 text-[9px] text-foreground/50 font-bold uppercase tracking-widest mt-2">
                      {newVehicle.type === 'Motorcycle' && <><Bike className="h-3 w-3 text-primary" />Motorcycle detected</>}
                      {newVehicle.type === 'Marine' && <><Anchor className="h-3 w-3 text-primary" />Marine vessel detected</>}
                      {!['Motorcycle', 'Marine'].includes(newVehicle.type) && <><CheckCircle2 className="h-3 w-3 text-green-500" />Type: {newVehicle.type}</>}
                    </div>
                  )}
                </div>
              </div>
            )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black uppercase tracking-tight">
                {editId ? 'Update Information' : (installRequired ? 'Deployment Details' : 'Shipping Details')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary">Client Profile</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                        <Input
                          placeholder="Legal Full Name *"
                          value={legalName}
                          onChange={(e) => setLegalName(e.target.value)}
                          className="bg-white/5 border-white/10 h-12 pl-10"
                        />
                      </div>
                      <div className="relative">
                        <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                        <Input
                          placeholder="Preferred Name *"
                          value={preferredName}
                          onChange={(e) => setPreferredName(e.target.value)}
                          className="bg-white/5 border-white/10 h-12 pl-10"
                        />
                      </div>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                        <Input
                          placeholder={installRequired ? "Tech Reachable Phone *" : "Contact Phone"}
                          value={techContactPhone}
                          onChange={(e) => setTechContactPhone(e.target.value)}
                          className="bg-white/5 border-white/10 h-12 pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary">Location Type</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setAddressType("residential")}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                          addressType === "residential" ? "border-primary bg-primary/10" : "border-white/5 bg-white/5"
                        }`}
                      >
                        <Home className="h-6 w-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Residential</span>
                      </button>
                      <button
                        onClick={() => setAddressType("business")}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                          addressType === "business" ? "border-primary bg-primary/10" : "border-white/5 bg-white/5"
                        }`}
                      >
                        <Building2 className="h-6 w-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Business</span>
                      </button>
                    </div>

                    {addressType === 'business' && (
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-primary shrink-0" />
                          <p className="text-[9px] font-bold uppercase leading-relaxed text-foreground/60">
                            By selecting a business location, you acknowledge that conditions are appropriate for automotive installation and assume full responsibility for authorizing work at this commercial site in accordance with Colorado Revised Statutes.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="business-auth"
                            checked={businessAuthorized}
                            onChange={(e) => setBusinessAuthorized(e.target.checked)}
                            className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                          />
                          <label htmlFor="business-auth" className="text-[10px] font-black uppercase tracking-widest text-primary cursor-pointer">
                            I assume legal responsibility
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {addresses.length > 0 && (
                      <>
                        <h3 className="text-xs font-black uppercase tracking-widest text-primary">Saved Locations</h3>
                        <div className="space-y-2">
                          {addresses.map((a) => (
                            <div
                              key={a.id}
                              onClick={() => { setSelectedAddress(a); setNewAddress({ street: "", city: "", state: "", zip_code: "", label: "Home" }); }}
                              className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                                selectedAddress?.id === a.id ? "border-primary bg-primary/5" : "border-white/5 hover:border-white/20"
                              }`}
                            >
                              <p className="font-bold">{a.street}</p>
                              <p className="text-sm text-foreground/60">{a.city}, {a.state} {a.zip_code}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary">New Location</h3>
                      <Input
                        placeholder="Street Address"
                        value={newAddress.street}
                        onChange={(e) => { setNewAddress({...newAddress, street: e.target.value}); setSelectedAddress(null); }}
                        className="bg-white/5 border-white/10 h-12"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="City"
                          value={newAddress.city}
                          onChange={(e) => { setNewAddress({...newAddress, city: e.target.value}); setSelectedAddress(null); }}
                          className="bg-white/5 border-white/10 h-12"
                        />
                        <Input
                          placeholder="State (CO)"
                          value={newAddress.state}
                          onChange={(e) => { setNewAddress({...newAddress, state: e.target.value}); setSelectedAddress(null); }}
                          className="bg-white/5 border-white/10 h-12"
                        />
                      </div>
                      <Input
                        placeholder="Zip Code"
                        value={newAddress.zip_code}
                        onChange={(e) => { setNewAddress({...newAddress, zip_code: e.target.value}); setSelectedAddress(null); }}
                        className="bg-white/5 border-white/10 h-12"
                      />
                    </div>
                  </div>
                </div>

                {installRequired && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary">Select Schedule</h3>
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        return date < today;
                      }}
                      className="rounded-2xl border border-white/5 bg-white/5"
                    />

                    {selectedDate && (
                      <div className="space-y-3 mt-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-black uppercase tracking-widest text-primary">Available Windows</h3>
                          {editId && originalScheduledTime && (
                             <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">Currently: {originalScheduledTime}</span>
                          )}
                        </div>
                        {fetchingAvailability ? (
                          <div className="flex items-center gap-2 text-sm text-foreground/40">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Checking availability...
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {availableSlots.length > 0 ? (
                              availableSlots.map((slot) => (
                                <button
                                  key={slot.time}
                                  disabled={!slot.available}
                                  onClick={() => setSelectedTime(slot.time)}
                                  className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                    selectedTime === slot.time 
                                      ? "border-primary bg-primary/10 text-primary" 
                                      : !slot.available 
                                        ? "border-white/5 bg-white/5 text-foreground/20 cursor-not-allowed opacity-50" 
                                        : "border-white/5 hover:border-white/20 text-foreground/60"
                                  }`}
                                >
                                  <span className="font-bold text-sm">{slot.time}</span>
                                  {!slot.available ? (
                                    <span className="text-[10px] uppercase font-black tracking-widest opacity-50">Unavailable</span>
                                  ) : (
                                    <div className={`h-2 w-2 rounded-full ${selectedTime === slot.time ? "bg-primary" : "bg-green-500"}`} />
                                  )}
                                </button>
                              ))
                            ) : (
                              <p className="text-sm text-foreground/40 italic">No available windows for this date.</p>
                            )}
                          </div>
                        )}
                        
                        {editId && selectedTime !== originalScheduledTime && (
                          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">Schedule Modification Policy</p>
                            <p className="text-[8px] font-bold text-amber-500/60 leading-relaxed uppercase">
                              Changing your window within 1 hour of the original arrival time incurs a $5.00 reschedule fee.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-3xl font-black uppercase tracking-tight italic">
                  {editId ? 'Apply Updates' : 'Final Review'}
                </h2>
                <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Order Summary
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Client Profile</h4>
                      <p className="font-bold text-sm">{legalName}</p>
                      <p className="text-[10px] text-foreground/40 mt-1 uppercase font-bold tracking-tighter">Known as: {preferredName}</p>
                      <p className="text-[10px] text-primary mt-1 font-bold tracking-tighter uppercase">{techContactPhone}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Vehicle Spec</h4>
                      <p className="font-bold text-sm">
                        {selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : `${newVehicle.year} ${newVehicle.make} ${newVehicle.model}`}
                      </p>
                      <p className="text-[10px] text-foreground/40 mt-1 uppercase font-bold tracking-tighter">Type: {selectedVehicle?.type || newVehicle.type}</p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                        {selectedService ? (installRequired ? <Speaker className="h-7 w-7 text-primary" /> : <ShoppingBag className="h-7 w-7 text-primary" />) : <ShoppingCart className="h-7 w-7 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                              {selectedService ? 'Installation Package' : 'Retail Cart'}
                            </h4>
                            <p className="text-xl font-black italic">{selectedService?.name || 'Retail Product Order'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-black text-primary block">${calculateBookingTotal().toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-primary mt-1" />
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                            {addressType === 'residential' ? 'Deployment Site' : 'Commercial Site'}
                          </h4>
                          <p className="text-sm font-bold leading-tight">{selectedAddress ? selectedAddress.street : newAddress.street}</p>
                          <p className="text-[10px] text-foreground/40 uppercase font-bold mt-0.5">{selectedAddress ? `${selectedAddress.city}, ${selectedAddress.state}` : `${newAddress.city}, ${newAddress.state}`}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-primary mt-1" />
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Deployment Window</h4>
                          {installRequired ? (
                            <>
                              <p className="text-sm font-bold leading-tight">{selectedDate?.toLocaleDateString()}</p>
                              <p className="text-xs text-primary font-black uppercase tracking-tighter mt-0.5 italic">{selectedTime}</p>
                            </>
                          ) : (
                            <p className="text-sm font-bold leading-tight italic opacity-40">Purchase Only (Shipping)</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === "now" && cart.length > 0 && (
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Retail Items</h4>
                      </div>
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 relative rounded-lg overflow-hidden border border-white/10">
                                <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                              </div>
                              <p className="text-xs font-bold">{item.name} (x{item.quantity})</p>
                            </div>
                            <span className="text-xs font-black text-primary">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                    {!showPayment && !showArrivalFeePayment ? (
                      <>
                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 shadow-2xl shadow-primary/5">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Payment Structure</h4>
                          <div className="space-y-2">
                            <button
                              onClick={() => setPaymentMethod("now")}
                              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                paymentMethod === "now" ? "border-primary bg-primary/10" : "border-white/5"
                              }`}
                            >
                              <span className="text-xs font-black uppercase tracking-widest">Full Payment</span>
                              {paymentMethod === "now" && <div className="h-2 w-2 rounded-full bg-primary" />}
                            </button>
                            
                              {installRequired && (
                                <button
                                  onClick={() => setPaymentMethod("arrival")}
                                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                    paymentMethod === "arrival" ? "border-amber-500 bg-amber-500/10" : "border-white/5"
                                  }`}
                                >
                                  <div className="text-left">
                                    <span className="text-xs font-black uppercase tracking-widest block">Pay on Arrival</span>
                                    <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-black mt-1 inline-block">$10.00 FEE DUE NOW</span>
                                  </div>
                                  {paymentMethod === "arrival" && <div className="h-2 w-2 rounded-full bg-amber-500" />}
                                </button>
                              )}

                              {paymentMethod === "arrival" && installRequired && (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                  <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider leading-relaxed">
                                    Pay $10.00 now to secure your appointment. Remaining balance of ${(calculateBookingTotal() - 10).toFixed(2)} due when technician arrives.
                                  </p>
                                </div>
                              )}

                              <Button 
                                variant="outline"
                                onClick={() => {
                                  if (!agreedToTOS) {
                                    toast.error("Please read and accept the Terms of Service first");
                                    return;
                                  }
                                  handleProceedToPayment(true);
                                }}
                                disabled={submitting || !user}
                                className="w-full border-primary/20 text-primary hover:bg-primary/10 h-14 rounded-xl font-black uppercase tracking-widest text-[10px]"
                              >
                                Initialize Split Payment
                              </Button>

                        </div>

                        <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                          <div className="flex justify-between text-[10px] text-foreground/40 uppercase font-black tracking-widest">
                            <span>Base Rate</span>
                            <span>${Number(selectedService?.base_price || 0).toLocaleString()}</span>
                          </div>
                          {!installRequired && selectedService && (
                            <div className="flex justify-between text-[10px] text-primary uppercase font-black tracking-widest">
                              <span>DIY Waiver</span>
                              <span>-$50.00</span>
                            </div>
                          )}
                          {editId && installRequired && selectedTime !== originalScheduledTime && (
                             (() => {
                                const originalTime = parseSlotStartTime(originalScheduledTime, originalBookingDate);
                                if (originalTime && (originalTime.getTime() - Date.now()) < 3600000) {
                                  return (
                                    <div className="flex justify-between text-[10px] text-amber-500 uppercase font-black tracking-widest">
                                      <span>Reschedule Fee</span>
                                      <span>$5.00</span>
                                    </div>
                                  );
                                }
                                return null;
                             })()
                          )}
                          {paymentMethod === "arrival" && installRequired && (
                            <div className="flex justify-between text-[10px] text-primary uppercase font-black tracking-widest">
                              <span>Arrival Fee</span>
                              <span>$10.00</span>
                            </div>
                          )}
                          <div className="pt-2 flex justify-between items-end">
                            <span className="text-xs font-black uppercase tracking-widest italic">Grand Total</span>
                            <span className="text-4xl font-black text-primary italic leading-none tracking-tighter">${calculateGrandTotal().toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="tos"
                              checked={agreedToTOS}
                              onChange={() => {
                                if (!agreedToTOS) {
                                  setShowTermsModal(true);
                                } else {
                                  setAgreedToTOS(false);
                                }
                              }}
                              className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary mt-1 cursor-pointer"
                            />
                            <label htmlFor="tos" className="text-[9px] font-black uppercase tracking-widest text-foreground/40 leading-relaxed cursor-pointer">
                              I have read and accept the{" "}
                              <button 
                                type="button"
                                onClick={() => setShowTermsModal(true)}
                                className="text-primary hover:underline"
                              >
                                Terms of Service
                              </button>{" "}
                              and understand the $20.00 restocking fee applies to all cancellations within 24 hours of the deployment window.
                            </label>
                          </div>
                        </div>

                        {!agreedToTOS && (
                          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                            <p className="text-sm text-amber-400">Please read and accept the Terms of Service to proceed with payment.</p>
                          </div>
                        )}

                        <Button
                          onClick={() => {
                            if (!agreedToTOS) {
                              toast.error("Please read and accept the Terms of Service first");
                              return;
                            }
                            handleProceedToPayment();
                          }}
                          className="w-full blue-gradient text-white border-none h-16 text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/30 rounded-xl"
                          disabled={submitting || !user}
                        >
                          {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (editId ? "Update Deployment" : "Confirm & Deploy")}
                        </Button>
                   </>
                    ) : showArrivalFeePayment ? (
                      <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-2xl shadow-amber-500/5">
                        <div className="flex items-center gap-3 mb-4">
                          <CreditCard className="h-5 w-5 text-amber-400" />
                          <div>
                            <h4 className="text-sm font-black uppercase tracking-tight">Pay Arrival Fee</h4>
                            <p className="text-[10px] text-foreground/40 uppercase font-bold">$10.00 Required to Book</p>
                          </div>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                          <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider leading-relaxed">
                            This $10.00 arrival fee secures your appointment. The remaining balance of ${(calculateGrandTotal() - 10).toFixed(2)} will be due upon the technician&apos;s arrival before work begins.
                          </p>
                        </div>

                        {arrivalFeeClientSecret && (
                          <Elements
                            stripe={stripePromise}
                            options={{ clientSecret: arrivalFeeClientSecret, appearance: { theme: "night" } }}
                          >
                            <EmbeddedCheckoutForm
                              clientSecret={arrivalFeeClientSecret}
                              bookingId={pendingArrivalBookingId!}
                              amount={10}
                              onSuccess={handleArrivalFeeSuccess}
                              onCancel={handleArrivalFeeCancel}
                            />
                          </Elements>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 shadow-2xl shadow-primary/5">
                        <div className="flex items-center gap-3 mb-6">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <div>
                            <h4 className="text-sm font-black uppercase tracking-tight">Secure Payment</h4>
                            <p className="text-[10px] text-foreground/40 uppercase font-bold">Encrypted via Stripe</p>
                          </div>
                        </div>

                        {clientSecret && (
                          <Elements
                            stripe={stripePromise}
                            options={{ clientSecret, appearance: { theme: "night" } }}
                          >
                            <EmbeddedCheckoutForm
                              clientSecret={clientSecret}
                              bookingId={currentBookingId!}
                              amount={calculateGrandTotal()}
                              onSuccess={handlePaymentSuccess}
                              onCancel={handlePaymentCancel}
                            />
                          </Elements>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showTermsModal && (
          <TermsModal 
            isOpen={showTermsModal} 
            onClose={() => setShowTermsModal(false)} 
            onAccept={handleTermsAccept}
            includeFreeInstall={installRequired}
          />
        )}
      </AnimatePresence>

      <div className="mt-8 flex justify-between">
          {step > 1 && !showPayment && !showArrivalFeePayment && (
            <Button variant="ghost" onClick={prevStep} className="gap-2 font-bold uppercase tracking-widest text-xs">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {step < 4 && (
            <Button onClick={nextStep} className="ml-auto blue-gradient text-white border-none gap-2 font-bold uppercase tracking-widest px-8">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <BookingContent />
    </Suspense>
  );
}
