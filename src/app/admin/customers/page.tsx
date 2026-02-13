"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  Shield, 
  User as UserIcon, 
  MoreVertical, 
  Search,
  Filter,
  Check,
  X,
  Loader2,
  Package,
  Wrench,
  DollarSign,
  Calendar,
  ChevronRight,
  ExternalLink,
  History
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-logger";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useDiagnostics } from "@/hooks/use-diagnostics";

export default function CustomersPage() {
  const { reportError } = useDiagnostics();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Details state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('admin-customers-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchUsers()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .not("role", "in", '("admin","technician","suspended")')
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("user_id, customer_number, customer_email, customer_legal_name, created_at, payment_status, total_amount, id")
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;

      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));

      const processedProfiles = (profilesData || []).map(user => {
        const userBookings = (bookingsData || []).filter(b => b.user_id === user.id || (b.customer_number === user.customer_number && user.customer_number));
        const lastActivityDate = userBookings.length > 0 ? new Date(userBookings[0].created_at) : null;
        const isActive = (lastActivityDate && lastActivityDate >= oneYearAgo) || 
                        (new Date(user.created_at) >= oneYearAgo);
        
        const hasPaidBooking = userBookings.some(b => b.payment_status === 'paid');
        const totalSpent = userBookings
          .filter(b => b.payment_status === 'paid')
          .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

        return {
          ...user,
          lastActivityDate,
          isActive,
          hasPaidBooking,
          totalSpent,
          bookingCount: userBookings.length,
          isGuest: false
        };
      });

      const profileCustomerNumbers = new Set(processedProfiles.map(p => p.customer_number).filter(Boolean));
      const profileUserIds = new Set(processedProfiles.map(p => p.id));
      
      const guestCustomerNumbers = new Set();
      const guestCustomers: any[] = [];

      (bookingsData || []).forEach(booking => {
        const isProfileBooking = (booking.user_id && profileUserIds.has(booking.user_id)) || 
                               (booking.customer_number && profileCustomerNumbers.has(booking.customer_number));
        
        if (!isProfileBooking && booking.customer_number && !guestCustomerNumbers.has(booking.customer_number)) {
          guestCustomerNumbers.add(booking.customer_number);
          
          const guestBookings = (bookingsData || []).filter(b => b.customer_number === booking.customer_number);
          const lastBooking = guestBookings[0];
          const lastActivityDate = new Date(lastBooking.created_at);
          const isActive = lastActivityDate >= oneYearAgo;
          
          const hasPaidBooking = guestBookings.some(b => b.payment_status === 'paid');
          const totalSpent = guestBookings
            .filter(b => b.payment_status === 'paid')
            .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

          guestCustomers.push({
            id: booking.customer_number,
            customer_number: booking.customer_number,
            email: booking.customer_email || 'Guest',
            full_name: booking.customer_legal_name || 'Guest Customer',
            role: 'customer',
            created_at: guestBookings[guestBookings.length - 1].created_at,
            lastActivityDate,
            isActive,
            hasPaidBooking,
            totalSpent,
            bookingCount: guestBookings.length,
            isGuest: true
          });
        }
      });

      const allCustomers = [...processedProfiles, ...guestCustomers].sort((a, b) => {
        const dateA = new Date(a.lastActivityDate || a.created_at).getTime();
        const dateB = new Date(b.lastActivityDate || b.created_at).getTime();
        return dateB - dateA;
      });

      if (activeTab === "active") {
        setUsers(allCustomers.filter(u => u.isActive));
        } else {
          setUsers(allCustomers.filter(u => !u.isActive));
        }
      } catch (error: any) {
        reportError('F55219', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchUserHistory(userId: string, customerNumber?: string) {
      setLoadingHistory(true);
      try {
        let query = supabase
          .from("bookings")
          .select(`
            *,
            booking_items (
              *,
              products (name, image_url),
              services (name)
            )
          `)
          .order("created_at", { ascending: false });

        if (userId.startsWith('CUST-')) {
          query = query.eq("customer_number", userId);
        } else if (customerNumber) {
          query = query.or(`user_id.eq.${userId},customer_number.eq.${customerNumber}`);
        } else {
          query = query.eq("user_id", userId);
        }

        const { data: bookings, error } = await query;

        if (error) throw error;
        setUserHistory(bookings || []);
      } catch (error: any) {
        reportError('F77321', error);
      } finally {
        setLoadingHistory(false);
      }
    }

    const handleViewDetails = (user: any) => {
      setSelectedUser(user);
      setIsDetailsOpen(true);
      fetchUserHistory(user.id, user.customer_number);
    };

    const handleUpdateRole = async (user: any, newRole: string) => {
      setUpdatingId(user.id);
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ role: newRole })
          .eq("id", user.id);

        if (error) throw error;
        
        await logAudit({
          action: 'UPDATE_ROLE',
          entityType: 'customer',
          entityId: user.id,
          metadata: {
            previous_role: user.role,
            new_role: newRole,
            user_email: user.email,
            map_id: user.map_id
          }
        });

        setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
        toast.success(`User role updated to ${newRole}`);
      } catch (error: any) {
        reportError('S66210', error);
      } finally {
        setUpdatingId(null);
      }
    };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl w-fit">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveTab("active")}
              className={cn(
                "font-black uppercase tracking-widest text-[10px] px-6 h-9 rounded-lg transition-all",
                activeTab === "active" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-foreground/40 hover:text-white"
              )}
            >
              Active Customers
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveTab("archived")}
              className={cn(
                "font-black uppercase tracking-widest text-[10px] px-6 h-9 rounded-lg transition-all",
                activeTab === "archived" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-foreground/40 hover:text-white"
              )}
            >
              Customer Archives
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <Input 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-sm font-bold uppercase tracking-widest h-10"
              />
            </div>
            <Button variant="outline" className="border-white/10 hover:bg-white/5 h-10 font-black uppercase tracking-widest text-[10px]">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-white/5 overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest">Total</Badge>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Total Registered</p>
              <h3 className="text-2xl font-black mt-1 italic">{users.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5 overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                <Shield className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest">Active</Badge>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Paid Customers</p>
              <h3 className="text-2xl font-black mt-1 italic">{users.filter(u => u.hasPaidBooking).length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5 overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <UserIcon className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest">Revenue</Badge>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Total Lifetime Value</p>
              <h3 className="text-2xl font-black mt-1 italic">
                ${users.reduce((sum, u) => sum + (u.totalSpent || 0), 0).toLocaleString()}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-white/5 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">User</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Customer ID</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Status</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Joined</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">LTV</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">Actions</th>
              </tr>

            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="p-8 bg-white/[0.01]"></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-foreground/40 font-bold uppercase tracking-widest text-sm">
                    No users found
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-primary/20 transition-colors">
                        <UserIcon className="h-5 w-5 text-foreground/40 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="cursor-pointer" onClick={() => handleViewDetails(user)}>
                        <div className="font-bold text-white group-hover:text-primary transition-colors">{user.full_name || 'No Name'}</div>
                        <div className="text-xs text-foreground/40 font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="font-mono text-xs font-bold text-primary">
                      {user.customer_number || 'PENDING'}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1">
                      <Badge className={cn(
                        "uppercase text-[10px] font-black border-none w-fit",
                        user.isActive 
                          ? "bg-green-500/20 text-green-500" 
                          : "bg-white/10 text-foreground/60"
                      )}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {user.hasPaidBooking && (
                        <Badge className="uppercase text-[10px] font-black border-none bg-primary/20 text-primary w-fit">
                          Paid Customer
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-sm font-bold text-foreground/60 uppercase tracking-tighter italic">
                      {new Date(user.created_at).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-sm font-black text-white italic">
                      ${(user.totalSpent || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                      {user.bookingCount} Bookings
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-white/10 rounded-lg text-foreground/40 hover:text-white"
                        onClick={() => handleViewDetails(user)}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-lg" disabled={updatingId === user.id}>
                            {updatingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 text-white font-bold uppercase tracking-widest text-[10px]">
                            <DropdownMenuItem 
                              className="hover:bg-white/5 focus:bg-white/5 cursor-pointer flex items-center gap-2"
                              onClick={() => handleUpdateRole(user, user.role === 'admin' ? 'customer' : 'admin')}
                            >
                              {user.role === 'admin' ? (
                                <>
                                  <X className="h-3 w-3 text-red-500" />
                                  Demote to Customer
                                </>
                              ) : (
                                <>
                                  <Check className="h-3 w-3 text-green-500" />
                                  Promote to Admin
                                </>
                              )}
                            </DropdownMenuItem>

                          <DropdownMenuItem className="hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer text-red-500">
                            Suspend Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="w-full sm:max-w-2xl bg-[#0a0a0a] border-l border-white/5 p-0">
          <SheetHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <UserIcon className="h-8 w-8" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  {selectedUser?.full_name || 'Customer Details'}
                </SheetTitle>
                <SheetDescription className="text-foreground/40 font-bold uppercase tracking-widest text-[10px] mt-1">
                  {selectedUser?.email} • Joined {selectedUser && new Date(selectedUser.created_at).toLocaleDateString()}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-8 space-y-10">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">Total Spent</p>
                  <p className="text-xl font-black italic">${(selectedUser?.totalSpent || 0).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">Total Orders</p>
                  <p className="text-xl font-black italic">{userHistory.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">Status</p>
                  <Badge variant="outline" className={cn(
                    "mt-1 uppercase text-[10px] font-black",
                    selectedUser?.isActive ? "border-green-500/20 text-green-500" : "border-white/10 text-foreground/40"
                  )}>
                    {selectedUser?.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {/* History Sections */}
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <History className="h-4 w-4 text-primary" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Full History Log</h4>
                  </div>

                  {loadingHistory ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-24 w-full rounded-2xl bg-white/5 animate-pulse" />
                      ))}
                    </div>
                  ) : userHistory.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                      <Package className="h-8 w-8 text-foreground/20 mx-auto mb-3" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">No activity history found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userHistory.map((booking) => (
                        <div key={booking.id} className="group relative p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={cn(
                                  "text-[8px] font-black uppercase",
                                  booking.payment_status === 'paid' ? "bg-green-500 text-white" : "bg-yellow-500 text-black"
                                )}>
                                  {booking.payment_status}
                                </Badge>
                                <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-foreground/40">
                                  {booking.status}
                                </Badge>
                              </div>
                              <h5 className="font-black text-white italic uppercase tracking-tight">
                                {booking.install_type ? `${booking.install_type} Installation` : 'Product Order'}
                              </h5>
                              <div className="flex flex-col gap-0.5 mt-1">
                                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                                  {new Date(booking.created_at).toLocaleString()}
                                </p>
                                <p className="text-[8px] font-mono text-primary uppercase">
                                  BID: {booking.id.slice(0, 8)}... • CID: {booking.customer_number || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black italic text-primary">${Number(booking.total_amount).toLocaleString()}</p>
                              <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Amount Paid</p>
                            </div>
                          </div>

                          <div className="space-y-3 pl-4 border-l-2 border-white/10">
                            {booking.booking_items?.map((item: any) => (
                              <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                                    {item.product_id ? <Package className="h-4 w-4 text-foreground/40" /> : <Wrench className="h-4 w-4 text-foreground/40" />}
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">
                                      {item.products?.name || item.services?.name || 'Unknown Item'}
                                    </p>
                                    <p className="text-[8px] font-bold text-foreground/40 uppercase">Qty: {item.quantity} • ${Number(item.price).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {booking.vehicle_make && (
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded bg-white/10 flex items-center justify-center">
                                  <Wrench className="h-2.5 w-2.5 text-foreground/40" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/60">
                                  {booking.vehicle_year} {booking.vehicle_make} {booking.vehicle_model}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
