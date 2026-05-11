import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Home, ListChecks, PenSquare, Sparkles, Image as ImageIcon, Inbox, User } from "lucide-react";
import SuperScaleHome from "@/components/superscale/SuperScaleHome";
import Queue from "@/components/superscale/Queue";
import Compose from "@/components/superscale/Compose";
import Inspiration from "@/components/superscale/Inspiration";
import DesignRefs from "@/components/superscale/DesignRefs";
import Drafts from "@/components/superscale/Drafts";
import AboutMe from "@/components/superscale/AboutMe";

type View = "home" | "calendar" | "compose" | "inspiration" | "design" | "drafts" | "about";

const items: { id: View; label: string; icon: any }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "calendar", label: "Queue", icon: ListChecks },
  { id: "compose", label: "Compose", icon: PenSquare },
  { id: "inspiration", label: "Inspiration", icon: Sparkles },
  { id: "design", label: "Design Refs", icon: ImageIcon },
  { id: "drafts", label: "Drafts & Sent", icon: Inbox },
  { id: "about", label: "About me", icon: User },
];

export default function SuperScale() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initial = (params.get("view") as View) || "home";
  const [view, setView] = useState<View>(initial);
  const [composePostId, setComposePostId] = useState<string | null>(params.get("post"));

  useEffect(() => {
    const next: Record<string, string> = { view };
    if (composePostId) next.post = composePostId;
    setParams(next, { replace: true });
  }, [view, composePostId]);

  function go(v: View, postId: string | null = null) {
    setComposePostId(postId);
    setView(v);
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-3rem)]">
      <aside className="w-[220px] shrink-0 border-r border-black/[0.06] bg-white px-3 py-5">
        <div className="flex items-center gap-2 px-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SS</span>
          </div>
          <span className="font-bold text-base">SuperScale</span>
        </div>

        <button
          onClick={() => go("compose")}
          className="w-full mb-5 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <PenSquare className="w-4 h-4" /> Create a post
        </button>

        <nav className="space-y-0.5">
          {items.map((it) => {
            const Icon = it.icon;
            const active = view === it.id;
            return (
              <button
                key={it.id}
                onClick={() => go(it.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
                  active ? "bg-black/[0.04] text-foreground" : "text-foreground/60 hover:bg-black/[0.03] hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {it.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 pt-4 border-t border-black/[0.06] px-2 text-[11px] text-foreground/40">
          LinkedIn growth, fully on autopilot
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#f9f9fa]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
          {view === "home" && <SuperScaleHome onNavigate={go} />}
          {view === "calendar" && <Queue onCompose={(postId) => go("compose", postId)} />}
          {view === "compose" && <Compose postId={composePostId} onSaved={() => go("drafts")} />}
          {view === "inspiration" && <Inspiration onRemixed={(postId) => go("compose", postId)} />}
          {view === "design" && <DesignRefs />}
          {view === "drafts" && <Drafts onEdit={(id) => go("compose", id)} />}
          {view === "about" && <AboutMe />}
        </div>
      </main>
    </div>
  );
}
