import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, X, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function DefaultKeywordsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("default_spike_keywords")
        .eq("user_id", u.user.id)
        .maybeSingle();
      setKeywords(((data as any)?.default_spike_keywords || []) as string[]);
      setLoading(false);
    })();
  }, []);

  const persist = async (next: string[]) => {
    setKeywords(next);
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const { error } = await supabase
      .from("profiles")
      .update({ default_spike_keywords: next } as any)
      .eq("user_id", u.user.id);
    setSaving(false);
    if (error) toast.error("Could not save");
  };

  const add = () => {
    const parts = draft.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const next = Array.from(new Set([...keywords, ...parts]));
    setDraft("");
    persist(next);
  };

  const remove = (k: string) => persist(keywords.filter(x => x !== k));

  return (
    <div className="snow-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-orange-500" /> Default keywords
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Used to pre-fill every new comment spike. You can still add or remove keywords per spike.
          </p>
        </div>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        ) : keywords.length === 0 ? (
          <span className="text-xs text-gray-400">No defaults yet — add a few topics you usually engage with.</span>
        ) : keywords.map(k => (
          <span key={k} className="inline-flex items-center gap-1 text-xs font-medium bg-orange-50 text-orange-700 px-2 py-1 rounded-md">
            {k}
            <button onClick={() => remove(k)} className="hover:opacity-60"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add one or many — separate with commas, e.g. saas, founders, ai sales"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}
