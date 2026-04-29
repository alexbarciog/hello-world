import { useState } from "react";
import { ArrowRight, CheckCircle2, BookOpen, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Playbook() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-playbook", {
        body: { email: trimmed, name: name.trim() },
      });
      if (error) throw error;
      if (data && (data as any).success === false) throw new Error((data as any).error || "Send failed");
      setSent(true);
      toast.success("Playbook sent — check your inbox");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Could not send playbook. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-start">
          {/* Left: Pitch */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              Free Playbook
            </div>
            <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] tracking-tight mb-6">
              The 90-Day B2B Playbook:
              <span className="block italic text-emerald-700">0 to 100 customers.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
              The exact tactics, scripts, and intent signals we use to take B2B startups from cold start
              to 100 paying customers in 90 days. No fluff. Built from real campaigns.
            </p>

            <ul className="space-y-3 mb-2">
              {[
                "Week-by-week 90-day execution roadmap",
                "ICP & intent signal frameworks that actually convert",
                "Outreach scripts (LinkedIn + email) with reply rates",
                "Pricing & first-100 customer pipeline math",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Form card */}
          <div className="lg:sticky lg:top-32">
            <div className="bg-[#f9f9f7] border border-slate-200 rounded-2xl p-8 shadow-sm">
              {sent ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                    <Mail className="w-7 h-7 text-emerald-700" />
                  </div>
                  <h2 className="font-serif text-2xl mb-2">Check your inbox</h2>
                  <p className="text-slate-600 text-sm">
                    We just sent the playbook to <span className="font-medium text-slate-900">{email}</span>.
                    It usually arrives within a minute.
                  </p>
                  <button
                    onClick={() => { setSent(false); setEmail(""); setName(""); }}
                    className="mt-6 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                  >
                    Send to another email →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h2 className="font-serif text-2xl mb-1">Get the Playbook</h2>
                    <p className="text-sm text-slate-600">Free PDF-style guide. Sent to your inbox instantly.</p>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-xs font-medium text-slate-700 mb-1.5">
                      First name <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={80}
                      placeholder="Alex"
                      className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1.5">
                      Work email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={255}
                      placeholder="alex@company.com"
                      className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-colors"
                  >
                    {loading ? "Sending..." : (
                      <>
                        Get Playbook
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                    By submitting, you agree to receive the playbook and occasional follow-ups. Unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
