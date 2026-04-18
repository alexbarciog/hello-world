import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Loader2, Lock, ArrowUpRight, Building2, MapPin, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import heroSkyBg from "@/assets/hero-sky-bg.webp";
import intentslyIcon from "@/assets/intentsly-icon.png";
import { cn } from "@/lib/utils";

const MAX_USER_MESSAGES = 5;

type Msg = { role: "user" | "assistant"; content: string };

type LockedLead = {
  full_name: string;
  title: string;
  company: string;
  location: string;
  excerpt: string;
};

const FAKE_LEADS: LockedLead[] = [
  {
    full_name: "Sarah Chen",
    title: "Head of Growth",
    company: "Lumenary AI",
    location: "San Francisco, CA",
    excerpt:
      "We're scaling outbound from 50 to 300 demos/mo this quarter. Looking at intent-signal platforms — the cold-list game is dead.",
  },
  {
    full_name: "Marcus Webb",
    title: "Founder & CEO",
    company: "Northwind Labs",
    location: "London, UK",
    excerpt:
      "Just closed our seed. Spending the next 90 days obsessed with finding repeatable outbound. Open to recommendations on tooling.",
  },
  {
    full_name: "Priya Nair",
    title: "VP Sales",
    company: "Atlas Fintech",
    location: "New York, NY",
    excerpt:
      "Hiring two SDRs and replacing our prospecting stack. Anyone using AI to surface buying intent from social? DMs open.",
  },
  {
    full_name: "Jonas Müller",
    title: "Co-founder",
    company: "Pulsar Studio",
    location: "Berlin, DE",
    excerpt:
      "Reps spend 6 hours/day on LinkedIn finding the right people. There has to be a better way to detect buying intent at scale.",
  },
];

const PROMPT_CHIPS = [
  "Founders of seed-stage SaaS in the US",
  "Heads of Sales at 50-200 person B2B companies",
  "Marketing leaders at fintechs in Europe",
  "CTOs of agencies recently hiring",
];

export default function PublicAiChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showLeads, setShowLeads] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const limitReached = userMessageCount >= MAX_USER_MESSAGES;
  const inputDisabled = sending || searching || limitReached || showLeads;

  useEffect(() => {
    document.title = "Try Intentsly AI — Find buyers in seconds";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "Chat with Intentsly AI to find people on LinkedIn posting buying intent for your offering. No signup needed to try.";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending, searching]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || inputDisabled) return;
    setInput("");

    const nextHistory: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextHistory);
    setSending(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: nextHistory,
          user_message_count: nextHistory.filter((m) => m.role === "user").length,
          max_messages: MAX_USER_MESSAGES,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const reply: string = data.reply ?? "Got it.";
      const ready: boolean = Boolean(data.ready_to_search);

      setMessages((m) => [...m, { role: "assistant", content: reply }]);

      // Trigger search if AI says so OR if user hit the limit
      const willSearch = ready || nextHistory.filter((m) => m.role === "user").length >= MAX_USER_MESSAGES;
      if (willSearch) {
        runFakeSearch();
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Something went wrong on my end. Sign up to keep going — I'll find your leads over there.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function runFakeSearch() {
    setSearching(true);
    // Simulate search latency
    await new Promise((r) => setTimeout(r, 1800));
    setSearching(false);
    setShowLeads(true);
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        content:
          "Found **4 high-intent leads** matching your criteria. They're showing strong buying signals on LinkedIn right now — sign up free to unlock and start reaching out.",
      },
    ]);
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <img
        src={heroSkyBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <Navbar />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pt-28 md:pt-36 pb-12">
        <div className="w-full max-w-3xl text-center mb-8 animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 mb-5">
            <Sparkles className="w-3 h-3" /> Try Intentsly AI live · No signup
          </span>
          <h1 className="text-4xl md:text-6xl font-medium text-white leading-[1.05] tracking-tight mb-4">
            Tell us who you sell to.
            <br />
            <span className="text-white/70">We'll find them in seconds.</span>
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-xl mx-auto">
            Chat with our AI to describe your ideal customer. We'll surface real LinkedIn buyers showing intent right now.
          </p>
        </div>

        <div className="w-full max-w-3xl">
          <div
            className="rounded-3xl p-[1.5px]"
            style={{
              background:
                "conic-gradient(from var(--ai-angle, 0deg), #BC82F3, #F5B9EA, #8D99FF, #AA6EEE, #FF6778, #FFBA71, #C686FF, #BC82F3)",
              animation: "rotate-border 8s linear infinite",
            }}
          >
            <div className="rounded-[22px] bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col" style={{ minHeight: "560px" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <img src={intentslyIcon} alt="" className="w-6 h-6" />
                  <h2 className="text-base font-semibold intentsly-ai-gradient">Intentsly AI</h2>
                </div>
                <span className="text-[11px] text-foreground/50 font-medium">
                  {Math.min(userMessageCount, MAX_USER_MESSAGES)} / {MAX_USER_MESSAGES} messages
                </span>
              </div>

              {/* Conversation */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4" style={{ maxHeight: "440px" }}>
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-foreground/60 mb-4">
                      Describe who you want to reach. Try one of these:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {PROMPT_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setInput(chip)}
                          className="text-xs px-3 py-2 rounded-full bg-white border border-border hover:border-foreground/40 transition-colors text-foreground/70"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                    {m.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        <img src={intentslyIcon} alt="" className="w-5 h-5" />
                      </div>
                    )}
                    <div className={cn("max-w-[85%]", m.role === "user" && "flex flex-col items-end")}>
                      {m.role === "user" ? (
                        <div className="rounded-2xl rounded-br-sm bg-foreground text-primary-foreground px-4 py-2.5 text-sm leading-relaxed">
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed text-foreground prose prose-sm max-w-none prose-p:my-1.5 prose-strong:text-foreground">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center shrink-0">
                      <img src={intentslyIcon} alt="" className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                {searching && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center shrink-0">
                      <img src={intentslyIcon} alt="" className="w-5 h-5" />
                    </div>
                    <div className="px-1 py-1.5">
                      <span className="thinking-text-shimmer text-sm font-medium">
                        Scanning LinkedIn for buying intent…
                      </span>
                    </div>
                  </div>
                )}

                {/* Locked leads */}
                {showLeads && (
                  <div className="relative pt-2">
                    <div className="space-y-2.5 select-none pointer-events-none filter blur-[6px]">
                      {FAKE_LEADS.map((lead, i) => (
                        <div key={i} className="rounded-xl border border-border bg-white p-3.5 flex flex-col gap-2">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">{lead.full_name}</p>
                              <p className="text-xs text-foreground/70">{lead.title}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-foreground/50">
                                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{lead.company}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.location}</span>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border text-rose-600 bg-rose-50 border-rose-200">
                              {92 - i * 3}
                            </span>
                          </div>
                          <p className="text-[12px] text-foreground/70 leading-relaxed line-clamp-2">
                            "{lead.excerpt}"
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Unlock overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl px-6 py-5 max-w-sm text-center">
                        <div className="w-11 h-11 rounded-full bg-foreground text-white flex items-center justify-center mx-auto mb-3">
                          <Lock className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground mb-1">
                          4 high-intent leads waiting
                        </h3>
                        <p className="text-xs text-foreground/60 mb-4">
                          Sign up free to unlock these leads and start reaching out today.
                        </p>
                        <Link
                          to="/register"
                          className="inline-flex items-center gap-1.5 bg-foreground text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
                        >
                          Unlock leads
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border p-3 bg-white">
                {limitReached && !showLeads && !searching && (
                  <p className="text-[11px] text-foreground/50 text-center mb-2">
                    You've reached the {MAX_USER_MESSAGES}-message preview limit.
                  </p>
                )}
                <div className="flex items-end gap-2 bg-card border border-border rounded-xl p-2.5">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder={
                      showLeads
                        ? "Sign up to keep chatting…"
                        : limitReached
                          ? "Sign up to send more messages…"
                          : "Describe your ideal customer…"
                    }
                    disabled={inputDisabled}
                    rows={1}
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground resize-none border-0 outline-none text-sm min-h-[28px] max-h-[120px] disabled:opacity-50"
                  />
                  {showLeads || limitReached ? (
                    <Link
                      to="/register"
                      className="shrink-0 inline-flex items-center gap-1.5 bg-foreground text-primary-foreground text-sm font-semibold px-4 h-9 rounded-full hover:opacity-90"
                    >
                      Sign up
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => send(input)}
                      disabled={inputDisabled || !input.trim()}
                      className="w-9 h-9 rounded-full text-white flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 shrink-0"
                      style={{ background: "linear-gradient(135deg, #1a1a2e, #4a4a5a)" }}
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-white/70 mt-4">
            No credit card required · Real LinkedIn intent signals · Cancel anytime
          </p>
        </div>
      </main>
    </div>
  );
}
