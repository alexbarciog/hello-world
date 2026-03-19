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
    <div className="relative px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-xl">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-muted-foreground/60 text-[10px] mb-5 font-medium tracking-wide uppercase">
          <span>Support</span>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-foreground/70">New Ticket</span>
        </div>

        {/* Main Card */}
        <section className="bg-card border border-border/40 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-foreground mb-1 font-[Manrope]">
              Submit a Ticket
            </h1>
            <p className="text-muted-foreground text-sm font-normal leading-relaxed">
              Describe your issue and we'll get back to you as soon as possible.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-background border-border rounded-xl h-9 text-sm">
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
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Subject
              </label>
              <input
                type="text"
                placeholder="What is this regarding?"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={200}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 h-9 text-sm focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all text-foreground placeholder:text-muted-foreground/50 outline-none"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Message
              </label>
              <textarea
                placeholder="Please provide as much detail as possible..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                maxLength={2000}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all text-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
              />
            </div>

            {/* Attachment placeholder */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-secondary/50 border border-dashed border-border rounded-xl">
              <div className="flex items-center gap-2">
                <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add screenshot or file</span>
              </div>
              <button type="button" className="text-[11px] font-medium text-primary hover:underline underline-offset-4">
                Browse
              </button>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-6 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                <span>{loading ? "Sending..." : "Submit Ticket"}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
              <p className="text-center text-[10px] text-muted-foreground/50 mt-3 tracking-wide">
                Average response time: &lt; 24 hours
              </p>
            </div>
          </form>
        </section>

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div
            onClick={() => navigate("/help")}
            className="bg-card border border-border/40 p-4 rounded-xl cursor-pointer hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground/60">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-foreground">Help Center</h3>
                <p className="text-[11px] text-muted-foreground">Find instant answers.</p>
              </div>
            </div>
          </div>

          <a
            href="https://discord.gg/intentsly"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border border-border/40 p-4 rounded-xl cursor-pointer hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground/60">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-foreground">Community</h3>
                <p className="text-[11px] text-muted-foreground">Join us on Discord.</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
