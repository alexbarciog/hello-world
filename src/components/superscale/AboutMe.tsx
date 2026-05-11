import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Save } from "lucide-react";

const PLACEHOLDER = `Who are you? What do you do? Who do you help and how?

Example:
I'm Sarah, founder of Acme. We help B2B SaaS founders book more sales calls using buying-intent signals. I've been doing outbound for 7 years, sold to 200+ companies. I post about cold outreach, LinkedIn growth, and the unfiltered reality of running a startup.

The more specific you are (tone, niche, hot takes, things you'd never say) the better the AI can write in your voice.`;

export default function AboutMe() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("superscale_about_me")
        .eq("user_id", u.user.id)
        .maybeSingle();
      setText(data?.superscale_about_me || "");
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ superscale_about_me: text })
      .eq("user_id", u.user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("About me saved — AI will use this on every remix");
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">About me</h1>
          <p className="text-sm text-foreground/50">Context the AI uses every time it writes or remixes a post in your voice.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.04] p-5 mt-6">
        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Your story, voice & niche</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          disabled={loading}
          rows={16}
          className="w-full mt-2 text-sm leading-relaxed bg-transparent resize-none focus:outline-none placeholder:text-foreground/30"
        />
        <div className="flex items-center justify-between pt-3 border-t border-black/[0.04] mt-3">
          <span className="text-[11px] text-foreground/40">{text.length} characters · saved to your profile</span>
          <button
            onClick={save}
            disabled={saving || loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-black text-white px-3.5 py-2 rounded-lg hover:opacity-80 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-4 text-xs text-foreground/50 bg-orange-50 border border-orange-100 rounded-xl p-4">
        <strong className="text-foreground/70">Tip:</strong> Include your niche, who you help, your tone (casual / spicy / educational), recurring themes, and 2-3 things you'd never say. The more raw and specific, the more the AI sounds like you.
      </div>
    </div>
  );
}
