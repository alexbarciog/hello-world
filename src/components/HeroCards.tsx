import { type ReactNode } from "react";
import {
  ArrowRight,
  Heart,
  UserPlus,
  Users,
  Target,
  Sparkles,
  Building2,
  TrendingUp,
  Download,
  MessageCircle,
  Search,
} from "lucide-react";
import intentslySmile from "@/assets/intentsly-smile.png";
import heroSkyBg from "@/assets/hero-sky-bg.webp";

type HeroCardFrameProps = {
  title: string;
  position: string;
  children: ReactNode;
};

const GlassBackdrop = ({ position }: { position: string }) => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
    <img
      src={heroSkyBg}
      alt=""
      className="absolute inset-[-16%] h-[132%] w-[132%] max-w-none object-cover opacity-95 blur-3xl scale-110"
      style={{ objectPosition: position }}
    />
    <div className="absolute inset-0 bg-background/15" />
    <div className="absolute inset-0 bg-gradient-to-br from-background/45 via-background/18 to-background/10" />
    <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-background/35" />
  </div>
);

const HeroCardFrame = ({ title, position, children }: HeroCardFrameProps) => (
  <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-background/20 bg-background/10 p-5 text-left shadow-lg backdrop-blur-xl">
    <GlassBackdrop position={position} />

    <div className="relative z-10 flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
      </div>

      {children}
    </div>
  </div>
);

const HeroCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
      <HeroCardFrame title="Engagement signals" position="left center">
        <div className="flex h-full flex-col gap-3 mx-6 mt-4">
          <div className="relative pl-5">
            <div className="absolute left-0 top-1/2 bottom-0 w-0 border-l border-dashed border-primary/30" />
            <div className="absolute left-0 top-1/2 w-5 h-0 border-t border-dashed border-primary/30" />
            <div className="bg-background rounded-xl p-3 flex items-center gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-xs font-bold text-background shrink-0 ring-2 ring-background">MC</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground">Michael Chang</div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border text-muted-foreground shrink-0">2nd degree</span>
                </div>
                <div className="text-xs" style={{ color: "#4A4A4A" }}>VP of Sales at InnovateIQ</div>
                <div className="text-xs text-muted-foreground">michael@innovateiq.com</div>
              </div>
            </div>
          </div>

          <div className="relative pl-5">
            <div className="absolute left-0 top-[-0.75rem] h-[calc(50%+0.75rem)] w-0 border-l border-dashed border-primary/30" />
            <div className="absolute left-0 top-1/2 w-5 h-0 border-t border-dashed border-primary/30" />
            <div className="absolute right-[-1.25rem] top-1/2 w-5 h-0 border-t border-dashed border-primary/30" />
            <div className="flex justify-between gap-2">
              <span className="relative flex-1 inline-flex items-center justify-center text-xs font-medium px-3 py-1.5 rounded-full bg-background text-foreground shadow-sm overflow-visible">
                <span
                  className="absolute inset-[-0.5px] rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-[borderSpin_2s_linear_infinite] transition-opacity duration-300"
                  style={{
                    background: "conic-gradient(from var(--border-angle), #7C93E6 0%, #F7C459 25%, transparent 50%, transparent 100%)",
                    zIndex: 0,
                  }}
                />
                <span className="absolute inset-[1px] rounded-full bg-background" style={{ zIndex: 0 }} />
                <span className="relative z-10 inline-flex items-center">
                  <Heart className="w-3 h-3 mr-1.5 shrink-0" />Liked <span className="underline text-foreground mx-[3px]">this</span> post
                </span>
              </span>
              <span className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-background text-foreground shadow-sm">
                <UserPlus className="w-3 h-3" /> Followed you
              </span>
            </div>
          </div>

          <div className="relative pl-5">
            <div className="absolute right-[-1.25rem] -top-[1.625rem] h-[calc(50%+1.625rem)] w-0 border-l border-dashed border-primary/30" />
            <div className="absolute right-[-1.25rem] top-1/2 w-5 h-0 border-t border-dashed border-primary/30" />
            <div className="bg-background rounded-xl p-3 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: "#75A3FE" }}>
                  <img src={intentslySmile} alt="" className="w-4 h-4 object-contain" />
                </div>
                <span className="text-xs font-semibold text-foreground">Why they fit</span>
              </div>
              <div className="space-y-1.5">
                <div className="w-full rounded px-3 py-2 flex items-center gap-2 text-xs text-foreground text-left" style={{ backgroundColor: "#F5F5F5" }}>
                  <Users className="w-3 h-3 shrink-0 text-foreground" /> Is a decision-maker
                </div>
                <div className="w-full rounded px-3 py-2 flex items-center gap-2 text-xs text-foreground text-left" style={{ backgroundColor: "#F5F5F5" }}>
                  <Sparkles className="w-3 h-3 shrink-0 text-foreground" /> Posts about sales software
                </div>
              </div>
            </div>
          </div>

          <div className="pl-5 mt-auto">
            <div className="bg-background rounded-xl p-3 shadow-sm space-y-2">
              <p className="text-sm font-semibold text-foreground">Move this lead forward</p>
              <div className="flex gap-2">
                <button className="flex-1 btn-cta !rounded-lg inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2.5">
                  <Download className="w-3 h-3" /> Save
                </button>
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-lg border border-border text-foreground">
                  <UserPlus className="w-3 h-3" /> Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      </HeroCardFrame>

      <HeroCardFrame title="Lead insights" position="center center">
        <div className="flex h-full flex-col gap-3 mx-6 mt-4">
          <div className="relative pl-5">
            <div className="absolute left-0 top-1/2 bottom-0 w-0 border-l border-dashed border-primary/30" />
            <div className="absolute left-0 top-1/2 w-5 h-0 border-t border-dashed border-primary/30" />
            <div className="bg-background rounded-xl p-3 flex items-center gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-xs font-bold text-background shrink-0 ring-2 ring-background">DH</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground">Danielle Harris</div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border text-muted-foreground shrink-0">1st degree</span>
                </div>
                <div className="text-xs" style={{ color: "#4A4A4A" }}>CMO at Thread Theory</div>
                <div className="text-xs text-muted-foreground">danielle.harris@theory.com</div>
              </div>
            </div>
          </div>

          <div className="relative pl-5">
            <div className="absolute left-0 top-[-0.75rem] h-[calc(50%+0.75rem)] w-0 border-l border-dashed border-primary/30" />
            <div className="absolute left-0 top-1/2 w-5 h-0 border-t border-dashed border-primary/30" />
            <div className="flex justify-between gap-2">
              <span className="relative flex-1 inline-flex items-center justify-center text-xs font-medium px-3 py-1.5 rounded-full bg-background text-foreground shadow-sm overflow-visible">
                <span
                  className="absolute inset-[-0.5px] rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-[borderSpin_2s_linear_infinite] transition-opacity duration-300"
                  style={{
                    background: "conic-gradient(from var(--border-angle), #7C93E6 0%, #F7C459 25%, transparent 50%, transparent 100%)",
                    zIndex: 0,
                  }}
                />
                <span className="absolute inset-[1px] rounded-full bg-background" style={{ zIndex: 0 }} />
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Is hiring
                </span>
              </span>
            </div>
          </div>

          <div className="relative pl-5">
            <div className="bg-background rounded-xl p-3 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: "#75A3FE" }}>
                  <img src={intentslySmile} alt="" className="w-4 h-4 object-contain" />
                </div>
                <span className="text-xs font-semibold text-foreground">Why they fit</span>
              </div>
              <div className="space-y-1.5">
                <div className="w-full rounded px-3 py-2 flex items-center gap-2 text-xs text-foreground text-left" style={{ backgroundColor: "#F5F5F5" }}>
                  <Target className="w-3 h-3 shrink-0 text-foreground" /> Matches your ICP
                </div>
                <div className="w-full rounded px-3 py-2 flex items-center gap-2 text-xs text-foreground text-left" style={{ backgroundColor: "#F5F5F5" }}>
                  <Sparkles className="w-3 h-3 shrink-0 text-foreground" /> Skills: lead generation
                </div>
              </div>
            </div>
          </div>

          <div className="pl-5 mt-auto">
            <div className="bg-background rounded-xl p-3 shadow-sm space-y-2">
              <p className="text-sm font-semibold text-foreground">Move this lead forward</p>
              <div className="flex gap-2">
                <button className="flex-1 btn-cta !rounded-lg inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2.5">
                  <MessageCircle className="w-3 h-3" /> Generate Personalized Message with AI
                </button>
              </div>
            </div>
          </div>
        </div>
      </HeroCardFrame>

      <HeroCardFrame title="Company intel" position="right center">
        <div className="flex h-full flex-col gap-3 mx-6 mt-4">
          <div className="relative pl-5">
            <div className="absolute left-0 top-1/2 bottom-0 w-0 border-l border-dashed border-primary/30" />
            <div className="absolute left-0 top-1/2 w-5 h-0 border-t border-dashed border-primary/30" />
            <div className="bg-background rounded-xl p-3 flex items-center gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-background shrink-0 ring-2 ring-background">RB</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground">RevBoost</div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border text-muted-foreground shrink-0">+500 employees</span>
                </div>
                <div className="text-xs" style={{ color: "#4A4A4A" }}>Information Technology</div>
                <div className="text-xs text-muted-foreground">contact@revboost.com</div>
              </div>
            </div>
          </div>

          <div className="relative pl-5">
            <div className="absolute left-0 top-[-0.75rem] h-[calc(50%+0.75rem)] w-0 border-l border-dashed border-primary/30" />
            <div className="absolute left-0 top-1/2 w-5 h-0 border-t border-dashed border-primary/30" />
            <div className="flex justify-between gap-2">
              <span className="relative flex-1 inline-flex items-center justify-center text-xs font-medium px-3 py-1.5 rounded-full bg-background text-foreground shadow-sm overflow-visible">
                <span
                  className="absolute inset-[-0.5px] rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-[borderSpin_2s_linear_infinite] transition-opacity duration-300"
                  style={{
                    background: "conic-gradient(from var(--border-angle), #7C93E6 0%, #F7C459 25%, transparent 50%, transparent 100%)",
                    zIndex: 0,
                  }}
                />
                <span className="absolute inset-[1px] rounded-full bg-background" style={{ zIndex: 0 }} />
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> Company raised funds
                </span>
              </span>
            </div>
          </div>

          <div className="relative pl-5">
            <div className="bg-background rounded-xl p-3 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: "#75A3FE" }}>
                  <img src={intentslySmile} alt="" className="w-4 h-4 object-contain" />
                </div>
                <span className="text-xs font-semibold text-foreground">Why they fit</span>
              </div>
              <div className="space-y-1.5">
                <div className="w-full rounded px-3 py-2 flex items-center gap-2 text-xs text-foreground text-left" style={{ backgroundColor: "#F5F5F5" }}>
                  <Building2 className="w-3 h-3 shrink-0 text-foreground" /> Industry: Information technology
                </div>
                <div className="w-full rounded px-3 py-2 flex items-center gap-2 text-xs text-foreground text-left" style={{ backgroundColor: "#F5F5F5" }}>
                  <Users className="w-3 h-3 shrink-0 text-foreground" /> Headcount grew 30% last year
                </div>
              </div>
            </div>
          </div>

          <div className="pl-5 mt-auto">
            <div className="bg-background rounded-xl p-3 shadow-sm space-y-2">
              <p className="text-sm font-semibold text-foreground">Move this lead forward</p>
              <div className="flex gap-2">
                <button className="flex-1 btn-cta !rounded-lg inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2.5">
                  <Search className="w-3 h-3" /> Find decision makers
                </button>
              </div>
            </div>
          </div>
        </div>
      </HeroCardFrame>
    </div>
  );
};

export default HeroCards;
