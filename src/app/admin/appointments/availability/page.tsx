"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  ChevronLeft,
  Settings,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";

export default function AvailabilitySettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalDuration, setGlobalDuration] = useState<number>(120);

  const DAYS = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [settingsRes, overridesRes] = await Promise.all([
      supabase.from("availability_settings").select("*").order("day_of_week"),
      supabase.from("availability_overrides").select("*").order("override_date")
    ]);

    setSettings(settingsRes.data || []);
    setOverrides(overridesRes.data || []);
    setLoading(false);
  }

  const handleUpdateSetting = async (dayOfWeek: number, updates: any) => {
    const existing = settings.find(s => s.day_of_week === dayOfWeek);
    if (existing) {
      const { error } = await supabase
        .from("availability_settings")
        .update(updates)
        .eq("id", existing.id);
      if (error) toast.error("Update failed");
      else {
        // Optimistic update for better UX
        setSettings(prev => prev.map(s => s.day_of_week === dayOfWeek ? { ...s, ...updates } : s));
      }
    } else {
      const { error } = await supabase
        .from("availability_settings")
        .insert({ 
          day_of_week: dayOfWeek, 
          is_active: true,
          start_time: "09:00:00",
          end_time: "17:00:00",
          slot_duration_minutes: 120,
          ...updates 
        });
      if (error) toast.error("Create failed");
      else fetchData();
    }
  };

  const applyGlobalDuration = async (duration: number) => {
    if (isNaN(duration) || duration <= 0) return toast.error("Invalid duration");
    
    setSaving(true);
    const updates = settings.map(s => ({
      ...s,
      slot_duration_minutes: duration
    }));

    const { error } = await supabase
      .from("availability_settings")
      .upsert(updates);

    if (error) toast.error("Failed to update all days");
    else {
      toast.success(`Updated all days to ${duration} min slots`);
      fetchData();
    }
    setSaving(false);
  };

  const handleAddOverride = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const isBlocked = formData.get("blocked") === "on";

    const { error } = await supabase
      .from("availability_overrides")
      .insert({
        override_date: date,
        is_blocked: isBlocked,
        start_time: isBlocked ? null : "09:00:00",
        end_time: isBlocked ? null : "17:00:00"
      });

    if (error) toast.error("Failed to add override");
    else {
      toast.success("Override added");
      fetchData();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleDeleteOverride = async (id: string) => {
    const { error } = await supabase
      .from("availability_overrides")
      .delete()
      .eq("id", id);
    if (error) toast.error("Delete failed");
    else fetchData();
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="h-10 w-10 border-white/5 hover:bg-white/5">
          <Link href="/admin/appointments"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight italic">Availability Settings</h1>
          <p className="text-foreground/60 text-sm font-medium">Configure global business hours and block specific dates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Schedule */}
        <Card className="glass-card border-white/5">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Standard Weekly Hours
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    value={globalDuration} 
                    onChange={(e) => setGlobalDuration(parseInt(e.target.value))}
                    className="w-20 h-8 text-[10px] bg-black border-white/10"
                    placeholder="Min"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => applyGlobalDuration(globalDuration)}
                    disabled={saving}
                    className="h-8 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/10"
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply All"}
                  </Button>
                </div>
              </div>
            </CardHeader>

          <CardContent className="p-6 space-y-4">
            {DAYS.map((day, idx) => {
              const setting = settings.find(s => s.day_of_week === idx);
              return (
                <div key={day} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <Switch 
                      checked={!!setting?.is_active} 
                      onCheckedChange={(checked) => handleUpdateSetting(idx, { is_active: checked })}
                    />
                    <span className={`font-bold uppercase tracking-widest text-[10px] ${setting?.is_active ? 'text-white' : 'text-foreground/40'}`}>
                      {day}
                    </span>
                  </div>
                  {setting?.is_active && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Input 
                          type="time" 
                          value={setting.start_time.slice(0, 5)} 
                          onChange={(e) => handleUpdateSetting(idx, { start_time: e.target.value + ":00" })}
                          className="bg-black border-white/10 h-8 text-[10px] w-24 px-2"
                        />
                        <span className="text-foreground/40 text-[10px]">to</span>
                        <Input 
                          type="time" 
                          value={setting.end_time.slice(0, 5)} 
                          onChange={(e) => handleUpdateSetting(idx, { end_time: e.target.value + ":00" })}
                          className="bg-black border-white/10 h-8 text-[10px] w-24 px-2"
                        />
                      </div>
                      <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                        <Input 
                          type="number" 
                          value={setting.slot_duration_minutes || 120} 
                          onChange={(e) => handleUpdateSetting(idx, { slot_duration_minutes: parseInt(e.target.value) })}
                          className="bg-black border-white/10 h-8 text-[10px] w-14 px-2"
                        />
                        <span className="text-foreground/40 text-[8px] uppercase font-black">min</span>
                      </div>
                    </div>
                  )}
                  {!setting?.is_active && (
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground/20 italic">Closed</span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Add Override */}
          <Card className="glass-card border-white/5">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Date Overrides
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddOverride} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Select Date</label>
                    <Input name="date" type="date" required className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                    <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-white/10 bg-white/5">
                      <Switch name="blocked" id="blocked-switch" />
                      <label htmlFor="blocked-switch" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Block Date</label>
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full blue-gradient text-white border-none font-bold uppercase tracking-widest text-[10px]">
                  Add Exception
                </Button>
              </form>

              <div className="mt-8 space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-4">Upcoming Exceptions</h4>
                {overrides.length > 0 ? overrides.map((over) => (
                  <div key={over.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <p className="font-bold text-sm">{new Date(over.override_date).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                      <p className="text-[10px] uppercase font-black tracking-widest text-red-500 italic">
                        {over.is_blocked ? "Permanently Blocked" : `${over.start_time} - ${over.end_time}`}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteOverride(over.id)}
                      className="h-8 w-8 text-foreground/20 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )) : (
                  <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-[10px] uppercase font-black tracking-widest text-foreground/20 italic">No exceptions configured</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="bg-primary/5 border border-primary/20">
            <CardContent className="p-6 flex gap-4">
              <AlertCircle className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h4 className="font-black uppercase tracking-tight italic text-primary">System Notice</h4>
                <p className="text-sm text-foreground/60 leading-relaxed mt-1">
                  Changes to availability will reflect immediately on the customer booking page. Existing appointments will not be affected by schedule changes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
