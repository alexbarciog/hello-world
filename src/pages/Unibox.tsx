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
  Search,
  Settings2,
  Edit3,
  Phone,
  Video,
  MoreHorizontal,
  Smile,
  Reply,
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
    is_sender?: boolean | number | string;
  };
  timestamp?: string;
  updated_at?: string;
  unread_count?: number;
  _resolved_name?: string;
  _resolved_avatar?: string | null;
  _resolved_msg_text?: string;
  _resolved_msg_timestamp?: string;
  _resolved_msg_is_sender?: boolean;
  _is_unread?: boolean;
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
  if (chat._resolved_name && chat._resolved_name !== "LinkedIn User") return chat._resolved_name;
  const a = chat.attendees;
  if (!a?.length) return chat._resolved_name || "LinkedIn User";
  for (const att of a) {
    const n = attendeeName(att);
    if (n && n !== "Unknown") return n;
  }
  return chat._resolved_name || attendeeName(a[0]) || "LinkedIn User";
}

function chatAvatar(chat: Chat): string | undefined {
  if (chat._resolved_avatar) return chat._resolved_avatar;
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
  if (chat._resolved_msg_text) return chat._resolved_msg_text;
  if (!chat.last_message) return "No messages yet";
  return chat.last_message.text || chat.last_message.body || chat.last_message.content || "";
}

function chatTimestamp(chat: Chat): string {
  const raw = chat._resolved_msg_timestamp || chat.last_message?.timestamp || chat.last_message?.date || chat.last_message?.created_at || chat.timestamp || chat.updated_at;
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
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

function messageDateLabel(m: Message): string | null {
  const raw = m.timestamp || m.date || m.created_at;
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
}

/* ── Component ────────────────────────────────────────────── */

export default function Unibox() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Fetch chats ──
  const {
    data: chatsData,
    isLoading: chatsLoading,
    error: chatsError,
  } = useQuery({
    queryKey: ["unibox-chats"],
    queryFn: () => callMessaging({ action: "list_chats", limit: 50, enrich: true }),
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
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] flex">
      <div className="flex w-full h-full border border-border rounded-xl overflow-hidden bg-background">

        {/* ── Sidebar: Chat List ── */}
        {showChatList && (
          <div className={cn(
            "flex flex-col h-full border-r border-border bg-background",
            isMobile ? "w-full" : "w-full md:w-[360px] flex-shrink-0"
          )}>
            {/* List Header */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-semibold text-foreground">Messages</h1>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors">
                    <Settings2 className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  className="pl-9 h-9 bg-accent/50 border-0 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {chatsLoading ? (
                <div className="space-y-0">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Inbox className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm">No conversations found</p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isSelected = selectedChatId === chat.id;
                  const avatarUrl = chatAvatar(chat);
                  const initials = chatInitials(chat);
                  const unread = chat._is_unread || (chat.unread_count || 0) > 0;

                  return (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-border/50",
                        isSelected
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {avatarUrl ? (
                          <img className="w-10 h-10 rounded-full object-cover" src={avatarUrl} alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className={cn(
                            "text-sm truncate text-foreground",
                            unread ? "font-semibold" : "font-medium"
                          )}>
                            {chatDisplayName(chat)}
                          </h3>
                          <span className="text-xs text-muted-foreground ml-2 shrink-0">
                            {chatTimestamp(chat)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            "text-xs truncate",
                            unread ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {chatLastText(chat)}
                          </p>
                          {unread && (
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[hsl(210,100%,40%)] text-white text-[10px] font-bold flex items-center justify-center">
                              {chat.unread_count || "·"}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── Main: Conversation ── */}
        {showMessages && (
          <div className={cn(
            "hidden md:flex flex-col flex-1 h-full bg-background",
            isMobile && selectedChatId && "!flex"
          )}>
            {selectedChatId && selectedChat ? (
              <>
                {/* Conversation Header */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-border">
                  <div className="flex items-center gap-3">
                    {isMobile && (
                      <button onClick={() => setSelectedChatId(null)} className="text-muted-foreground mr-1">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                    {chatAvatar(selectedChat) ? (
                      <img className="w-9 h-9 rounded-full object-cover" src={chatAvatar(selectedChat)} alt="" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                        {chatInitials(selectedChat)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-sm font-semibold text-foreground leading-tight">{chatDisplayName(selectedChat)}</h2>
                      <p className="text-xs text-muted-foreground">LinkedIn Connection</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-accent/20">
                  {messagesLoading ? (
                    <div className="space-y-6 py-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                          <Skeleton className="h-14 w-56 rounded-2xl" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
                      <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
                      <p className="text-sm">No messages yet</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => {
                        const isSent =
                          msg.is_sender === true ||
                          msg.is_sender === 1 ||
                          msg.is_sender === "true" ||
                          msg.from_me === true ||
                          msg.from_me === 1 ||
                          msg.direction === "outbound";

                        // Show date separator if first message or date changed
                        let showDateSep = false;
                        if (idx === 0) {
                          showDateSep = true;
                        } else {
                          const prevRaw = messages[idx - 1].timestamp || messages[idx - 1].date || messages[idx - 1].created_at;
                          const curRaw = msg.timestamp || msg.date || msg.created_at;
                          if (prevRaw && curRaw) {
                            const prevD = new Date(prevRaw).toDateString();
                            const curD = new Date(curRaw).toDateString();
                            if (prevD !== curD) showDateSep = true;
                          }
                        }

                        const dateLabel = messageDateLabel(msg);

                        return (
                          <div key={msg.id}>
                            {showDateSep && dateLabel && (
                              <div className="flex justify-center my-4">
                                <span className="text-[11px] text-muted-foreground bg-background px-3 py-1 rounded-full border border-border">
                                  {dateLabel}
                                </span>
                              </div>
                            )}

                            {isSent ? (
                              /* Sent */
                              <div className="flex justify-end">
                                <div className="max-w-[70%]">
                                  <div className="bg-[hsl(210,100%,40%)] text-white px-4 py-2.5 rounded-2xl rounded-br-sm">
                                    <p className="text-sm whitespace-pre-wrap break-words">{messageText(msg)}</p>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground text-right mt-1 mr-1">{messageTime(msg)}</p>
                                </div>
                              </div>
                            ) : (
                              /* Received */
                              <div className="flex justify-start">
                                <div className="max-w-[70%]">
                                  <div className="bg-background border border-border px-4 py-2.5 rounded-2xl rounded-bl-sm">
                                    <p className="text-sm whitespace-pre-wrap break-words text-foreground">{messageText(msg)}</p>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-1 ml-1">{messageTime(msg)}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="px-4 py-3 border-t border-border bg-background">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type your message..."
                        className="pr-10 h-10 bg-accent/50 border-border"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        disabled={sendMutation.isPending}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!messageInput.trim() || sendMutation.isPending}
                      className="h-10 w-10 rounded-lg bg-[hsl(210,100%,40%)] hover:bg-[hsl(210,100%,35%)] text-white"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  {sendMutation.isError && (
                    <p className="text-xs text-destructive mt-2 text-center">Failed to send. Try again.</p>
                  )}
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Your LinkedIn Inbox</h3>
                <p className="text-sm">Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
