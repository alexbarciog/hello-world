import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RotateCcw, MessageSquare, Users, Lock, ArrowUpRight } from "lucide-react";
import { ChatInput } from "@/components/ai-chat/ChatInput";
import { ChatMessage } from "@/components/ai-chat/ChatMessage";
import { TypingIndicator } from "@/components/ai-chat/TypingIndicator";
import { SearchProgress } from "@/components/ai-chat/SearchProgress";
import { LeadCard } from "@/components/ai-chat/LeadCard";
import { SaveLeadDialog } from "@/components/ai-chat/SaveLeadDialog";
import type { ChatMessageData, LeadResult, SearchCriteria } from "@/components/ai-chat/types";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import intentslyIcon from "@/assets/intentsly-icon.png";

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
  // Track every keyword phrase the search backend has used in this session,
  // so each new search asks for fresh angles instead of repeating queries.
  const usedKeywordsRef = useRef<string[]>([]);

  // Gate leads behind paid plan / active free trial
  const { hasAccess, loading: subLoading } = useSubscription();
  const leadsLocked = !subLoading && !hasAccess;

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

      // Single source of truth: the backend (model + classifier) decides.
      // Frontend trusts `ready_to_search` from the response — no text parsing.
      const nextMessages = [...history, ...(assistantMsg ? [assistantMsg] : [])];
      if (data.ready_to_search) {
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
        body: JSON.stringify({
          criteria: effectiveCriteria,
          excludeLinkedInUrls: excludeUrls,
          conversation,
          previousKeywords: usedKeywordsRef.current,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Search failed");
      }
      const data = await res.json();
      const leads: LeadResult[] = data.leads ?? [];
      // Remember which keywords this run used so the next search asks for fresh ones
      if (Array.isArray(data.queries)) {
        const merged = [...usedKeywordsRef.current, ...data.queries.map((q: any) => String(q))];
        // Cap memory at 50 to avoid bloating the prompt forever
        usedKeywordsRef.current = Array.from(new Set(merged.map((s) => s.toLowerCase().trim()))).slice(-50);
      }

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
    usedKeywordsRef.current = [];
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
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden">
              <img src={intentslyIcon} alt="AI" className="w-6 h-6 object-contain" />
            </div>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[hsl(195_14%_97%)] relative">
        {filteredLeads.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-foreground/40 py-16">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">{activeTab === "review" ? "No leads to review yet." : `No ${activeTab} leads.`}</p>
            {activeTab === "review" && allLeads.length === 0 && (
              <p className="text-xs mt-1">Describe your ideal customer in the chat to start.</p>
            )}
          </div>
        ) : (
          <>
            <div
              className={cn(
                "space-y-3 transition-all",
                leadsLocked && "filter blur-[8px] pointer-events-none select-none"
              )}
              aria-hidden={leadsLocked}
            >
              {filteredLeads.map(({ lead, status }) => (
                <LeadCard
                  key={lead.linkedin_url}
                  lead={lead}
                  status={status}
                  onSave={() => setSaveDialog({ open: true, lead })}
                  onSkip={() => setLeadStatus((s) => ({ ...s, [lead.linkedin_url]: "skipped" }))}
                />
              ))}
            </div>

            {leadsLocked && (
              <div className="absolute inset-0 flex items-start justify-center pt-16 px-4 z-10">
                <div className="bg-white/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl px-6 py-6 max-w-sm text-center">
                  <div className="w-12 h-12 rounded-full bg-foreground text-primary-foreground flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1.5">
                    {filteredLeads.length} high-intent {filteredLeads.length === 1 ? "lead" : "leads"} ready
                  </h3>
                  <p className="text-xs text-foreground/60 mb-4 leading-relaxed">
                    Upgrade your plan to unlock these leads and start reaching out today.
                  </p>
                  <Link
                    to="/billing"
                    className="inline-flex items-center gap-1.5 bg-foreground text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
                  >
                    Upgrade to unlock
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full min-h-0 px-6 pt-6 pb-8">
      <div className="ai-border flex-1 flex flex-col rounded-3xl min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-3xl border border-gray-200/60 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 rounded-t-3xl">
            <h1 className="text-2xl font-semibold intentsly-ai-gradient">Intentsly AI</h1>
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
          <div className="flex-1 flex overflow-hidden min-h-0 rounded-b-3xl">
            <div className={cn("md:w-[30%] md:shrink-0 md:flex-none md:border-r md:border-border flex-1", mobileTab === "chat" ? "flex" : "hidden md:flex")}>
              {ChatPane}
            </div>
            <div className={cn("md:w-[70%] md:shrink-0 md:flex-none flex-1", mobileTab === "leads" ? "flex" : "hidden md:flex")}>
              {LeadsPane}
            </div>
          </div>
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
