import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Send, HelpCircle, MessageCircle, ChevronRight, Paperclip } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <div className="relative px-6 py-8 flex flex-col items-center min-h-[80vh] font-body">
      {/* Background blurs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-md-secondary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-md-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-md-on-surface-variant/60 text-[11px] mb-6 font-light tracking-widest uppercase font-body">
          <span>Support</span>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-md-on-surface-variant">New Ticket</span>
        </div>

        {/* Main Card */}
        <section className="glass-card rounded-[1.5rem] p-6 md:p-10">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground mb-2 font-headline">
              Submit a Ticket
            </h1>
            <p className="text-md-on-surface-variant font-light text-sm leading-relaxed max-w-md font-body">
              Describe your issue and we'll get back to you as soon as possible.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-widest text-md-on-surface-variant/70 mb-2 ml-0.5 font-body">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-white/60 border-md-outline-variant/15 rounded-xl h-11 text-sm font-light font-body">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value} className="font-body text-sm">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-widest text-md-on-surface-variant/70 mb-2 ml-0.5 font-body">
                Subject
              </label>
              <input
                type="text"
                placeholder="What is this regarding?"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={200}
                className="w-full bg-white/60 border border-md-outline-variant/15 rounded-xl px-4 py-3 h-11 text-sm font-light font-body focus:ring-2 focus:ring-md-primary/20 focus:border-md-primary/30 transition-all text-foreground placeholder:text-md-on-surface-variant/40 outline-none"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-widest text-md-on-surface-variant/70 mb-2 ml-0.5 font-body">
                Message
              </label>
              <textarea
                placeholder="Please provide as much detail as possible..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                maxLength={2000}
                className="w-full bg-white/60 border border-md-outline-variant/15 rounded-xl px-4 py-3 text-sm font-light font-body focus:ring-2 focus:ring-md-primary/20 focus:border-md-primary/30 transition-all text-foreground placeholder:text-md-on-surface-variant/40 outline-none resize-none"
              />
            </div>

            {/* Attachment placeholder */}
            <div className="flex items-center justify-between px-4 py-3 bg-md-surface-container/30 border border-dashed border-md-outline-variant/30 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Paperclip className="w-4 h-4 text-md-primary/60" />
                <span className="text-xs font-light text-md-on-surface-variant font-body">Add screenshot or file</span>
              </div>
              <button type="button" className="text-xs font-medium text-md-primary hover:underline underline-offset-4 font-body">
                Browse files
              </button>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-8 rounded-full bg-gradient-to-r from-md-primary to-md-secondary text-white font-medium text-sm shadow-lg shadow-md-secondary/20 hover:brightness-110 hover:scale-[1.02] active:scale-95 active:brightness-90 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none font-body outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary/30"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span>{loading ? "Sending..." : "Submit Ticket"}</span>
                <Send className="w-4 h-4" />
              </button>
              <p className="text-center text-[10px] text-md-on-surface-variant/50 mt-4 tracking-widest uppercase font-body">
                Average response time: &lt; 24 hours
              </p>
            </div>
          </form>
        </section>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div
            onClick={() => navigate("/help")}
            className="glass-card p-5 rounded-2xl cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-md-primary/10 flex items-center justify-center text-md-primary">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-foreground font-body">Self-Service Docs</h3>
                <p className="text-[11px] font-light text-md-on-surface-variant font-body">Find instant answers in our portal.</p>
              </div>
            </div>
          </div>

          <a
            href="https://discord.gg/intentsly"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card p-5 rounded-2xl cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-md-secondary/10 flex items-center justify-center text-md-secondary">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-foreground font-body">Live Community</h3>
                <p className="text-[11px] font-light text-md-on-surface-variant font-body">Join 2,000+ creators on Discord.</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
