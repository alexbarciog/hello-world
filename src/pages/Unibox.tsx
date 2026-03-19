import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Send,
  Inbox,
  LinkIcon,
  Search,
  MessageSquare,
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
  profile_picture_url?: string;
  avatar_url?: string;
  provider_id?: string;
}

interface Chat {
  id: string;
  attendees?: ChatAttendee[];
  last_message?: {
    text?: string;
    timestamp?: string;
    date?: string;
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
  is_sender?: boolean;
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
  return data;
}

/* ── Helpers ──────────────────────────────────────────────── */

function chatDisplayName(chat: Chat): string {
  const a = chat.attendees;
  if (!a?.length) return "Unknown";
  const first = a[0];
  return first.display_name || first.name || "LinkedIn User";
}

function chatAvatar(chat: Chat): string | undefined {
  const a = chat.attendees;
  if (!a?.length) return undefined;
  return a[0].profile_picture_url || a[0].avatar_url;
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
  return chat.last_message?.text || "";
}

function chatTimestamp(chat: Chat): string {
  const raw = chat.last_message?.timestamp || chat.last_message?.date || chat.timestamp || chat.updated_at;
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

  // Scroll to bottom on new messages
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
  if (chatsError && (chatsError as Error).message?.includes("NO_LINKEDIN")) {
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
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] overflow-hidden rounded-xl border border-border bg-card">
      {/* ── Chat list ── */}
      {showChatList && (
        <div className={cn("flex flex-col border-r border-border bg-card", isMobile ? "w-full" : "w-[340px] min-w-[280px]")}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border">
            <h1 className="text-lg font-semibold text-foreground mb-2">Unibox</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/50 border-0"
              />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            {chatsLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-40" />
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
              <div>
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                      selectedChatId === chat.id && "bg-muted"
                    )}
                  >
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={chatAvatar(chat)} />
                      <AvatarFallback className="text-xs bg-accent/20 text-accent-foreground">
                        {chatInitials(chat)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">
                          {chatDisplayName(chat)}
                        </span>
                        <span className="text-[11px] text-muted-foreground ml-2 shrink-0">
                          {chatTimestamp(chat)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {chatLastText(chat)}
                      </p>
                    </div>
                    {(chat.unread_count || 0) > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[hsl(220,80%,55%)] text-white text-[10px] flex items-center justify-center font-medium shrink-0">
                        {chat.unread_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* ── Message thread ── */}
      {showMessages && (
        <div className="flex-1 flex flex-col min-w-0">
          {selectedChatId && selectedChat ? (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
                {isMobile && (
                  <button onClick={() => setSelectedChatId(null)} className="text-foreground">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <Avatar className="w-8 h-8">
                  <AvatarImage src={chatAvatar(selectedChat)} />
                  <AvatarFallback className="text-xs">{chatInitials(selectedChat)}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm text-foreground truncate">
                  {chatDisplayName(selectedChat)}
                </span>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3">
                {messagesLoading ? (
                  <div className="space-y-4 py-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                        <Skeleton className="h-10 w-48 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
                    <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    {messages.map((msg) => {
                      const isSent = msg.is_sender === true;
                      return (
                        <div
                          key={msg.id}
                          className={cn("flex", isSent ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
                              isSent
                                ? "bg-[hsl(220,80%,55%)] text-white rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{messageText(msg)}</p>
                            <p
                              className={cn(
                                "text-[10px] mt-1",
                                isSent ? "text-white/70" : "text-muted-foreground"
                              )}
                            >
                              {messageTime(msg)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Compose */}
              <div className="px-4 py-3 border-t border-border bg-card">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 bg-muted/50 border-0"
                    disabled={sendMutation.isPending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!messageInput.trim() || sendMutation.isPending}
                    className="shrink-0 bg-[hsl(220,80%,55%)] hover:bg-[hsl(220,80%,48%)] text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                {sendMutation.isError && (
                  <p className="text-xs text-destructive mt-1">
                    Failed to send. Try again.
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Empty state - no chat selected */
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-1">Your LinkedIn Inbox</h3>
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
