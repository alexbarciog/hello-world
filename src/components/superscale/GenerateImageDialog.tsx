import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, X, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";

export default function GenerateImageDialog({
  open,
  onClose,
  postId,
  postContent,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  postId: string | null;
  postContent: string;
  onPick: (url: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);
  const [brief, setBrief] = useState("");
  const [editingBrief, setEditingBrief] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [hasStyle, setHasStyle] = useState<boolean | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setVariants([]);
    setPicked(null);
    setBrief("");
    setEditingBrief(false);
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("superscale_style_profile")
        .select("refs_count")
        .eq("user_id", u.user.id)
        .maybeSingle();
      setHasStyle(!!data);
      if (data) generate();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function analyzeStyle() {
    setAnalyzing(true);
    const { data, error } = await supabase.functions.invoke("superscale-analyze-style", { body: {} });
    setAnalyzing(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Analysis failed");
      return;
    }
    toast.success("Style analyzed from your refs");
    setHasStyle(true);
    generate();
  }

  async function generate(customBrief?: string) {
    setLoading(true);
    setVariants([]);
    setPicked(null);
    const { data, error } = await supabase.functions.invoke("superscale-generate-image", {
      body: { prompt: postContent, post_id: postId, n: 3, custom_brief: customBrief },
    });
    setLoading(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed");
      return;
    }
    setVariants(data.variants || []);
    setBrief(data.brief || "");
  }

  async function confirm() {
    if (!picked) return;
    onPick(picked);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Generate from your design refs</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5">
          {hasStyle === false ? (
            <div className="text-center py-10">
              <p className="text-sm text-foreground/70 mb-4">We need to analyze your design references first to learn your visual style.</p>
              <button
                onClick={analyzeStyle}
                disabled={analyzing}
                className="text-sm font-semibold px-4 py-2.5 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 text-white hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {analyzing ? "Analyzing your style…" : "Analyze my design refs"}
              </button>
            </div>
          ) : (
            <>
              {brief && (
                <div className="mb-4 rounded-xl bg-black/[0.03] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">Visual brief</span>
                    <button
                      onClick={() => setEditingBrief((v) => !v)}
                      className="text-[11px] font-medium text-foreground/60 hover:text-foreground"
                    >
                      {editingBrief ? "Cancel" : "Edit"}
                    </button>
                  </div>
                  {editingBrief ? (
                    <>
                      <textarea
                        value={brief}
                        onChange={(e) => setBrief(e.target.value)}
                        className="w-full text-xs leading-relaxed bg-white border border-black/10 rounded-lg p-2 outline-none min-h-[100px] resize-none"
                      />
                      <button
                        onClick={() => { setEditingBrief(false); generate(brief); }}
                        className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-black text-white hover:opacity-90"
                      >
                        Regenerate with this brief
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-line">{brief}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-xl bg-black/[0.04] animate-pulse flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-foreground/30" />
                      </div>
                    ))
                  : variants.map((url) => (
                      <button
                        key={url}
                        onClick={() => setPicked(url)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${picked === url ? "border-orange-500" : "border-transparent hover:border-black/10"}`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {picked === url && (
                          <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center">
                            <div className="bg-orange-500 text-white rounded-full p-1.5"><Check className="w-4 h-4" /></div>
                          </div>
                        )}
                      </button>
                    ))}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={() => generate()}
                  disabled={loading}
                  className="text-sm font-medium inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/10 hover:bg-black/5 disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Regenerate all
                </button>
                <div className="flex gap-2">
                  <button onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-lg border border-black/10 hover:bg-black/5">Cancel</button>
                  <button
                    onClick={confirm}
                    disabled={!picked}
                    className="text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 text-white hover:opacity-90 disabled:opacity-40"
                  >
                    Use this image
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
