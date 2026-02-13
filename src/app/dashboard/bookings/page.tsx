"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  CreditCard, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { logAudit } from "@/lib/audit-logger";

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchBookings() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push("/login?redirect=/dashboard/bookings");
          return;
        }
        setUser(authUser);

        const { data, error } = await supabase
          .from("bookings")
          .select(`
            *,
            service:service_id (name, base_price, description),
            vehicle:vehicle_id (make, model, year, type),
            address:address_id (street, city, state, zip_code),
            assigned_tech:assigned_tech_id (full_name, map_id)
          `)
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Filter out expired pending bookings (older than 5 minutes and not confirmed)
        const now = new Date();
        const filteredBookings = (data || []).filter(booking => {
          const isConfirmed = booking.status === "confirmed" || booking.payment_status === "paid" || booking.payment_method === "arrival";
          if (isConfirmed) return true;
          
          if (booking.status === "pending" || booking.payment_status === "unpaid") {
            const createdAt = new Date(booking.created_at);
            const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
            return diffInMinutes < 5; // Keep only if less than 5 minutes old
          }
          
          return true; // Keep cancelled/completed for history
        });

        setBookings(filteredBookings);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        toast.error("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [router]);

  const handleCancelBooking = async (bookingId: string) => {
    const confirmed = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;
      
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b));
      toast.success("Booking cancelled successfully");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      toast.error("Failed to cancel booking");
    }
  };

  const getStatusColor = (status: string, booking?: any) => {
    const isConfirmed = booking?.payment_status === "paid" || booking?.payment_method === "arrival" || status === "confirmed";
    
    if (isConfirmed && status !== "cancelled") return "text-green-400 bg-green-400/10 border-green-400/20";
    
    switch (status.toLowerCase()) {
      case "confirmed": return "text-green-400 bg-green-400/10 border-green-400/20";
      case "pending": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "cancelled": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "completed": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      default: return "text-foreground/40 bg-white/5 border-white/10";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-foreground/60 animate-pulse uppercase tracking-widest font-bold text-xs">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors mb-8 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-widest">Back to Dashboard</span>
      </Link>

      <div className="mb-12">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">My Bookings</h1>
        <p className="text-foreground/60 mt-1">Manage your service appointments and orders.</p>
      </div>

      <div className="space-y-6">
        {bookings.length === 0 ? (
          <div className="glass-card p-16 rounded-3xl border border-white/10 text-center">
            <Calendar className="h-16 w-16 text-primary/20 mx-auto mb-6" />
            <h2 className="text-xl font-bold uppercase">No bookings found</h2>
            <p className="text-foreground/60 mt-2 mb-8 max-w-sm mx-auto">
              You haven&apos;t scheduled any services yet.
            </p>
            <Button asChild className="blue-gradient rounded-xl px-8 h-12 font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20">
              <Link href="/book">Book Your First Service</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 hover:border-primary/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row gap-8 justify-between">
                  <div className="space-y-6 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(booking.status, booking)}`}>
                        {booking.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        booking.payment_status === "paid" ? "text-green-400 bg-green-400/10 border-green-400/20" : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                      }`}>
                        {booking.payment_status}
                      </span>
                      <span className="text-foreground/30 text-[10px] font-bold uppercase tracking-widest">
                        Ref: {booking.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Car className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">Service & Vehicle</p>
                            <p className="font-bold">{booking.service?.name}</p>
                            <p className="text-sm text-foreground/60">
                              {booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">Location</p>
                            <p className="text-sm font-bold">{booking.address?.street}</p>
                            <p className="text-sm text-foreground/60">{booking.address?.city}, {booking.address?.state}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">Date & Time</p>
                            <p className="font-bold">
                              {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : 'Pending Schedule'}
                            </p>
                            <p className="text-sm text-primary font-black uppercase tracking-tighter italic">
                              {booking.scheduled_time}
                            </p>
                          </div>
                        </div>

                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">Payment</p>
                              <p className="font-bold">${Number(booking.total_amount).toLocaleString()}</p>
                              <p className="text-sm text-foreground/60 uppercase tracking-widest text-[10px] font-bold">
                                via {booking.payment_method === "arrival" ? "Payment on Arrival" : "Stripe Online"}
                              </p>
                            </div>
                          </div>

                          {booking.assigned_tech && (
                            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                <UserCheck className="h-5 w-5 text-green-500" />
                              </div>
                              <div>
                                <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">Assigned Technician</p>
                                <p className="font-bold uppercase italic">{booking.assigned_tech.full_name}</p>
                                <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">MAP ID: {booking.assigned_tech.map_id}</p>
                              </div>
                            </div>
                          )}
                        </div>

                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:w-48 lg:border-l lg:border-white/10 lg:pl-8 justify-center">
                    {booking.payment_status === "unpaid" && booking.status !== "cancelled" && (
                      <>
                        <Button asChild className="w-full blue-gradient text-white border-none h-12 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                          <Link href={`/checkout/${booking.id}`}>
                            {booking.payment_method === "arrival" ? "Pay Full Balance" : "Pay Now"}
                          </Link>
                        </Button>
                        {booking.payment_method !== "arrival" && (
                          <Button asChild variant="outline" className="w-full border-primary/30 text-primary h-12 font-black uppercase tracking-widest text-[10px] hover:bg-primary/5">
                            <Link href={`/checkout/split/${booking.id}`}>
                              Split Payment
                            </Link>
                          </Button>
                        )}
                        {booking.payment_method === "arrival" && (
                          <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl text-center">
                            <p className="text-[8px] font-black uppercase tracking-widest text-amber-500">Arrival Payment Confirmed</p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {booking.payment_status === "partial" && booking.status !== "cancelled" && (
                      <Button asChild variant="outline" className="w-full border-primary/30 text-primary h-12 font-black uppercase tracking-widest text-[10px] hover:bg-primary/5">
                        <Link href={`/checkout/split/${booking.id}`}>
                          Pay Balance
                        </Link>
                      </Button>
                    )}
                    
                    {booking.status === "pending" || booking.status === "confirmed" ? (
                      <>
                        <Button variant="outline" className="w-full border-white/10 bg-white/5 h-12 font-black uppercase tracking-widest text-xs hover:bg-white/10" asChild>
                          <Link href={`/book?edit=${booking.id}`}>
                            Edit Time
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleCancelBooking(booking.id)}
                          className="w-full h-12 font-black uppercase tracking-widest text-xs text-red-400 hover:text-red-500 hover:bg-red-500/10"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" className="w-full border-white/10 bg-white/5 h-12 font-black uppercase tracking-widest text-xs cursor-not-allowed opacity-50" disabled>
                        No Actions
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
