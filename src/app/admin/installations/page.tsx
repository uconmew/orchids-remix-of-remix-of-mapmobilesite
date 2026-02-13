"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Clock, 
  DollarSign, 
  Wrench,
  Tag, 
  Image as ImageIcon,
  Loader2,
  X,
  Upload
} from "lucide-react";
import Image from "next/image";
import { logAudit } from "@/lib/audit-logger";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "Audio_Installation",
  "Security_Systems",
  "Interior_Lighting",
  "Custom_Fabrication",
  "Window_Tinting",
  "Detailing_Services",
  "Diagnostic_Repair"
];

export default function AdminInstallationsPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: "",
    estimated_time: "",
    category: "Audio_Installation",
    image_url: "",
    active: true
  });
  
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to fetch installations");
    } else {
      setServices(data || []);
    }
    setLoading(false);
  }

  const handleOpenDialog = (service?: any) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || "",
        base_price: service.base_price.toString(),
        estimated_time: service.estimated_time?.toString() || "60",
        category: service.category || "Audio_Installation",
        image_url: service.image_url || "",
        active: service.active ?? true
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        description: "",
        base_price: "",
        estimated_time: "60",
        category: "Audio_Installation",
        image_url: "",
        active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `service-images/${fileName}`;

      console.log("Uploading to path:", filePath);

      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('services')
        .getPublicUrl(filePath);

      if (!data?.publicUrl) throw new Error("Failed to generate public URL");

      console.log("Generated Public URL:", data.publicUrl);

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error detailed:", error);
      toast.error(error.message || "Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.base_price || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (uploading) {
      toast.error("Please wait for the image to finish uploading");
      return;
    }

    try {
      setIsSaving(true);
      
      const payload = {
        name: formData.name,
        description: formData.description,
        base_price: parseFloat(formData.base_price),
        estimated_time: parseInt(formData.estimated_time) || 60,
        category: formData.category,
        image_url: formData.image_url,
        active: formData.active
      };

      console.log("Saving payload:", payload);

      let error;
      let resultId;

      if (editingService) {
        const { error: updateError } = await supabase
          .from("services")
          .update(payload)
          .eq("id", editingService.id);
        error = updateError;
        resultId = editingService.id;
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from("services")
          .insert([payload])
          .select()
          .single();
        error = insertError;
        resultId = insertData?.id;
      }

      if (error) {
        console.error("Database save error:", error);
        throw error;
      }

      await logAudit({
        action: editingService ? 'UPDATE' : 'CREATE',
        entityType: 'service',
        entityId: resultId,
        metadata: {
          name: formData.name,
          category: formData.category,
          price: formData.base_price
        }
      });

      toast.success(editingService ? "Installation updated" : "Installation created");
      setIsDialogOpen(false);
      fetchServices();
    } catch (error: any) {
      toast.error(error.message || "Error saving installation");
    } finally {
      setIsSaving(false);
    }
  };

  async function toggleStatus(service: any) {
    const { error } = await supabase
      .from("services")
      .update({ active: !service.active })
      .eq("id", service.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      await logAudit({
        action: 'UPDATE_STATUS',
        entityType: 'service',
        entityId: service.id,
        metadata: {
          name: service.name,
          active: !service.active
        }
      });
      toast.success(`Installation ${service.active ? 'hidden' : 'activated'}`);
      fetchServices();
    }
  }

  async function deleteService(id: string) {
    if (!confirm("Are you sure you want to delete this installation?")) return;

    const serviceToDelete = services.find(s => s.id === id);
    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete installation");
    } else {
      await logAudit({
        action: 'DELETE',
        entityType: 'service',
        entityId: id,
        metadata: {
          name: serviceToDelete?.name
        }
      });
      toast.success("Installation deleted successfully");
      fetchServices();
    }
  }

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight italic">Installation Hub</h2>
          <p className="text-foreground/60 mt-1 text-sm font-medium">Manage professional deployment offerings and rates.</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="blue-gradient text-white border-none font-black uppercase tracking-widest text-[10px] h-11 px-8 gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          New Installation
        </Button>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 p-6 overflow-hidden">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
            <Input 
              placeholder="Search installations by name or category..." 
              className="pl-12 h-14 bg-white/5 border-white/10 text-sm font-bold uppercase tracking-widest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">Protocol</th>
                <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">Category</th>
                <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">Base Rate</th>
                <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">Deployment Time</th>
                <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">Status</th>
                <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-8 bg-white/[0.01] rounded-lg mb-2"></td>
                  </tr>
                ))
              ) : filteredServices.map((service) => (
                <tr key={service.id} className="group hover:bg-white/[0.02] transition-all">
                  <td className="py-6 px-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-primary/20 transition-colors">
                        <Image 
                          src={service.image_url || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f"} 
                          alt="" 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div>
                        <div className="font-black text-white italic group-hover:text-primary transition-colors">{service.name}</div>
                        <div className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest truncate max-w-[200px] mt-0.5">
                          {service.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-4">
                    <span className="text-[10px] font-black text-foreground/60 uppercase tracking-[0.2em] bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                      {service.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-6 px-4">
                    <div className="font-black text-white italic">${Number(service.base_price).toLocaleString()}</div>
                  </td>
                  <td className="py-6 px-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-foreground/40 uppercase tracking-widest">
                      <Clock className="h-3 w-3 text-primary/60" />
                      {service.estimated_time}m
                    </div>
                  </td>
                  <td className="py-6 px-4">
                    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.2em] ${
                      service.active ? 'bg-green-500/10 text-green-500' : 'bg-foreground/5 text-foreground/40'
                    }`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${service.active ? 'bg-green-500' : 'bg-foreground/40'}`} />
                      {service.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="py-6 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-white/10 h-10 w-10 rounded-xl">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 w-56 p-2 rounded-xl shadow-2xl">
                        <DropdownMenuItem 
                          onClick={() => handleOpenDialog(service)}
                          className="gap-3 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest focus:bg-white/5 cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4 text-primary" /> Edit Protocol
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleStatus(service)}
                          className="gap-3 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest focus:bg-white/5 cursor-pointer"
                        >
                          {service.active ? (
                            <><EyeOff className="h-4 w-4 text-foreground/60" /> Deactivate</>
                          ) : (
                            <><Eye className="h-4 w-4 text-green-500" /> Activate</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteService(service.id)}
                          className="gap-3 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest focus:bg-red-500/10 text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" /> Purge Installation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {!loading && filteredServices.length === 0 && (
            <div className="py-20 text-center text-foreground/20 font-black uppercase tracking-[0.4em]">
              No matching records
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-2xl text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight italic">
              {editingService ? 'Modify Installation Protocol' : 'Engineer New Installation'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-6">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-8">
                <div className="relative h-32 w-32 rounded-3xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center group shadow-2xl shadow-black">
                  {formData.image_url ? (
                    <>
                      <Image src={formData.image_url} alt="Preview" fill className="object-cover" />
                      <button 
                        onClick={() => setFormData(p => ({ ...p, image_url: "" }))}
                        className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="h-10 w-10 text-white/10" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Protocol Hero Image</Label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="service-image-upload" 
                        onChange={handleUploadImage}
                        disabled={uploading}
                      />
                      <Label 
                        htmlFor="service-image-upload"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer font-black text-[10px] uppercase tracking-widest transition-all hover:border-primary/50"
                      >
                        <Upload className="h-4 w-4" />
                        {uploading ? 'Uploading...' : 'Upload Media'}
                      </Label>
                    </div>
                    <p className="text-[9px] text-foreground/30 font-bold uppercase tracking-widest">16:9 Ratio Preferred</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Protocol Name</Label>
              <Input 
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Elite Stage 3 Audio"
                className="bg-white/5 border-white/10 h-12 text-sm font-bold italic"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Deployment Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={val => setFormData(p => ({ ...p, category: val }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 h-12 text-sm font-bold">
                  <SelectValue placeholder="Select Sector" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10 text-white font-bold uppercase tracking-widest text-[10px]">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Base Rate ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input 
                  type="number"
                  value={formData.base_price}
                  onChange={e => setFormData(p => ({ ...p, base_price: e.target.value }))}
                  placeholder="0.00"
                  className="pl-10 bg-white/5 border-white/10 h-12 text-sm font-black italic"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Deployment Time (mins)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input 
                  type="number"
                  value={formData.estimated_time}
                  onChange={e => setFormData(p => ({ ...p, estimated_time: e.target.value }))}
                  placeholder="60"
                  className="pl-10 bg-white/5 border-white/10 h-12 text-sm font-black italic"
                />
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Deployment Scope</Label>
              <Textarea 
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Detail the technical specifications and inclusions..."
                className="bg-white/5 border-white/10 min-h-[120px] resize-none text-sm font-medium"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 border-t border-white/5 pt-8">
            <Button 
              variant="ghost" 
              onClick={() => setIsDialogOpen(false)}
              className="font-black uppercase tracking-widest text-[10px] hover:bg-white/5 px-6 h-12"
            >
              Abort Changes
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="blue-gradient text-white border-none font-black uppercase tracking-widest text-[11px] px-10 rounded-2xl h-12 shadow-2xl shadow-primary/40 active:scale-95 transition-all"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : (editingService ? 'Synchronize Protocol' : 'Deploy Protocol')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
