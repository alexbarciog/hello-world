import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, HelpCircle, MessageCircle, Paperclip, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import heroSkyBg from "@/assets/hero-sky-bg.webp";

const CATEGORIES = [
  { value: "technical", label: "Technical Issue" },
  { value: "billing", label: "Billing & Subscription" },
  { value: "account", label: "Account Access" },
  { value: "feature", label: "Feature Request" },
  { value: "general", label: "General Inquiry" },
];

export default function Support() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !subject.trim() || !message.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || "Unknown";
      const categoryLabel = CATEGORIES.find(c => c.value === category)?.label || category;

      const html = `
        <h2>New Support Ticket</h2>
        <p><strong>From:</strong> ${userEmail}</p>
        <p><strong>Category:</strong> ${categoryLabel}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br />")}</p>
      `;

      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: "info@intentsly.com",
          from: "noreply@intentsly.com",
          subject: `[Support - ${categoryLabel}] ${subject}`,
          html,
        },
      });

      if (error) throw error;

      toast({ title: "Ticket submitted!", description: "We'll get back to you soon." });
      setCategory("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      toast({ title: "Failed to send ticket", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden rounded-[20px] border border-gray-200/60 shadow-sm">
      {/* Sky hero background */}
      <img
        src={heroSkyBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Soft fade to white at bottom for legibility */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-white/40 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 py-16 md:py-20">
        {/* Hero text */}
        <div className="text-center max-w-2xl mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white/90 text-[11px] uppercase tracking-[0.15em] font-medium mb-6">
            <Sparkles className="w-3 h-3" />
            Support
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-[1.05] tracking-tight mb-4">
            How can we
            <br />
            <span className="text-white/70">help you today?</span>
          </h1>
          <p className="text-base text-white/80 leading-relaxed max-w-md mx-auto">
            Send us a ticket and our team will get back to you within 24 hours.
          </p>
        </div>

        {/* Glass form card */}
        <section
          className="w-full max-w-2xl rounded-[28px] p-6 md:p-10 border border-white/30 shadow-2xl animate-fade-in-up"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(28px) saturate(140%)",
            WebkitBackdropFilter: "blur(28px) saturate(140%)",
            animationDelay: "120ms",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground/60 mb-2">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-white/70 border-white/40 rounded-2xl h-12 text-sm">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value} className="text-sm">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground/60 mb-2">
                Subject
              </label>
              <input
                type="text"
                placeholder="What is this regarding?"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={200}
                className="w-full bg-white/70 border border-white/40 rounded-2xl px-4 h-12 text-sm focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all text-foreground placeholder:text-foreground/40 outline-none"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground/60 mb-2">
                Message
              </label>
              <textarea
                placeholder="Please provide as much detail as possible..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={6}
                maxLength={2000}
                className="w-full bg-white/70 border border-white/40 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 transition-all text-foreground placeholder:text-foreground/40 outline-none resize-none"
              />
            </div>

            {/* Attachment placeholder */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/40 border border-dashed border-foreground/15 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <Paperclip className="w-4 h-4 text-foreground/50" />
                <span className="text-xs text-foreground/70">Add screenshot or file</span>
              </div>
              <button type="button" className="text-xs font-semibold text-foreground hover:underline underline-offset-4">
                Browse files
              </button>
            </div>

            {/* Submit (lime CTA) */}
            <div className="pt-2 flex flex-col items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-cta disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? "Sending..." : "Submit Ticket"}
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-foreground/50 tracking-[0.15em] uppercase">
                Average response time · &lt; 24 hours
              </p>
            </div>
          </form>
        </section>

        {/* Info Cards */}
        <div className="w-full max-w-2xl mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <button
            onClick={() => navigate("/help")}
            className="group flex items-center gap-4 p-5 rounded-2xl border border-white/30 text-left transition-all hover:scale-[1.01]"
            style={{
              background: "rgba(255,255,255,0.45)",
              backdropFilter: "blur(20px) saturate(140%)",
              WebkitBackdropFilter: "blur(20px) saturate(140%)",
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/80 shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground">Self-Service Docs</h3>
              <p className="text-xs text-foreground/60 mt-0.5">Find instant answers in our portal.</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
          </button>

          <a
            href="https://discord.gg/intentsly"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 p-5 rounded-2xl border border-white/30 transition-all hover:scale-[1.01]"
            style={{
              background: "rgba(255,255,255,0.45)",
              backdropFilter: "blur(20px) saturate(140%)",
              WebkitBackdropFilter: "blur(20px) saturate(140%)",
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/80 shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground">Live Community</h3>
              <p className="text-xs text-foreground/60 mt-0.5">Join 2,000+ creators on Discord.</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
}
