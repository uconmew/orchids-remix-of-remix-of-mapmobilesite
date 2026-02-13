"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  Send, 
  Search,
  MessageSquare,
  History,
  Loader2,
  Mail,
  User as UserIcon,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

interface Communication {
  id: string;
  user_id: string;
  subject: string;
  content: string;
  sent_at: string;
  status: string;
}

export default function AdminMessagesPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Message Form State
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("full_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch users: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(userId: string) {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/admin/communications?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data);
    } catch (error: any) {
      toast.error("Error fetching messages: " + error.message);
    } finally {
      setMessagesLoading(false);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !subject || !content) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          recipientEmail: selectedUser.email,
          subject,
          content,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
      }

      toast.success("Message sent successfully!");
      setSubject("");
      setContent("");
      fetchMessages(selectedUser.id);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 overflow-hidden">
      {/* Sidebar: User List */}
      <Card className="w-80 glass-card border-white/5 flex flex-col p-0">
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-black uppercase tracking-widest italic mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Recipients
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
            <Input 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-[10px] font-bold uppercase tracking-widest h-9"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center p-8 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 group",
                    selectedUser?.id === user.id 
                      ? "bg-primary text-white shadow-[0_0_15px_rgba(0,102,255,0.2)]" 
                      : "hover:bg-white/5 text-foreground/60 hover:text-white"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold",
                    selectedUser?.id === user.id ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"
                  )}>
                    {user.full_name?.charAt(0) || user.email?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs truncate uppercase tracking-tighter">
                      {user.full_name || "No Name"}
                    </div>
                    <div className={cn(
                      "text-[10px] truncate opacity-60",
                      selectedUser?.id === user.id ? "text-white" : "font-mono"
                    )}>
                      {user.email}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Area: Chat & Composer */}
      <div className="flex-1 flex flex-col gap-6">
        {selectedUser ? (
          <>
            {/* Conversation History */}
            <Card className="flex-1 glass-card border-white/5 flex flex-col p-0 overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Communication History
                  </h3>
                  <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-0.5">
                    with {selectedUser.full_name}
                  </p>
                </div>
                <Badge variant="outline" className="border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest">
                  {messages.length} Messages
                </Badge>
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                      <MessageSquare className="h-12 w-12 mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No previous messages found</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-black uppercase tracking-widest text-primary italic">
                            {msg.subject}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                            <Clock className="h-3 w-3" />
                            {new Date(msg.sent_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-white/10 transition-colors">
                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-1 w-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-foreground/40 italic">
                            Status: {msg.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>

            {/* Message Composer */}
            <Card className="glass-card border-white/5 p-6 shrink-0">
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-foreground/60 italic">
                  <Send className="h-3 w-3 text-primary" />
                  New Message to {selectedUser.email}
                </div>
                
                <div className="space-y-4">
                  <Input 
                    placeholder="Subject Line"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-xs font-bold uppercase tracking-widest h-10"
                  />
                  <Textarea 
                    placeholder="Type your message here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-sm font-medium min-h-[100px] rounded-xl focus:ring-primary"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest italic flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Email will be sent via Resend
                    </p>
                    <Button 
                      type="submit" 
                      disabled={sending || !subject || !content}
                      className="blue-gradient text-white border-none font-black uppercase tracking-widest text-[10px] px-8 h-10"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Dispatch Email"}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center glass-card border-white/5 text-center p-12 opacity-50 italic">
            <div className="h-20 w-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-6">
              <UserIcon className="h-10 w-10 text-foreground/20" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest">Select a Recipient</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-2 max-w-xs">
              Choose a customer from the left panel to view history and compose a message.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
