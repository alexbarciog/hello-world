import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RotateCcw, MessageSquare, Users } from "lucide-react";
import { ChatInput } from "@/components/ai-chat/ChatInput";
import { ChatMessage } from "@/components/ai-chat/ChatMessage";
import { TypingIndicator } from "@/components/ai-chat/TypingIndicator";
import { SearchProgress } from "@/components/ai-chat/SearchProgress";
import { LeadCard } from "@/components/ai-chat/LeadCard";
import { SaveLeadDialog } from "@/components/ai-chat/SaveLeadDialog";
import type { ChatMessageData, LeadResult, SearchCriteria } from "@/components/ai-chat/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PROMPT_CHIPS = [
  "Founders of seed-stage SaaS in the US",
  "Marketing leaders at fintechs in Europe",
  "Heads of Sales at 50-200 person B2B companies",
  "CTOs of agencies that recently posted about hiring",
  "Operations leads at e-commerce brands",
  "Founders who recently raised Series A",
];

type LeadStatus = Record<string, "review" | "saved" | "skipped">;

export default function AiChat() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [searching, setSearching] = useState(false);
  const [criteria, setCriteria] = useState<SearchCriteria>({});
  const [leadStatus, setLeadStatus] = useState<LeadStatus>({});
  const [activeTab, setActiveTab] = useState<"review" | "saved" | "skipped">("review");
  const [mobileTab, setMobileTab] = useState<"chat" | "leads">("chat");
  const [firstName, setFirstName] = useState("");
  const [saveDialog, setSaveDialog] = useState<{ open: boolean; lead: LeadResult | null }>({ open: false, lead: null });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages / typing / searching
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending, searching]);

  // Load user + history
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setFirstName(user.user_metadata?.first_name || user.email?.split("@")[0] || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("ai_chat_criteria, ai_chat_lead_status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile && (profile as any).ai_chat_criteria) {
        setCriteria((profile as any).ai_chat_criteria as SearchCriteria);
      }
      if (profile && (profile as any).ai_chat_lead_status) {
        setLeadStatus((profile as any).ai_chat_lead_status as LeadStatus);
      }

      const { data: msgs } = await supabase
        .from("ai_chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (msgs) setMessages(msgs as unknown as ChatMessageData[]);
    })();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending, searching]);

  // Persist lead status (saved/skipped) to profile so it survives reloads
  const leadStatusInitialized = useRef(false);
  useEffect(() => {
    if (!leadStatusInitialized.current) {
      leadStatusInitialized.current = true;
      return;
    }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ ai_chat_lead_status: leadStatus as any } as any)
        .eq("user_id", user.id);
    })();
  }, [leadStatus]);

  const allLeads = useMemo(() => {
    const out: { lead: LeadResult; status: "review" | "saved" | "skipped" }[] = [];
    const seen = new Set<string>();
    for (const m of messages) {
      const att = m.attachment;
      if (att && att.type === "leads") {
        for (const lead of att.data) {
          if (seen.has(lead.linkedin_url)) continue;
          seen.add(lead.linkedin_url);
          out.push({ lead, status: leadStatus[lead.linkedin_url] ?? "review" });
        }
      }
    }
    return out;
  }, [messages, leadStatus]);

  const filteredLeads = allLeads.filter((l) => l.status === activeTab);
  const counts = {
    review: allLeads.filter((l) => l.status === "review").length,
    saved: allLeads.filter((l) => l.status === "saved").length,
    skipped: allLeads.filter((l) => l.status === "skipped").length,
  };

  const isEmpty = messages.length === 0;

  async function persistMessage(msg: Omit<ChatMessageData, "id" | "created_at">): Promise<ChatMessageData | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("ai_chat_messages")
      .insert({
        user_id: user.id,
        role: msg.role,
        content: msg.content,
        quick_replies: msg.quick_replies ?? null,
        attachment: (msg.attachment ?? null) as any,
        criteria_snapshot: (msg.criteria_snapshot ?? null) as any,
      })
      .select()
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    return data as unknown as ChatMessageData;
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setInput("");
    setSending(true);

    const userMsg = await persistMessage({ role: "user", content: trimmed });
    if (userMsg) setMessages((m) => [...m, userMsg]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const history = [...messages, ...(userMsg ? [userMsg] : [])];
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-converse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          criteria,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Chat failed");
      }
      const data = await res.json();
      const newCriteria: SearchCriteria = data.criteria ?? criteria;
      setCriteria(newCriteria);

      const assistantMsg = await persistMessage({
        role: "assistant",
        content: data.reply,
        quick_replies: data.quick_replies ?? null,
        criteria_snapshot: newCriteria,
      });
      if (assistantMsg) setMessages((m) => [...m, assistantMsg]);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ ai_chat_criteria: newCriteria as any } as any).eq("user_id", user.id);
      }

      // Auto-search when:
      //  1. The assistant explicitly returned ready_to_search, OR
      //  2. The assistant's reply announces it's about to search AND we have
      //     enough criteria (selling + at least one of role/industries/locations).
      // We never trigger from the USER's text — only from the assistant's
      // own stated intent — so clarifying questions are always honored.
      const reply = String(data.reply ?? "").replace(/[’]/g, "'").toLowerCase();
      const announcesSearch = /\b(let me (search|kick off (the )?search|start (the )?search|run (the )?search)|searching now|i'?ll (now |go )?(run|start|kick off) (the |a )?search|running (the |a )?search|let'?s search|searching again|i'?ll search|kicking off the search|starting the search)\b/.test(reply);
      const hasSelling = typeof (newCriteria as any).selling === "string" && (newCriteria as any).selling.trim().length > 0;
      const hasWho =
        Boolean((newCriteria as any).role) ||
        ((newCriteria as any).industries?.length ?? 0) > 0 ||
        ((newCriteria as any).locations?.length ?? 0) > 0;
      const endsWithQuestion = /\?\s*$/.test(data.reply ?? "");
      const nextMessages = [...history, ...(assistantMsg ? [assistantMsg] : [])];

      if (data.ready_to_search || (announcesSearch && hasSelling && hasWho && !endsWithQuestion)) {
        runSearch(newCriteria, nextMessages);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  async function runSearch(criteriaOverride?: SearchCriteria, conversationOverride?: ChatMessageData[]) {
    if (searching) return;
    setSearching(true);
    if (window.innerWidth < 768) setMobileTab("leads");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const excludeUrls = allLeads.map((l) => l.lead.linkedin_url);
      const effectiveCriteria = criteriaOverride ?? criteria;
      const effectiveMessages = conversationOverride ?? messages;
      // Send recent chat turns so the search function can derive `selling` if criteria is missing it.
      const conversation = effectiveMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-search-leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ criteria: effectiveCriteria, excludeLinkedInUrls: excludeUrls, conversation }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Search failed");
      }
      const data = await res.json();
      const leads: LeadResult[] = data.leads ?? [];

      const summary = leads.length === 0
        ? "I couldn't find new leads matching this criteria. Try broadening locations, roles, or removing exclusions."
        : `Found **${leads.length}** new ${leads.length === 1 ? "lead" : "leads"} matching your criteria. Review them on the right and add the good ones to your outreach.`;

      const msg = await persistMessage({
        role: "assistant",
        content: summary,
        attachment: leads.length > 0 ? { type: "leads", data: leads } : null,
        quick_replies: leads.length > 0 ? ["Refine criteria", "Find more like these", "Search again"] : ["Refine criteria"],
      });
      if (msg) setMessages((m) => [...m, msg]);
    } catch (e: any) {
      toast.error(e.message ?? "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handleQuickReply(text: string) {
    const lower = text.toLowerCase();
    if (lower.startsWith("start search") || lower === "search again" || lower === "find more like these") {
      await runSearch();
    } else {
      setInput(text);
    }
  }

  async function newChat() {
    if (!confirm("Start a new search? Your conversation will be cleared.")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("ai_chat_messages").delete().eq("user_id", user.id);
    await supabase.from("profiles").update({ ai_chat_criteria: null as any, ai_chat_lead_status: {} as any } as any).eq("user_id", user.id);
    setMessages([]);
    setCriteria({});
    setLeadStatus({});
  }

  // ─── Empty state ────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Hey {firstName || "there"}!
            </h1>
            <p className="text-foreground/60 text-lg">Let's find your next customers.</p>
          </div>

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => sendMessage(input)}
            disabled={sending}
            size="lg"
            placeholder="Describe who you want to reach… (e.g. founders of seed-stage SaaS in the US)"
          />

          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setInput(chip)}
                className="text-xs px-3 py-2 rounded-full bg-white border border-border hover:border-[hsl(var(--md-secondary))] hover:text-[hsl(var(--md-secondary))] transition-colors text-foreground/70"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Active state ────────────────────────────────────────────
  const showCTAStartSearch = Object.keys(criteria).some((k) => {
    const v = (criteria as any)[k];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  });

  const ChatPane = (
    <div className="flex flex-col h-full bg-white md:bg-transparent w-full">
      <div className="flex-1 overflow-y-auto px-4 pt-0 pb-4 space-y-4 bg-white" ref={scrollRef}>
        {messages.map((m, i) => (
          <ChatMessage
            key={m.id}
            message={m}
            onQuickReply={handleQuickReply}
            isLatest={i === messages.length - 1}
          />
        ))}
        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-border" />
            <TypingIndicator />
          </div>
        )}
        {searching && <SearchProgress />}
      
      </div>
      <div className="p-3 border-t border-border bg-white">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => sendMessage(input)}
          disabled={sending || searching}
          placeholder="Refine your search…"
        />
      </div>
    </div>
  );

  const LeadsPane = (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-1 px-4 py-3 border-b border-border bg-white">
        {(["review", "saved", "skipped"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
              activeTab === tab ? "bg-foreground text-primary-foreground" : "text-foreground/60 hover:bg-foreground/5"
            )}
          >
            {tab === "review" ? "To Review" : tab === "saved" ? "Saved" : "Skipped"}
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              activeTab === tab ? "bg-white/20" : "bg-foreground/10"
            )}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[hsl(195_14%_97%)]">
        {filteredLeads.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-foreground/40 py-16">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">{activeTab === "review" ? "No leads to review yet." : `No ${activeTab} leads.`}</p>
            {activeTab === "review" && allLeads.length === 0 && (
              <p className="text-xs mt-1">Describe your ideal customer in the chat to start.</p>
            )}
          </div>
        ) : (
          filteredLeads.map(({ lead, status }) => (
            <LeadCard
              key={lead.linkedin_url}
              lead={lead}
              status={status}
              onSave={() => setSaveDialog({ open: true, lead })}
              onSkip={() => setLeadStatus((s) => ({ ...s, [lead.linkedin_url]: "skipped" }))}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white shrink-0">
        <h1 className="text-base font-semibold text-foreground">AI Chat — Lead Finder</h1>
        <Button variant="ghost" size="sm" onClick={newChat} className="text-foreground/60 gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          New search
        </Button>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden flex border-b border-border bg-white shrink-0">
        <button
          onClick={() => setMobileTab("chat")}
          className={cn("flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5", mobileTab === "chat" ? "text-foreground border-b-2 border-foreground" : "text-foreground/50")}
        >
          <MessageSquare className="w-4 h-4" /> Chat
        </button>
        <button
          onClick={() => setMobileTab("leads")}
          className={cn("flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5", mobileTab === "leads" ? "text-foreground border-b-2 border-foreground" : "text-foreground/50")}
        >
          <Users className="w-4 h-4" /> Leads ({counts.review})
        </button>
      </div>

      {/* Split view */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className={cn("md:w-[35%] md:border-r md:border-border flex-1", mobileTab === "chat" ? "flex" : "hidden md:flex")}>
          {ChatPane}
        </div>
        <div className={cn("md:w-[65%] flex-1", mobileTab === "leads" ? "flex" : "hidden md:flex")}>
          {LeadsPane}
        </div>
      </div>

      <SaveLeadDialog
        open={saveDialog.open}
        onOpenChange={(open) => setSaveDialog((s) => ({ ...s, open }))}
        lead={saveDialog.lead}
        onSaved={(lead) => setLeadStatus((s) => ({ ...s, [lead.linkedin_url]: "saved" }))}
      />
    </div>
  );
}
