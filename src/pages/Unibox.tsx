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
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
          <LinkIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">LinkedIn Not Connected</h2>
        <p className="text-gray-500 max-w-sm text-sm">
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
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] overflow-hidden bg-white">
      <div className="flex h-full">
        {/* ── Sidebar: Chat List ── */}
        {showChatList && (
          <section
            className={cn(
              "flex flex-col h-full border-r border-gray-200",
              isMobile ? "w-full" : "w-full md:w-[340px] shrink-0"
            )}
          >
            {/* List Header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative flex-1 max-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:bg-white transition-colors"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {chatsLoading ? (
                <div className="p-3 space-y-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Inbox className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm">No conversations found</p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isSelected = selectedChatId === chat.id;
                  const avatarUrl = chatAvatar(chat);
                  const initials = chatInitials(chat);
                  const unread = (chat.unread_count || 0) > 0;

                  return (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-gray-50",
                        isSelected
                          ? "bg-indigo-50/60"
                          : "hover:bg-gray-50"
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {avatarUrl ? (
                          <img
                            className="w-10 h-10 rounded-full object-cover"
                            src={avatarUrl}
                            alt=""
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className={cn(
                            "text-sm truncate text-gray-900",
                            unread ? "font-semibold" : "font-medium"
                          )}>
                            {chatDisplayName(chat)}
                          </h3>
                          <span className="text-xs text-gray-400 ml-2 shrink-0 tabular-nums">
                            {chatTimestamp(chat)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-xs truncate",
                            unread ? "text-gray-700" : "text-gray-500"
                          )}>
                            {chatLastText(chat)}
                          </p>
                          {unread && (
                            <span className="ml-2 w-5 h-5 flex items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-semibold shrink-0">
                              {chat.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* ── Main: Conversation ── */}
        {showMessages && (
          <section
            className={cn(
              "hidden md:flex flex-col flex-1 h-full bg-white",
              isMobile && selectedChatId && "!flex"
            )}
          >
            {selectedChatId && selectedChat ? (
              <>
                {/* Conversation Header */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    {isMobile && (
                      <button onClick={() => setSelectedChatId(null)} className="text-gray-600 mr-1">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                    {chatAvatar(selectedChat) ? (
                      <img className="w-9 h-9 rounded-full object-cover" src={chatAvatar(selectedChat)} alt="" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        {chatInitials(selectedChat)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900 leading-tight">{chatDisplayName(selectedChat)}</h2>
                      <p className="text-xs text-gray-400">LinkedIn Connection</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gray-50/50">
                  {messagesLoading ? (
                    <div className="space-y-6 py-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                          <Skeleton className="h-12 w-56 rounded-2xl" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
                      <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
                      <p className="text-sm">No messages yet</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => {
                        const isSent = msg.is_sender === true || msg.is_sender === 1 || msg.is_sender === "true" || msg.from_me === true || msg.from_me === 1 || msg.direction === "outbound";

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
                              <div className="flex items-center justify-center py-3">
                                <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">{dateLabel}</span>
                              </div>
                            )}

                            {isSent ? (
                              /* Sent */
                              <div className="flex justify-end">
                                <div className="max-w-[70%]">
                                  <div className="bg-gray-800 text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed">
                                    <p className="whitespace-pre-wrap break-words">{messageText(msg)}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Received */
                              <div className="flex justify-start">
                                <div className="max-w-[70%]">
                                  <div className="bg-white border border-gray-200 text-gray-900 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed shadow-sm">
                                    <p className="whitespace-pre-wrap break-words">{messageText(msg)}</p>
                                  </div>
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
                <div className="px-5 py-3 border-t border-gray-200">
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-1 relative">
                      <input
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
                        placeholder="Type message"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        disabled={sendMutation.isPending}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!messageInput.trim() || sendMutation.isPending}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-30 transition-colors shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  {sendMutation.isError && (
                    <p className="text-xs text-red-500 mt-2 text-center">Failed to send. Try again.</p>
                  )}
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Your LinkedIn Inbox</h3>
                <p className="text-sm text-gray-400">Select a conversation to start messaging</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
