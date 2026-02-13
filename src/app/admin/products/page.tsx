"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Search, MoreVertical, Edit2, Trash2, Eye, EyeOff, Package, Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { logActivity } from "@/lib/audit-logger";
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

const VEHICLE_TYPES = ["Car", "Marine", "Truck"];
const SUB_CATEGORIES = [
  { name: "Headunits", id: "HEAD_UNIT" },
  { name: "Amplifiers", id: "AMPLIFIER" },
  { name: "Subwoofers", id: "SUBWOOFER" },
  { name: "Speakers", id: "SPEAKERS" },
  { name: "Security", id: "SECURITY" },
  { name: "Remote Start", id: "REMOTE_START" },
  { name: "Lighting", id: "LIGHTING" },
  { name: "Custom Gear", id: "CUSTOM" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    brand: "",
    category: "Car",
    sub_category: "HEAD_UNIT",
    image_url: "",
    active: true
  });
  
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('admin-products-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to fetch products");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        stock_quantity: product.stock_quantity?.toString() || "0",
        brand: product.brand || "",
        category: product.category || "Car",
        sub_category: product.sub_category || "HEAD_UNIT",
        image_url: product.image_url || "",
        active: product.active ?? true
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        stock_quantity: "0",
        brand: "",
        category: "Car",
        sub_category: "HEAD_UNIT",
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
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      if (!data?.publicUrl) throw new Error("Failed to generate public URL");

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.brand) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (uploading) {
      toast.error("Please wait for image upload to complete");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity) || 0,
      };

      let error;
      if (editingProduct) {
        ({ error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id));
      } else {
        ({ error } = await supabase
          .from("products")
          .insert([payload]));
      }

      if (error) throw error;

      await logActivity({
        action: editingProduct ? 'UPDATE' : 'CREATE',
        entityType: 'product',
        entityId: editingProduct?.id,
        metadata: {
          name: formData.name,
          price: formData.price,
          brand: formData.brand
        }
      });

      toast.success(editingProduct ? "Product updated" : "Product created");
      setIsDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Error saving product");
    } finally {
      setIsSaving(false);
    }
  };

  async function toggleStatus(product: any) {
    const { error } = await supabase
      .from("products")
      .update({ active: !product.active })
      .eq("id", product.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      await logActivity({
        action: 'UPDATE_STATUS',
        entityType: 'product',
        entityId: product.id,
        metadata: {
          name: product.name,
          active: !product.active
        }
      });
      toast.success(`Product ${product.active ? 'deactivated' : 'activated'}`);
      fetchProducts();
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const productToDelete = products.find(p => p.id === id);
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete product");
    } else {
      await logActivity({
        action: 'DELETE',
        entityType: 'product',
        entityId: id,
        metadata: {
          name: productToDelete?.name
        }
      });
      toast.success("Product deleted successfully");
      fetchProducts();
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Product Inventory</h2>
          <p className="text-foreground/60 mt-1 text-sm font-medium">Manage your gear, stock levels, and pricing.</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="blue-gradient text-white border-none font-bold h-11 px-6 gap-2"
        >
          <Plus className="h-5 w-5" />
          Add New Product
        </Button>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
            <Input 
              placeholder="Search products by name, brand or category..." 
              className="pl-12 h-12 bg-white/5 border-white/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-4 px-4 text-xs font-black uppercase tracking-widest text-foreground/40">Product</th>
                <th className="pb-4 px-4 text-xs font-black uppercase tracking-widest text-foreground/40">Category</th>
                <th className="pb-4 px-4 text-xs font-black uppercase tracking-widest text-foreground/40">Price</th>
                <th className="pb-4 px-4 text-xs font-black uppercase tracking-widest text-foreground/40">Stock</th>
                <th className="pb-4 px-4 text-xs font-black uppercase tracking-widest text-foreground/40">Status</th>
                <th className="pb-4 px-4 text-xs font-black uppercase tracking-widest text-foreground/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-8 bg-white/5 rounded-lg mb-2"></td>
                  </tr>
                ))
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                        <Image 
                          src={product.image_url || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2"} 
                          alt="" 
                          fill 
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-white">{product.name}</div>
                        <div className="text-[10px] text-primary font-black uppercase tracking-wider">
                          {product.brand}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white/80 uppercase tracking-widest">
                        {product.category}
                      </span>
                      <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider">
                        {product.sub_category?.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-black text-white">${Number(product.price).toLocaleString()}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className={`text-sm font-bold ${product.stock_quantity <= 5 ? 'text-red-500' : 'text-foreground/60'}`}>
                      {product.stock_quantity} units
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                      product.active ? 'bg-success/20 text-success' : 'bg-foreground/10 text-foreground/40'
                    }`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${product.active ? 'bg-success' : 'bg-foreground/40'}`} />
                      {product.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-white/10 h-8 w-8 rounded-lg">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 w-48 p-2 rounded-xl shadow-2xl">
                        <DropdownMenuItem 
                          onClick={() => handleOpenDialog(product)}
                          className="gap-2 px-3 py-2.5 rounded-lg text-sm font-bold focus:bg-white/5 cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4 text-primary" /> Edit Product
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleStatus(product)}
                          className="gap-2 px-3 py-2.5 rounded-lg text-sm font-bold focus:bg-white/5 cursor-pointer"
                        >
                          {product.active ? (
                            <><EyeOff className="h-4 w-4 text-foreground/60" /> Hide from Store</>
                          ) : (
                            <><Eye className="h-4 w-4 text-success" /> Make Public</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteProduct(product.id)}
                          className="gap-2 px-3 py-2.5 rounded-lg text-sm font-bold focus:bg-red-500/10 text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" /> Delete Gear
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {!loading && filteredProducts.length === 0 && (
            <div className="py-12 text-center text-foreground/40 font-bold uppercase tracking-widest">
              No products found
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-2xl text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {editingProduct ? 'Edit Product' : 'Add New Gear'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-6">
                <div className="relative h-32 w-32 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center group">
                  {formData.image_url ? (
                    <>
                      <Image src={formData.image_url} alt="Preview" fill className="object-cover" />
                      <button 
                        onClick={() => setFormData(p => ({ ...p, image_url: "" }))}
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="h-8 w-8 text-white/20" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Product Photo</Label>
                  <div className="flex items-center gap-4">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      id="image-upload" 
                      onChange={handleUploadImage}
                      disabled={uploading}
                    />
                    <Label 
                      htmlFor="image-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer font-bold text-sm transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Choose Image'}
                    </Label>
                    <p className="text-[10px] text-foreground/40 font-medium">PNG, JPG or WebP. Max 5MB.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Product Name</Label>
              <Input 
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Sony XAV-AX6000"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Brand</Label>
              <Input 
                value={formData.brand}
                onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))}
                placeholder="e.g. Sony, Alpine, JL Audio"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Vehicle Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={val => setFormData(p => ({ ...p, category: val }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select Vehicle" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                  {VEHICLE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Sub Category</Label>
              <Select 
                value={formData.sub_category} 
                onValueChange={val => setFormData(p => ({ ...p, sub_category: val }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                  {SUB_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Price ($)</Label>
              <Input 
                type="number"
                value={formData.price}
                onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                placeholder="0.00"
                className="bg-white/5 border-white/10 font-black"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Stock Quantity</Label>
              <Input 
                type="number"
                value={formData.stock_quantity}
                onChange={e => setFormData(p => ({ ...p, stock_quantity: e.target.value }))}
                placeholder="0"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Description</Label>
              <Textarea 
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe the gear features, specs and what makes it special..."
                className="bg-white/5 border-white/10 min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-8 border-t border-white/10 pt-6">
            <Button 
              variant="ghost" 
              onClick={() => setIsDialogOpen(false)}
              className="font-bold hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="blue-gradient text-white border-none font-black px-8 rounded-xl h-11 shadow-lg shadow-primary/20"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingProduct ? 'Update Product' : 'Add to Inventory')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
