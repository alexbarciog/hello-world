import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Send,
  Inbox,
  LinkIcon,
  MessageSquare,
  Sparkles,
  PlusCircle,
  Smile,
  Eye,
  Heart,
  Zap,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";

/* ── Types ────────────────────────────────────────────────── */

interface ChatAttendee {
  id?: string;
  display_name?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  profile_picture?: string;
  avatar_url?: string;
  picture_url?: string;
  image_url?: string;
  provider_id?: string;
}

interface Chat {
  id: string;
  attendees?: ChatAttendee[];
  last_message?: {
    text?: string;
    body?: string;
    content?: string;
    timestamp?: string;
    date?: string;
    created_at?: string;
    sender_name?: string;
  };
  timestamp?: string;
  updated_at?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  text?: string;
  body?: string;
  sender_id?: string;
  sender?: { id?: string; display_name?: string; name?: string };
  timestamp?: string;
  date?: string;
  created_at?: string;
  is_sender?: boolean | number | string;
  from_me?: boolean | number | string;
  direction?: string;
}

/* ── API helpers ──────────────────────────────────────────── */

async function callMessaging(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(
    `https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/linkedin-messaging`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d2FqbGV6Z2V1cm52dnJ2ZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjMxMzcsImV4cCI6MjA4OTMzOTEzN30.ceVF9PcMblbGAmAEqCwm9qOdtZfUxy_clBcTAW9VNLw",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");

  if (body.action === "list_chats") {
    const items = data?.items || data?.data || (Array.isArray(data) ? data : []);
    if (items.length > 0) {
      console.log("[Unibox] Raw chat sample:", JSON.stringify(items[0], null, 2));
    }
  }

  return data;
}

/* ── Helpers ──────────────────────────────────────────────── */

function attendeeName(a: ChatAttendee): string {
  if (a.display_name) return a.display_name;
  if (a.name) return a.name;
  if (a.first_name || a.last_name) {
    return [a.first_name, a.last_name].filter(Boolean).join(" ");
  }
  return "";
}

function chatDisplayName(chat: Chat): string {
  const a = chat.attendees;
  if (!a?.length) return "Unknown";
  for (const att of a) {
    const n = attendeeName(att);
    if (n && n !== "Unknown") return n;
  }
  return attendeeName(a[0]) || "LinkedIn User";
}

function chatAvatar(chat: Chat): string | undefined {
  const a = chat.attendees;
  if (!a?.length) return undefined;
  for (const att of a) {
    const url = att.profile_picture_url || att.profile_picture || att.avatar_url || att.picture_url || att.image_url;
    if (url) return url;
  }
  return undefined;
}

function chatInitials(chat: Chat): string {
  const name = chatDisplayName(chat);
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function chatLastText(chat: Chat): string {
  if (!chat.last_message) return "No messages yet";
  return chat.last_message.text || chat.last_message.body || chat.last_message.content || "";
}

function chatTimestamp(chat: Chat): string {
  const raw = chat.last_message?.timestamp || chat.last_message?.date || chat.last_message?.created_at || chat.timestamp || chat.updated_at;
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "dd MMM");
}

function messageText(m: Message): string {
  return m.text || m.body || "";
}

function messageTime(m: Message): string {
  const raw = m.timestamp || m.date || m.created_at;
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return format(d, "HH:mm");
}

/* ── Filter tabs ──────────────────────────────────────────── */
const FILTER_TABS = ["All", "Unread", "Archived", "Hot 🔥"] as const;

/* ── Component ────────────────────────────────────────────── */

export default function Unibox() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [showSearch, setShowSearch] = useState(false);

  // ── Fetch chats ──
  const {
    data: chatsData,
    isLoading: chatsLoading,
    error: chatsError,
  } = useQuery({
    queryKey: ["unibox-chats"],
    queryFn: () => callMessaging({ action: "list_chats", limit: 50 }),
    refetchInterval: 30000,
  });

  const chats: Chat[] = chatsData?.items || chatsData?.data || (Array.isArray(chatsData) ? chatsData : []);

  const filteredChats = searchQuery
    ? chats.filter((c) =>
        chatDisplayName(c).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  // ── Fetch messages for selected chat ──
  const {
    data: messagesData,
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: ["unibox-messages", selectedChatId],
    queryFn: () => callMessaging({ action: "get_messages", chat_id: selectedChatId, limit: 50 }),
    enabled: !!selectedChatId,
    refetchInterval: 15000,
  });

  const messages: Message[] = (
    messagesData?.items || messagesData?.data || (Array.isArray(messagesData) ? messagesData : [])
  ).slice().reverse();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedChatId]);

  // ── Send message ──
  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      callMessaging({ action: "send_message", chat_id: selectedChatId, text }),
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["unibox-messages", selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ["unibox-chats"] });
    },
  });

  const handleSend = () => {
    const text = messageInput.trim();
    if (!text || !selectedChatId || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  // ── No LinkedIn connected ──
  if (chatsError && ((chatsError as Error).message?.includes("NO_LINKEDIN") || (chatsError as Error).message?.includes("not connected"))) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <LinkIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">LinkedIn Not Connected</h2>
        <p className="text-muted-foreground max-w-sm">
          Connect your LinkedIn account to access your messages directly from Intentsly.
        </p>
        <Button onClick={() => navigate("/settings")} className="mt-2">
          Go to Settings
        </Button>
      </div>
    );
  }

  const showChatList = !isMobile || !selectedChatId;
  const showMessages = !isMobile || !!selectedChatId;

  return (
    <div className="relative h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] overflow-hidden">
      {/* ── Background decorative blurs ── */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[hsl(200,100%,30%)]/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[5%] w-[35%] h-[35%] rounded-full bg-[hsl(254,70%,55%)]/10 blur-[120px]" />
        <div className="absolute -bottom-[5%] left-[20%] w-[30%] h-[30%] rounded-full bg-[hsl(49,100%,40%)]/10 blur-[120px]" />
      </div>

      <div className="flex h-full p-2 md:p-3 gap-3">
        {/* ── Sidebar: Message List ── */}
        {showChatList && (
          <section
            className={cn(
              "flex flex-col h-full rounded-2xl overflow-hidden",
              isMobile ? "w-full" : "w-full md:w-[340px]"
            )}
            style={{
              background: "rgba(255,255,255,0.4)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px 0 rgba(0,0,0,0.04)",
            }}
          >
            {/* List Header */}
            <div className="px-4 pt-4 pb-1">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-light tracking-tight text-foreground">Unibox</h1>
              </div>
            </div>

            {/* Conversations Scroll Area */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
              {chatsLoading ? (
                <div className="p-3 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-foreground/40">
                  <Inbox className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm font-light">No conversations found</p>
                </div>
              ) : (
                filteredChats.map((chat, i) => {
                  const isSelected = selectedChatId === chat.id;
                  const isFirst = i === 0;
                  const avatarUrl = chatAvatar(chat);
                  const initials = chatInitials(chat);

                  return (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group text-left",
                        isSelected
                          ? "bg-white shadow-sm border border-white/50"
                          : "hover:bg-white/30"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        {avatarUrl ? (
                          <img
                            className={cn(
                              "w-10 h-10 rounded-xl object-cover transition-opacity",
                              !isSelected && !isFirst && "opacity-80 group-hover:opacity-100"
                            )}
                            src={avatarUrl}
                            alt=""
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center text-xs font-medium text-foreground/60">
                            {initials}
                          </div>
                        )}
                        {isFirst && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className={cn(
                            "text-[13px] truncate text-foreground",
                            isSelected || isFirst ? "font-medium" : "font-light"
                          )}>
                            {chatDisplayName(chat)}
                          </h3>
                          <span className={cn(
                            "text-[11px] uppercase tracking-wider ml-2 shrink-0",
                            isFirst ? "font-medium text-[hsl(200,100%,28%)]" : "font-light text-foreground/40"
                          )}>
                            {chatTimestamp(chat)}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/50 font-light truncate">
                          {chatLastText(chat)}
                        </p>
                        {(chat.unread_count || 0) > 0 && (
                          <div className="mt-1 flex gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[9px] font-semibold uppercase tracking-tighter">
                              🔥 HOT
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* ── Main Section: Active Conversation ── */}
        {showMessages && (
          <section
            className={cn(
              "hidden md:flex flex-col flex-1 h-full rounded-2xl overflow-hidden relative",
              isMobile && selectedChatId && "!flex"
            )}
            style={{
              background: "rgba(255,255,255,0.4)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px 0 rgba(0,0,0,0.04)",
            }}
          >
            {selectedChatId && selectedChat ? (
              <>
                {/* Conversation Header */}
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                  <div className="flex items-center gap-3">
                    {isMobile && (
                      <button onClick={() => setSelectedChatId(null)} className="text-foreground mr-1">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                    {chatAvatar(selectedChat) ? (
                      <img className="w-9 h-9 rounded-xl object-cover" src={chatAvatar(selectedChat)} alt="" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-foreground/10 flex items-center justify-center text-xs font-medium text-foreground/60">
                        {chatInitials(selectedChat)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-sm font-medium text-foreground leading-tight">{chatDisplayName(selectedChat)}</h2>
                      <p className="text-xs font-light text-foreground/50">LinkedIn Connection</p>
                    </div>
                  </div>
                </div>

                {/* Messages Thread Area */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {messagesLoading ? (
                    <div className="space-y-6 py-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                          <Skeleton className="h-14 w-56 rounded-2xl" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-foreground/40 py-16">
                      <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
                      <p className="text-sm font-light">No messages yet</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isSent = msg.is_sender === true || msg.is_sender === 1 || msg.is_sender === "true" || msg.from_me === true || msg.from_me === 1 || msg.direction === "outbound";
                        return isSent ? (
                          /* Sent Message */
                          <div key={msg.id} className="flex flex-row-reverse items-end gap-2 ml-auto max-w-[75%]">
                            <div className="w-6 h-6 flex-shrink-0" />
                            <div className="flex flex-col items-end">
                              <div
                                className="px-3.5 py-2.5 rounded-2xl rounded-br-none shadow-md text-white font-light text-sm leading-relaxed"
                                style={{ background: "linear-gradient(135deg, #005d8f 0%, #5b3cdd 50%, #c9a800 100%)" }}
                              >
                                <p className="whitespace-pre-wrap break-words">{messageText(msg)}</p>
                              </div>
                              <span className="text-[10px] text-foreground/40 font-medium mr-1 mt-1 uppercase tracking-tighter">
                                {messageTime(msg)} · SEEN
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Received Message */
                          <div key={msg.id} className="flex items-end gap-2 max-w-[75%]">
                            {chatAvatar(selectedChat) ? (
                              <img className="w-6 h-6 rounded-md object-cover flex-shrink-0" src={chatAvatar(selectedChat)} alt="" />
                            ) : (
                              <div className="w-6 h-6 rounded-md bg-foreground/10 flex items-center justify-center text-[9px] font-medium text-foreground/50 flex-shrink-0">
                                {chatInitials(selectedChat)}
                              </div>
                            )}
                            <div>
                              <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-bl-none shadow-sm border border-white/50 text-foreground font-light text-sm leading-relaxed">
                                <p className="whitespace-pre-wrap break-words">{messageText(msg)}</p>
                              </div>
                              <span className="text-[10px] text-foreground/40 font-medium ml-1 mt-1 block uppercase tracking-tighter">
                                {messageTime(msg)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}

                  {/* AI Insight Bubble */}
                  {messages.length > 0 && (
                    <div className="relative py-2">
                      <div
                        className="p-3.5 rounded-2xl max-w-xs mx-auto flex items-start gap-3"
                        style={{
                          background: "rgba(255,255,255,0.4)",
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          border: "1px solid rgba(255,255,255,0.6)",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.2)",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
                          style={{ background: "linear-gradient(135deg, #005d8f 0%, #5b3cdd 50%, #c9a800 100%)" }}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-[hsl(254,70%,55%)] uppercase tracking-widest mb-0.5">AI Smart Insight</p>
                          <p className="text-xs text-foreground font-light leading-snug">
                            This contact typically responds faster on weekday mornings. Consider a follow-up around 10 AM.
                          </p>
                          <button className="mt-2 text-[10px] font-bold text-[hsl(200,100%,28%)] hover:underline">
                            Apply Smart Suggestion →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input Area */}
                <div className="px-4 py-3">
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2 p-2 rounded-[32px] border border-white/80"
                    style={{
                      background: "rgba(255,255,255,0.6)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full text-foreground/50 hover:bg-white transition-all">
                      <PlusCircle className="w-5 h-5" />
                    </button>
                    <input
                      className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-foreground/30 font-light text-sm px-2"
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      disabled={sendMutation.isPending}
                    />
                    <div className="flex items-center gap-1">
                      <button type="button" className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/50 hover:bg-white transition-all">
                        <Smile className="w-5 h-5" />
                      </button>
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || sendMutation.isPending}
                        className="w-10 h-10 flex items-center justify-center rounded-full shadow-lg text-white active:scale-90 transition-transform disabled:opacity-40"
                        style={{
                          background: "linear-gradient(135deg, #005d8f 0%, #5b3cdd 50%, #c9a800 100%)",
                          boxShadow: "0 4px 14px rgba(0,93,143,0.3)",
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                  {sendMutation.isError && (
                    <p className="text-xs text-destructive mt-2 text-center">Failed to send. Try again.</p>
                  )}
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-foreground/40">
                <div className="w-16 h-16 rounded-2xl bg-white/40 flex items-center justify-center mb-4 shadow-sm">
                  <MessageSquare className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="text-base font-medium text-foreground mb-1">Your LinkedIn Inbox</h3>
                <p className="text-sm font-light">Select a conversation to start messaging</p>
              </div>
            )}
          </section>
        )}

        {/* ── Contextual Details Panel (xl only) ── */}
        {selectedChat && (
          <aside className="hidden xl:flex flex-col w-[320px] h-full gap-4">
            {/* Profile Card */}
            <div
              className="rounded-3xl p-6 text-center"
              style={{
                background: "rgba(255,255,255,0.4)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              {chatAvatar(selectedChat) ? (
                <img
                  className="w-24 h-24 rounded-3xl mx-auto object-cover mb-4 shadow-xl border-4 border-white"
                  src={chatAvatar(selectedChat)}
                  alt=""
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl mx-auto mb-4 shadow-xl border-4 border-white bg-foreground/10 flex items-center justify-center text-2xl font-medium text-foreground/50">
                  {chatInitials(selectedChat)}
                </div>
              )}
              <h3 className="text-xl font-medium text-foreground">{chatDisplayName(selectedChat)}</h3>
              <p className="text-sm font-light text-foreground/50">LinkedIn Connection</p>
            </div>

            {/* Engagement History Card */}
            <div
              className="rounded-3xl p-6 flex-1"
              style={{
                background: "rgba(255,255,255,0.4)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-[2px] mb-6">Engagement History</h4>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-[hsl(200,100%,28%)]/10 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-4 h-4 text-[hsl(200,100%,28%)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Viewed your profile</p>
                    <p className="text-xs text-foreground/40 font-light">3 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-[hsl(254,70%,55%)]/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-[hsl(254,70%,55%)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Liked your post</p>
                    <p className="text-xs text-foreground/40 font-light">Yesterday, 4:12 PM</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-[hsl(49,100%,40%)]/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-[hsl(49,100%,40%)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">High Intent Signal</p>
                    <p className="text-xs text-foreground/40 font-light">Clicked external link</p>
                  </div>
                </div>
              </div>



            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
