import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DesignRefs() {
  const [refs, setRefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("superscale_design_refs")
      .select("*")
      .order("position", { ascending: true });
    setRefs(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (refs.length + files.length > 20) {
      toast.error("Max 20 design references");
      return;
    }
    setUploading(true);
    const { data: u } = await supabase.auth.getUser();
    const userId = u.user?.id;
    if (!userId) {
      setUploading(false);
      return;
    }
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .maybeSingle();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `${userId}/refs/${Date.now()}-${i}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("superscale").upload(path, file);
      if (upErr) {
        toast.error(`Upload failed: ${file.name}`);
        continue;
      }
      const { data: pub } = supabase.storage.from("superscale").getPublicUrl(path);
      await supabase.from("superscale_design_refs").insert({
        user_id: userId,
        organization_id: member?.organization_id,
        image_url: pub.publicUrl,
        label: file.name,
        position: refs.length + i,
      });
    }
    setUploading(false);
    await load();
    // Fire-and-forget style re-analysis whenever refs change
    supabase.functions.invoke("superscale-analyze-style", { body: { force: true } }).catch(() => {});
  }

  async function remove(id: string) {
    await supabase.from("superscale_design_refs").delete().eq("id", id);
    setRefs((prev) => prev.filter((r) => r.id !== id));
    supabase.functions.invoke("superscale-analyze-style", { body: { force: true } }).catch(() => {});
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Design references</h1>
        <p className="text-sm text-foreground/60 mt-1">
          Upload at least 5 posts you love. We'll generate images in the same direction.
        </p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="rounded-xl border-2 border-dashed border-black/10 bg-white p-10 text-center cursor-pointer hover:border-black/20 transition-colors mb-6"
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 mx-auto text-foreground/40 animate-spin mb-2" />
        ) : (
          <Upload className="w-8 h-8 mx-auto text-foreground/40 mb-2" />
        )}
        <p className="text-sm font-medium">Drop images here or click to upload</p>
        <p className="text-xs text-foreground/50 mt-1">PNG, JPG up to 10MB · {refs.length}/20</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {refs.length < 5 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-6 text-sm text-amber-900">
          Add at least {5 - refs.length} more to enable AI image generation.
        </div>
      )}

      {loading ? (
        <div className="text-sm text-foreground/50">Loading…</div>
      ) : refs.length === 0 ? (
        <div className="text-center py-12 text-foreground/40">
          <ImageIcon className="w-10 h-10 mx-auto mb-2" />
          <p className="text-sm">No references yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {refs.map((r) => (
            <div key={r.id} className="group relative rounded-xl overflow-hidden bg-black/[0.04] aspect-square">
              <img src={r.image_url} alt={r.label || "ref"} className="w-full h-full object-cover" />
              <button
                onClick={() => remove(r.id)}
                className="absolute top-2 right-2 rounded-md bg-black/70 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
