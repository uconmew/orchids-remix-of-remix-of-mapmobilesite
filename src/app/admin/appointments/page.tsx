"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Calendar, 
  Clock, 
  Search, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  User,
  Car as CarIcon,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { logActivity } from "@/lib/audit-logger";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

import { useDiagnostics } from "@/hooks/use-diagnostics";

export default function AdminAppointmentsPage() {
  const { reportError } = useDiagnostics();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Edit State
  const [editData, setEditData] = useState({
    booking_date: "",
    scheduled_time: "",
    total_amount: "",
    status: "",
    payment_status: ""
  });

    useEffect(() => {
      fetchBookings();

      const channel = supabase
        .channel('admin-appointments-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          () => fetchBookings()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, []);

    async function fetchBookings() {
      setLoading(true);
      try {
        // Run cleanup of expired bookings
        await supabase.rpc('run_cleanup');

        const { data, error } = await supabase
          .from("bookings")
          .select(`
            *,
            user:user_id (full_name, email),
            service:service_id (name),
            vehicle:vehicle_id (make, model, year),
            address:address_id (street, city, state)
          `)
          .order("booking_date", { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (error: any) {
        reportError('F55667', error);
      } finally {
        setLoading(false);
      }
    }

    const handleEditClick = (booking: any) => {

    setSelectedBooking(booking);
    setEditData({
      booking_date: booking.booking_date ? new Date(booking.booking_date).toISOString().split('T')[0] : "",
      scheduled_time: booking.scheduled_time || "",
      total_amount: booking.total_amount || "",
      status: booking.status || "pending",
      payment_status: booking.payment_status || "unpaid"
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          booking_date: editData.booking_date,
          scheduled_time: editData.scheduled_time,
          total_amount: parseFloat(editData.total_amount),
          status: editData.status,
          payment_status: editData.payment_status
        })
        .eq("id", selectedBooking.id);

      if (error) throw error;
      
      await logActivity({
        action: 'UPDATE_BOOKING',
        entityType: 'booking',
        entityId: selectedBooking.id,
        metadata: {
          customer: selectedBooking.user?.full_name,
          new_date: editData.booking_date,
          new_status: editData.status,
          new_payment_status: editData.payment_status
        }
      });

        toast.success("Appointment updated successfully");
        setIsEditDialogOpen(false);
        fetchBookings();
      } catch (error: any) {
        reportError('S44556', error);
      }
    };
  
    const handleDelete = async () => {
      try {
        const { error } = await supabase
          .from("bookings")
          .delete()
          .eq("id", selectedBooking.id);
  
        if (error) throw error;

        await logActivity({
          action: 'DELETE',
          entityType: 'booking',
          entityId: selectedBooking.id,
          metadata: {
            customer: selectedBooking.user?.full_name,
            service: selectedBooking.service?.name,
            date: selectedBooking.booking_date
          }
        });

        toast.success("Appointment deleted");
        setIsDeleteDialogOpen(false);
        fetchBookings();
      } catch (error: any) {
        reportError('S22334', error);
      }
    };


  const filteredBookings = bookings.filter(b => 
    b.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    b.service?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight italic">Manage Appointments</h1>
          <p className="text-foreground/60 text-sm">Schedule, modify, and track all mobile installations.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="border-white/10 hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]">
            <a href="/admin/appointments/availability">Availability Settings</a>
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gold-gradient text-white border-none font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-accent/20">
            <Plus className="h-4 w-4 mr-1" /> Manual Booking
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 glass-card p-4 rounded-2xl border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <Input 
            placeholder="Search by customer, service or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Appointments List */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 rounded-3xl bg-white/5 animate-pulse" />
            ))
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <Card key={booking.id} className="glass-card border-white/5 overflow-hidden group hover:border-white/10 transition-all">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Left: Date & Status */}
                    <div className="md:w-48 p-6 bg-white/[0.02] flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">
                        {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'short' }) : 'No Date'}
                      </span>
                      <span className="text-3xl font-black italic">
                        {booking.booking_date ? new Date(booking.booking_date).getDate() : '--'}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-1">
                        {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                      </span>
                      <Badge className={`mt-4 ${
                        booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                        booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                        booking.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                        'bg-white/5 text-foreground/40'
                      } border-none uppercase text-[8px] font-black px-3`}>
                        {booking.status}
                      </Badge>
                    </div>

                  {/* Middle: Info */}
                  <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Customer</p>
                          <p className="font-bold text-sm">{booking.user?.full_name || 'Guest'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Location</p>
                          <p className="font-bold text-sm truncate max-w-[200px]">{booking.address?.street}, {booking.address?.city}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Scheduled Time</p>
                          <p className="font-bold text-sm">{booking.scheduled_time || 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CarIcon className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Vehicle</p>
                          <p className="font-bold text-sm">{booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Price & Payment</p>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white italic">${Number(booking.total_amount).toLocaleString()}</p>
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className={`text-[8px] uppercase font-black ${booking.payment_status === 'paid' ? 'border-green-500/50 text-green-500' : 'border-white/10 text-foreground/40'}`}>
                                  {booking.payment_status}
                                </Badge>
                                {booking.payment_method && (
                                  <span className="text-[7px] uppercase font-black tracking-tighter text-foreground/30 px-1">
                                    Via {booking.payment_method === 'arrival' ? 'Arrival' : 'Online'}
                                  </span>
                                )}
                              </div>
                            </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Service</p>
                          <p className="font-bold text-sm text-primary uppercase italic tracking-tighter">{booking.service?.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="p-6 bg-white/[0.01] flex items-center justify-end md:justify-center border-t md:border-t-0 md:border-l border-white/5 gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleEditClick(booking)}
                      className="h-10 w-10 border-white/10 hover:bg-white/10 hover:text-primary rounded-xl"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => { setSelectedBooking(booking); setIsDeleteDialogOpen(true); }}
                      className="h-10 w-10 border-white/10 hover:bg-red-500/10 hover:text-red-500 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 glass-card rounded-3xl border-dashed border-white/10">
            <Calendar className="h-12 w-12 text-foreground/20 mb-4" />
            <h3 className="text-xl font-bold">No appointments found</h3>
            <p className="text-foreground/40">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-card border-white/10 bg-black/90 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase italic">Edit Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Date</label>
                <Input 
                  type="date" 
                  value={editData.booking_date}
                  onChange={(e) => setEditData({...editData, booking_date: e.target.value})}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Time Slot</label>
                <Input 
                  placeholder="e.g. 09:00 AM - 11:00 AM" 
                  value={editData.scheduled_time}
                  onChange={(e) => setEditData({...editData, scheduled_time: e.target.value})}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Price (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input 
                  type="number"
                  value={editData.total_amount}
                  onChange={(e) => setEditData({...editData, total_amount: e.target.value})}
                  className="pl-10 bg-white/5 border-white/10 font-bold"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Status</label>
                <Select value={editData.status} onValueChange={(v) => setEditData({...editData, status: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Payment</label>
                  <Select value={editData.payment_status} onValueChange={(v) => setEditData({...editData, payment_status: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
            <Button onClick={handleUpdate} className="blue-gradient text-white border-none font-bold uppercase tracking-widest text-[10px]">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="glass-card border-white/10 bg-black/90 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-6 w-6" />
              Delete Appointment?
            </DialogTitle>
          </DialogHeader>
          <p className="text-foreground/60 py-4">
            Are you sure you want to delete this appointment for <span className="text-white font-bold">{selectedBooking?.user?.full_name}</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white border-none font-bold uppercase tracking-widest text-[10px]">Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
