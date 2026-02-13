"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Car, 
  MapPin, 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Loader2, 
  CheckCircle2,
  Lock,
  Mail,
  Smartphone,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-logger";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"profile" | "vehicles" | "addresses">("profile");

  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ full_name: "", phone_number: "" });
  const [newEmail, setNewEmail] = useState("");

  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [newVehicle, setNewVehicle] = useState({ make: "", model: "", year: "", type: "Sedan" });
  
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({ street: "", city: "", state: "", zip_code: "", label: "Home" });

  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login?redirect=/dashboard/profile");
          return;
        }
        setUser(user);

        const [profileRes, vehiclesRes, addressesRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("vehicles").select("*").eq("user_id", user.id),
          supabase.from("addresses").select("*").eq("user_id", user.id),
        ]);

        setProfile(profileRes.data);
        setEditProfileData({ 
          full_name: profileRes.data?.full_name || "", 
          phone_number: profileRes.data?.phone_number || "" 
        });
        setVehicles(vehiclesRes.data || []);
        setAddresses(addressesRes.data || []);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(editProfileData)
        .eq("id", user.id);

      if (error) throw error;

      await logAudit({
        action: "PROFILE_EDIT",
        entityType: "profile",
        entityId: user.id,
        metadata: {
          previous: { full_name: profile.full_name, phone_number: profile.phone_number },
          new: editProfileData
        }
      });

      setProfile({ ...profile, ...editProfileData });
      setIsEditingProfile(false);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVehicle = async () => {
    setSaving(true);
    try {
      if (editingVehicleId) {
        const { error } = await supabase
          .from("vehicles")
          .update({ ...newVehicle, year: parseInt(newVehicle.year) })
          .eq("id", editingVehicleId);

        if (error) throw error;

        await logAudit({
          action: "VEHICLE_EDIT",
          entityType: "vehicle",
          entityId: editingVehicleId,
          metadata: { action: "updated", vehicle: newVehicle }
        });

        setVehicles(vehicles.map(v => v.id === editingVehicleId ? { ...v, ...newVehicle, year: parseInt(newVehicle.year) } : v));
        toast.success("Vehicle updated successfully");
      } else {
        const { data, error } = await supabase
          .from("vehicles")
          .insert({ ...newVehicle, user_id: user.id, year: parseInt(newVehicle.year) })
          .select()
          .single();

        if (error) throw error;

        await logAudit({
          action: "VEHICLE_EDIT",
          entityType: "vehicle",
          entityId: data.id,
          metadata: { action: "added", vehicle: newVehicle }
        });

        setVehicles([...vehicles, data]);
        toast.success("Vehicle added successfully");
      }

      setIsAddingVehicle(false);
      setEditingVehicleId(null);
      setNewVehicle({ make: "", model: "", year: "", type: "Sedan" });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditVehicle = (vehicle: any) => {
    setNewVehicle({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      type: vehicle.type
    });
    setEditingVehicleId(vehicle.id);
    setIsAddingVehicle(true);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Are you sure you want to remove this vehicle?")) return;
    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;

      await logAudit({
        action: "VEHICLE_EDIT",
        entityType: "vehicle",
        entityId: id,
        metadata: { action: "removed" }
      });

      setVehicles(vehicles.filter(v => v.id !== id));
      toast.success("Vehicle removed");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveAddress = async () => {
    setSaving(true);
    try {
      if (editingAddressId) {
        const { error } = await supabase
          .from("addresses")
          .update(newAddress)
          .eq("id", editingAddressId);
        
        if (error) throw error;

        setAddresses(addresses.map(a => a.id === editingAddressId ? { ...a, ...newAddress } : a));
        toast.success("Address updated successfully");
      } else {
        const { data, error } = await supabase
          .from("addresses")
          .insert({ ...newAddress, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        setAddresses([...addresses, data]);
        toast.success("Address added successfully");
      }

      setIsAddingAddress(false);
      setEditingAddressId(null);
      setNewAddress({ street: "", city: "", state: "", zip_code: "", label: "Home" });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddress = (address: any) => {
    setNewAddress({
      street: address.street,
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
      label: address.label || "Home"
    });
    setEditingAddressId(address.id);
    setIsAddingAddress(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to remove this address?")) return;
    try {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;

      setAddresses(addresses.filter(a => a.id !== id));
      toast.success("Address removed");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Account Settings</h1>
        <p className="text-foreground/60 mt-1">Manage your profile, vehicles, and deployment locations.</p>
      </div>

      <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
        <Button 
          variant={activeTab === "profile" ? "default" : "ghost"}
          onClick={() => setActiveTab("profile")}
          className={`rounded-xl px-6 h-11 font-bold uppercase tracking-widest text-[10px] ${activeTab === "profile" ? "blue-gradient border-none" : ""}`}
        >
          <User className="h-4 w-4 mr-2" />
          Profile
        </Button>
        <Button 
          variant={activeTab === "vehicles" ? "default" : "ghost"}
          onClick={() => setActiveTab("vehicles")}
          className={`rounded-xl px-6 h-11 font-bold uppercase tracking-widest text-[10px] ${activeTab === "vehicles" ? "blue-gradient border-none" : ""}`}
        >
          <Car className="h-4 w-4 mr-2" />
          Vehicles
        </Button>
        <Button 
          variant={activeTab === "addresses" ? "default" : "ghost"}
          onClick={() => setActiveTab("addresses")}
          className={`rounded-xl px-6 h-11 font-bold uppercase tracking-widest text-[10px] ${activeTab === "addresses" ? "blue-gradient border-none" : ""}`}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Locations
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="glass-card border-white/10 rounded-3xl overflow-hidden md:col-span-2">
                <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-black uppercase italic tracking-tight">Personal Information</CardTitle>
                      <CardDescription className="text-xs font-bold uppercase tracking-widest text-foreground/40">Core account details</CardDescription>
                    </div>
                    {!isEditingProfile && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)} className="border-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] h-9">
                        <Edit2 className="h-3 w-3 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {isEditingProfile ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary">Full Name</label>
                          <Input 
                            value={editProfileData.full_name} 
                            onChange={(e) => setEditProfileData({ ...editProfileData, full_name: e.target.value })}
                            className="bg-white/5 border-white/10 h-12 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary">Phone Number</label>
                          <Input 
                            value={editProfileData.phone_number} 
                            onChange={(e) => setEditProfileData({ ...editProfileData, phone_number: e.target.value })}
                            className="bg-white/5 border-white/10 h-12 font-bold"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleUpdateProfile} disabled={saving} className="blue-gradient border-none rounded-xl h-11 px-8 font-black uppercase tracking-widest text-xs">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditingProfile(false)} className="border-white/10 rounded-xl h-11 px-8 font-black uppercase tracking-widest text-xs">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Full Name</p>
                        <p className="text-lg font-bold">{profile?.full_name || "Not set"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Email Address</p>
                        <p className="text-lg font-bold">{user?.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Phone Number</p>
                        <p className="text-lg font-bold">{profile?.phone_number || "Not set"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Account ID</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-black italic tracking-tighter bg-primary/10 text-primary px-2 py-1 rounded">
                            {profile?.map_id || "PENDING"}
                          </span>
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "vehicles" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tight">Your Fleet</h2>
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Manage vehicles for deployment</p>
                </div>
                  <Button onClick={() => { setIsAddingVehicle(true); setEditingVehicleId(null); setNewVehicle({ make: "", model: "", year: "", type: "Sedan" }); }} className="blue-gradient border-none rounded-xl font-black uppercase tracking-widest text-[10px] h-11 px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </Button>
                </div>
  
                {isAddingVehicle && (
                  <Card className="glass-card border-primary/30 rounded-3xl overflow-hidden bg-primary/5 mb-8">
                    <CardHeader>
                      <CardTitle className="text-lg font-black uppercase italic tracking-tight">{editingVehicleId ? 'Edit Vehicle' : 'Register New Vehicle'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary">Year</label>
                          <Input 
                            placeholder="2024"
                            value={newVehicle.year}
                            onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                            className="bg-white/10 border-white/10 h-12 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary">Make</label>
                          <Input 
                            placeholder="Ford"
                            value={newVehicle.make}
                            onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                            className="bg-white/10 border-white/10 h-12 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary">Model</label>
                          <Input 
                            placeholder="F-150"
                            value={newVehicle.model}
                            onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                            className="bg-white/10 border-white/10 h-12 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary">Type</label>
                          <select
                            value={newVehicle.type}
                            onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                            className="flex h-12 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-bold"
                          >
                            <option value="Sedan">Sedan</option>
                            <option value="SUV">SUV</option>
                            <option value="Truck">Truck</option>
                            <option value="Coupe">Coupe</option>
                            <option value="Hatchback">Hatchback</option>
                            <option value="Convertible">Convertible</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleSaveVehicle} disabled={saving} className="blue-gradient border-none rounded-xl h-11 px-8 font-black uppercase tracking-widest text-xs">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          {editingVehicleId ? "Update Vehicle" : "Save Vehicle"}
                        </Button>
                        <Button variant="outline" onClick={() => { setIsAddingVehicle(false); setEditingVehicleId(null); }} className="border-white/10 rounded-xl h-11 px-8 font-black uppercase tracking-widest text-xs">
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
  
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vehicles.length === 0 ? (
                    <div className="col-span-full py-20 text-center glass-card rounded-3xl border-dashed border-white/10">
                      <Car className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
                      <p className="text-foreground/40 font-bold uppercase tracking-widest">No vehicles registered</p>
                    </div>
                  ) : (
                    vehicles.map((v) => (
                      <Card key={v.id} className="glass-card border-white/10 rounded-3xl overflow-hidden group hover:border-primary/50 transition-all">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                              <Car className="h-6 w-6" />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditVehicle(v)}
                                className="h-8 w-8 rounded-lg text-foreground/40 hover:text-primary hover:bg-primary/10"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteVehicle(v.id)}
                                className="h-8 w-8 rounded-lg text-foreground/40 hover:text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <h3 className="text-xl font-black uppercase italic tracking-tight">{v.year} {v.make}</h3>
                          <p className="text-lg font-bold text-primary mb-2">{v.model}</p>
                          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-foreground/60">
                            {v.type}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tight">Deployment Locations</h2>
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Where we should meet you</p>
                </div>
                <Button onClick={() => { setIsAddingAddress(true); setEditingAddressId(null); setNewAddress({ street: "", city: "", state: "", zip_code: "", label: "Home" }); }} className="blue-gradient border-none rounded-xl font-black uppercase tracking-widest text-[10px] h-11 px-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </div>

              {isAddingAddress && (
                <Card className="glass-card border-primary/30 rounded-3xl overflow-hidden bg-primary/5 mb-8">
                  <CardHeader>
                    <CardTitle className="text-lg font-black uppercase italic tracking-tight">{editingAddressId ? 'Edit Deployment Point' : 'New Deployment Point'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Street Address</label>
                        <Input 
                          placeholder="123 Main St"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          className="bg-white/10 border-white/10 h-12 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary">City</label>
                        <Input 
                          placeholder="Los Angeles"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="bg-white/10 border-white/10 h-12 font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary">State</label>
                          <Input 
                            placeholder="CA"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                            className="bg-white/10 border-white/10 h-12 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary">Zip</label>
                          <Input 
                            placeholder="90210"
                            value={newAddress.zip_code}
                            onChange={(e) => setNewAddress({ ...newAddress, zip_code: e.target.value })}
                            className="bg-white/10 border-white/10 h-12 font-bold"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Label (Optional)</label>
                        <Input 
                          placeholder="Home, Office, etc."
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                          className="bg-white/10 border-white/10 h-12 font-bold"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSaveAddress} disabled={saving} className="blue-gradient border-none rounded-xl h-11 px-8 font-black uppercase tracking-widest text-xs">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {editingAddressId ? "Update Location" : "Save Location"}
                      </Button>
                      <Button variant="outline" onClick={() => { setIsAddingAddress(false); setEditingAddressId(null); }} className="border-white/10 rounded-xl h-11 px-8 font-black uppercase tracking-widest text-xs">
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.length === 0 ? (
                  <div className="col-span-full py-20 text-center glass-card rounded-3xl border-dashed border-white/10">
                    <MapPin className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
                    <p className="text-foreground/40 font-bold uppercase tracking-widest">No locations registered</p>
                  </div>
                ) : (
                  addresses.map((a) => (
                    <Card key={a.id} className="glass-card border-white/10 rounded-3xl overflow-hidden group hover:border-primary/50 transition-all">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                            <MapPin className="h-6 w-6" />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditAddress(a)}
                              className="h-8 w-8 rounded-lg text-foreground/40 hover:text-primary hover:bg-primary/10"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteAddress(a.id)}
                              className="h-8 w-8 rounded-lg text-foreground/40 hover:text-red-500 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-black uppercase italic tracking-tight">{a.label || "Address"}</h3>
                        </div>
                        <p className="text-sm font-bold text-foreground/80">{a.street}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-1">
                          {a.city}, {a.state} {a.zip_code}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
