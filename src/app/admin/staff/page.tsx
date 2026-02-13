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
  ShieldAlert,
  ShieldCheck,
  Wrench,
  Trash2,
  History,
  ArrowRight,
  Plus,
  Fingerprint,
  Mail,
  UserPlus,
  Phone,
  Calendar,
  MapPin
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { logActivity } from "@/lib/audit-logger";
import { cn } from "@/lib/utils";
import { useDiagnostics } from "@/hooks/use-diagnostics";

export default function AdminStaffPage() {
  const { reportError } = useDiagnostics();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("staff");
  const [subTab, setSubTab] = useState("active");
  
  // Create Staff State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "technician",
    password: "",
    address: "",
    phone: "",
    dob: "",
    age: 0
  });

  // Calculate age from DOB
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, age }));
    }
  }, [formData.dob]);

  // Activity Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

    async function fetchUsers() {
      setLoading(true);
      try {
        let query = supabase
          .from("profiles")
          .select("*")
          .in("role", ["admin", "technician", "suspended"])
          .order("created_at", { ascending: false });

        if (subTab === "active") {
          query = query.is("staff_removed_at", null);
        } else {
          query = query.not("staff_removed_at", "is", null);
        }

        const { data, error } = await query;

        if (error) throw error;
        setUsers(data || []);
      } catch (error: any) {
        reportError('F19283', error);
      } finally {
        setLoading(false);
      }
    }

    useEffect(() => {
      if (activeTab === "staff") {
        fetchUsers();
      }
      if (activeTab === "activity") {
        fetchLogs();
      }
    }, [activeTab, subTab]);

  async function fetchLogs() {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from("audits")
        .select(`
          *,
          performed_by_profile:profiles!audits_performed_by_fkey (
            full_name,
            email,
            role,
            map_id
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      reportError('F88432', error);
    } finally {
      setLogsLoading(false);
    }
  }

  const generateMapId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return `${year}${random}`;
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.full_name || !formData.password || !formData.dob || !formData.phone || !formData.address) {
      reportError('V82910');
      return;
    }

    setIsCreating(true);
    const map_id = generateMapId();

    try {
      const response = await fetch("/api/admin/staff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          map_id
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Failed to create staff");

      await logActivity({
        action: 'CREATE_STAFF',
        entityType: 'staff',
        entityId: result.user.id,
        metadata: {
          email: formData.email,
          role: formData.role,
          map_id: map_id,
          phone: formData.phone,
          dob: formData.dob
        }
      });

      toast.success("Staff member created successfully!");
      setIsCreateDialogOpen(false);
      setFormData({ 
        full_name: "", 
        email: "", 
        role: "technician", 
        password: "",
        address: "",
        phone: "",
        dob: "",
        age: 0
      });
      fetchUsers();
    } catch (error: any) {
      reportError('S73612', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRole = async (user: any, newRole: string) => {
    if (user.role === 'admin') {
      toast.error("Administrator roles cannot be changed for security reasons.");
      return;
    }
    setUpdatingId(user.id);
    try {
      const updates: any = { role: newRole };
      
      // Generate access code if switching to technician and they don't have one
      if (newRole === 'technician' && !user.access_code) {
        updates.access_code = Math.floor(1000 + Math.random() * 9000).toString();
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;
      
      await logActivity({
        action: 'UPDATE_ROLE',
        entityType: 'staff',
        entityId: user.id,
        metadata: {
          previous_role: user.role,
          new_role: newRole,
          user_email: user.email,
          map_id: user.map_id,
          access_code_generated: updates.access_code ? true : false
        }
      });

      setUsers(users.map(u => u.id === user.id ? { ...u, ...updates } : u));
      toast.success(`Staff role updated to ${newRole}${updates.access_code ? `. Access Code: ${updates.access_code}` : ''}`);
      
      if (newRole === 'customer') {
        setUsers(users.filter(u => u.id !== user.id));
      }
    } catch (error: any) {
      reportError('S92103', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveStaff = async (user: any) => {
    if (!confirm(`Are you sure you want to remove ${user.full_name || user.email} from the staff records?`)) return;
    
    setUpdatingId(user.id);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({ 
          staff_removed_at: now
          // role remains the same, just marked as removed
        })
        .eq("id", user.id);

      if (error) throw error;

      await logActivity({
        action: 'REMOVE_STAFF',
        entityType: 'staff',
        entityId: user.id,
        metadata: {
          removed_at: now,
          previous_role: user.role,
          user_email: user.email,
          map_id: user.map_id
        }
      });

      setUsers(users.filter(u => u.id !== user.id));
      toast.success("Staff member removed from records");
    } catch (error: any) {
      reportError('S01928', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.map_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-black uppercase tracking-tight italic">Staff & Audits</h2>
            <p className="text-foreground/60 mt-1 text-sm font-medium">Manage system access and track administrative actions.</p>
          </div>
          <div className="flex items-center gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="bg-white/5 border border-white/10 p-1">
                <TabsTrigger value="staff" className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] px-4">
                  <Users className="h-3 w-3 mr-2" />
                  Staff List
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] px-4">
                  <History className="h-3 w-3 mr-2" />
                  Audits
                </TabsTrigger>
              </TabsList>
            </Tabs>

        </div>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsContent value="staff" className="space-y-8 mt-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl w-fit">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSubTab("active")}
                className={cn(
                  "font-black uppercase tracking-widest text-[10px] px-6 h-9 rounded-lg transition-all",
                  subTab === "active" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-foreground/40 hover:text-white"
                )}
              >
                Active Staff
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSubTab("archives")}
                className={cn(
                  "font-black uppercase tracking-widest text-[10px] px-6 h-9 rounded-lg transition-all",
                  subTab === "archives" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-foreground/40 hover:text-white"
                )}
              >
                Staff Archives
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <Input 
                  placeholder="Search by name, email or MAP ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-sm font-bold uppercase tracking-widest h-10"
                />
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="blue-gradient text-white border-none font-black uppercase tracking-widest text-[10px] h-10 px-6 gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create New Staff
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight italic">Create Staff Member</DialogTitle>
                    <DialogDescription className="text-foreground/60 text-xs font-bold uppercase tracking-widest">
                      Add a new employee to the system. They will be assigned a unique MAP ID.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateStaff} className="space-y-6 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Full Name</Label>
                          <Input 
                            placeholder="John Doe" 
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            className="bg-white/5 border-white/10 text-sm font-bold h-11"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Email Address</Label>
                          <Input 
                            type="email"
                            placeholder="john@example.com" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="bg-white/5 border-white/10 text-sm font-bold h-11"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Role</Label>
                            <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                              <SelectTrigger className="bg-white/5 border-white/10 text-sm font-bold h-11">
                                <SelectValue placeholder="Select Role" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0a0a0a] border-white/10 text-white font-bold uppercase tracking-widest text-[10px]">
                                <SelectItem value="admin">Administrator</SelectItem>
                                <SelectItem value="technician">Technician</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Initial Password</Label>
                            <Input 
                              type="password"
                              placeholder="••••••••" 
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              className="bg-white/5 border-white/10 text-sm font-bold h-11"
                              required
                            />
                          </div>
                        </div>
                      </div>
  
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Date of Birth</Label>
                            <Input 
                              type="date"
                              value={formData.dob}
                              onChange={(e) => setFormData({...formData, dob: e.target.value})}
                              className="bg-white/5 border-white/10 text-sm font-bold h-11"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Age (Calculated)</Label>
                            <Input 
                              value={formData.age || ''}
                              readOnly
                              placeholder="0"
                              className="bg-white/5 border-white/10 text-sm font-bold h-11 opacity-60"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Phone Number</Label>
                          <Input 
                            placeholder="+1 (555) 000-0000" 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="bg-white/5 border-white/10 text-sm font-bold h-11"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Home Address</Label>
                          <Textarea 
                            placeholder="123 Street, City, State, ZIP" 
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="bg-white/5 border-white/10 text-sm font-bold h-20 resize-none"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full blue-gradient text-white border-none font-black uppercase tracking-widest text-xs h-12"
                        disabled={isCreating}
                      >
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        Create Staff Account
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card border-white/5 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest">Admins</Badge>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Total Administrators</p>
                  <h3 className="text-2xl font-black mt-1 italic">{users.filter(u => u.role === 'admin').length}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-white/5 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest">Technicians</Badge>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Total Technicians</p>
                  <h3 className="text-2xl font-black mt-1 italic">{users.filter(u => u.role === 'technician').length}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-white/5 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest">Suspended</Badge>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Suspended Staff</p>
                  <h3 className="text-2xl font-black mt-1 italic">{users.filter(u => u.role === 'suspended').length}</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-white/5 p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Staff Member</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">MAP ID</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Role</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Joined</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Status</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="p-8 bg-white/[0.01]"></td>
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-foreground/40 font-bold uppercase tracking-widest text-sm">
                        No staff members found
                      </td>
                    </tr>
                  ) : filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-primary/20 transition-colors">
                            <UserIcon className="h-5 w-5 text-foreground/40 group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-primary transition-colors">{user.full_name || 'No Name'}</div>
                            <div className="text-xs text-foreground/40 font-mono">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Fingerprint className="h-3 w-3 text-primary/60" />
                            <span className="text-xs font-mono font-bold text-primary tracking-tighter uppercase">{user.map_id || 'N/A'}</span>
                          </div>
                          {user.role === 'technician' && user.access_code && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 w-fit">
                              <Shield className="h-2.5 w-2.5 text-blue-400" />
                              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">CODE: {user.access_code}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <Badge className={cn(
                          "uppercase text-[10px] font-black border-none",
                          user.role === 'admin' 
                            ? "bg-primary text-white shadow-[0_0_15px_rgba(0,102,255,0.2)]" 
                            : user.role === 'technician'
                            ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                            : "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                        )}>
                          {user.role}
                        </Badge>
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
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]",
                            user.role === 'suspended' ? "bg-red-500" : "bg-green-500"
                          )}></div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                            {user.role === 'suspended' ? "Suspended" : "Active"}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-lg" disabled={updatingId === user.id}>
                              {updatingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 text-white font-bold uppercase tracking-widest text-[10px]">
                            {user.role === 'admin' ? (
                              <div className="px-2 py-1.5 text-foreground/40 text-[9px] font-black uppercase tracking-widest italic">
                                Admin access protected
                              </div>
                            ) : (
                              <>
                                {user.role !== 'admin' && (
                                  <DropdownMenuItem 
                                    className="hover:bg-white/5 focus:bg-white/5 cursor-pointer flex items-center gap-2"
                                    onClick={() => handleUpdateRole(user, 'admin')}
                                  >
                                    <ShieldCheck className="h-3 w-3 text-green-500" />
                                    Promote to Admin
                                  </DropdownMenuItem>
                                )}
                                {user.role !== 'technician' && (
                                  <DropdownMenuItem 
                                    className="hover:bg-white/5 focus:bg-white/5 cursor-pointer flex items-center gap-2"
                                    onClick={() => handleUpdateRole(user, 'technician')}
                                  >
                                    <Wrench className="h-3 w-3 text-blue-500" />
                                    Set as Technician
                                  </DropdownMenuItem>
                                )}
                                {user.role !== 'suspended' && (
                                  <DropdownMenuItem 
                                    className="hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer text-red-500 flex items-center gap-2"
                                    onClick={() => handleUpdateRole(user, 'suspended')}
                                  >
                                    <ShieldAlert className="h-3 w-3" />
                                    Suspend Access
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="hover:bg-red-600/10 focus:bg-red-600/10 cursor-pointer text-red-600 flex items-center gap-2"
                                  onClick={() => handleRemoveStaff(user)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Archive Staff
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-0">
          <Card className="glass-card border-white/5 p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Timestamp</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Admin/Staff</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Action</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Entity</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logsLoading ? (
                    Array(8).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="p-8 bg-white/[0.01]"></td>
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-foreground/40 font-bold uppercase tracking-widest text-sm">
                        No activity logs found
                      </td>
                    </tr>
                  ) : logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-6">
                        <div className="text-xs font-mono text-foreground/60 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-colors">
                            <Fingerprint className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs group-hover:text-primary transition-colors">
                              {log.performed_by_profile?.full_name || 'System'}
                            </div>
                            <div className="text-[10px] text-primary font-mono font-black italic tracking-tighter">
                              {log.performer_map_id || log.performed_by_profile?.map_id || 'ID UNKNOWN'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <Badge className={cn(
                          "uppercase text-[9px] font-black border-none",
                          log.action.includes('CREATE') ? "bg-green-500/20 text-green-500" :
                          log.action.includes('DELETE') || log.action.includes('REMOVE') ? "bg-red-500/20 text-red-500" :
                          "bg-blue-500/20 text-blue-500"
                        )}>
                          {log.action.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-6 text-xs font-bold uppercase tracking-widest text-foreground/60 italic">
                        {log.entity_type}
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-1">
                          {log.metadata?.user_email && (
                            <div className="text-[10px] font-mono text-foreground/40">Target: {log.metadata.user_email}</div>
                          )}
                          {log.metadata?.map_id && (
                            <div className="text-[10px] font-bold text-primary uppercase">Staff ID: {log.metadata.map_id}</div>
                          )}
                          {log.metadata?.new_role && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase">
                              {log.metadata.previous_role} <ArrowRight className="h-2 w-2" /> {log.metadata.new_role}
                            </div>
                          )}
                          {!log.metadata?.user_email && !log.metadata?.new_role && !log.metadata?.map_id && (
                            <div className="text-[10px] font-mono text-foreground/40 italic">ID: {log.entity_id?.substring(0, 8)}...</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {logs.length > 0 && (
              <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-center">
                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-white h-8">
                  View Full Audit Log
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
