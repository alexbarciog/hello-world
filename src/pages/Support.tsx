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
    <div className="relative min-h-full px-4 py-8 md:px-6 md:py-12 flex flex-col items-center overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-muted-foreground/60 text-xs mb-8 font-light tracking-wide uppercase">
          <span>Support</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-muted-foreground">New Ticket</span>
        </div>

        {/* Main Glass Card */}
        <section className="bg-card/40 backdrop-blur-2xl border border-border/30 rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-primary/5">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4 font-[Manrope]">
              Submit a Ticket
            </h1>
            <p className="text-muted-foreground font-light text-lg leading-relaxed max-w-md">
              Describe your issue and we'll get back to you as soon as possible.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Category */}
            <div className="relative group">
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground/70 mb-3 ml-1">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-background/60 border-border/15 rounded-2xl px-5 py-4 h-auto text-base font-light focus:ring-2 focus:ring-primary/20 focus:border-primary/30">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="relative group">
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground/70 mb-3 ml-1">
                Subject
              </label>
              <input
                type="text"
                placeholder="What is this regarding?"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={200}
                className="w-full bg-background/60 border border-border/15 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-light text-foreground placeholder:text-muted-foreground/40 outline-none"
              />
            </div>

            {/* Message */}
            <div className="relative group">
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground/70 mb-3 ml-1">
                Message
              </label>
              <textarea
                placeholder="Please provide as much detail as possible..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={6}
                maxLength={2000}
                className="w-full bg-background/60 border border-border/15 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-light text-foreground placeholder:text-muted-foreground/40 outline-none resize-none"
              />
            </div>

            {/* Attachment placeholder */}
            <div className="flex items-center justify-between p-4 bg-muted/30 border border-dashed border-border/30 rounded-2xl">
              <div className="flex items-center gap-3">
                <Paperclip className="w-5 h-5 text-primary/60" />
                <span className="text-sm font-light text-muted-foreground">Add screenshot or file</span>
              </div>
              <button type="button" className="text-xs font-medium text-primary hover:underline underline-offset-4">
                Browse files
              </button>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 px-8 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium text-lg shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                <span>{loading ? "Sending..." : "Submit Ticket"}</span>
                <Send className="w-5 h-5" />
              </button>
              <p className="text-center text-[10px] text-muted-foreground/50 mt-6 tracking-widest uppercase">
                Average response time: &lt; 24 hours
              </p>
            </div>
          </form>
        </section>

        {/* Support Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => navigate("/help")}
            className="bg-card/40 backdrop-blur-2xl p-6 rounded-3xl border border-border/20 cursor-pointer hover:bg-card/60 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Help Center</h3>
                <p className="text-xs font-light text-muted-foreground">Find instant answers in our docs.</p>
              </div>
            </div>
          </div>

          <a
            href="https://discord.gg/intentsly"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card/40 backdrop-blur-2xl p-6 rounded-3xl border border-border/20 cursor-pointer hover:bg-card/60 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Live Community</h3>
                <p className="text-xs font-light text-muted-foreground">Join creators on Discord.</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
