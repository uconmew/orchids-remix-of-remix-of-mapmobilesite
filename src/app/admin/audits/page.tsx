"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  History, 
  Search, 
  Filter, 
  ArrowRight, 
  Fingerprint, 
  Calendar,
  MoreVertical,
  Loader2,
  Clock,
  ExternalLink
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AuditsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
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
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch audits: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    const searchMatch = 
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performer_map_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performed_by_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const entityMatch = entityFilter === "all" || log.entity_type === entityFilter;
    
    return searchMatch && entityMatch;
  });

  const entities = ["all", ...new Set(logs.map(l => l.entity_type))];

  return (
    <div className="space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight italic">Audits</h2>
            <p className="text-foreground/60 mt-1 text-sm font-medium">Complete audit trail of all customer and administrative actions.</p>
          </div>
          <Button 
            onClick={fetchLogs} 
            variant="outline" 
            className="border-white/10 hover:bg-white/5 h-10 font-black uppercase tracking-widest text-[10px]"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <History className="h-4 w-4 mr-2" />}
            Refresh Audits
          </Button>
        </div>


      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <Input 
            placeholder="Search by action, ID or performer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-sm font-bold h-12"
          />
        </div>
        <div className="flex gap-2">
          {entities.map(entity => (
            <Button
              key={entity}
              variant={entityFilter === entity ? "default" : "outline"}
              onClick={() => setEntityFilter(entity)}
              className={cn(
                "h-12 px-6 font-black uppercase tracking-widest text-[10px] border-white/10",
                entityFilter === entity ? "blue-gradient border-none" : "hover:bg-white/5"
              )}
            >
              {entity}
            </Button>
          ))}
        </div>
      </div>

      <Card className="glass-card border-white/5 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Timestamp</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Performer</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Action</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Entity</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="p-8 bg-white/[0.01]"></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-foreground/40 font-bold uppercase tracking-widest text-sm">
                    No matching activity logs found
                  </td>
                </tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-6">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs font-mono text-white flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-primary/60" />
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] font-mono text-foreground/40 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-colors">
                        <Fingerprint className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs group-hover:text-primary transition-colors">
                          {log.performed_by_profile?.full_name || 'System'}
                        </div>
                        <div className="text-[10px] text-primary font-mono font-black italic tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {log.performer_map_id || log.performed_by_profile?.map_id || 'ID UNKNOWN'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <Badge className={cn(
                      "uppercase text-[9px] font-black border-none px-3 py-1",
                      log.action.includes('CREATE') ? "bg-success/20 text-success" :
                      log.action.includes('DELETE') || log.action.includes('REMOVE') ? "bg-red-500/20 text-red-500" :
                      log.action.includes('UPDATE') ? "bg-blue-500/20 text-blue-500" :
                      "bg-white/10 text-foreground/60"
                    )}>
                      {log.action.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-widest text-white/80 italic">
                        {log.entity_type}
                      </span>
                      {log.entity_id && (
                        <span className="text-[10px] font-mono text-foreground/30 truncate max-w-[100px]">
                          ID: {log.entity_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1.5 max-w-md">
                      {log.metadata && Object.entries(log.metadata).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex items-start gap-2 text-[10px]">
                          <span className="font-black uppercase tracking-widest text-foreground/40 whitespace-nowrap">{key.replace('_', ' ')}:</span>
                          <span className="font-bold text-foreground/80 break-all italic">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                      {!log.metadata && <span className="text-[10px] text-foreground/30 italic">No additional details</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
