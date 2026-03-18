import { ArrowRight, Heart, UserPlus, Users, Target, Sparkles, Building2, MapPin, TrendingUp, Download, MessageCircle, Search } from "lucide-react";
import intentslySmile from "@/assets/intentsly-smile.png";

const HeroCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
      {/* Card 1: Engagement Signals */}
      <div className="group rounded-3xl p-5 text-left flex flex-col relative overflow-hidden border-2 border-background opacity-80 hover:opacity-100 hover:scale-[1.02] transition-all duration-300" style={{ background: "hsl(0 0% 96%)" }}>
        {/* Group 1: Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Engagement signals</h3>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform duration-300" />
        </div>

        {/* Group 2: Lead flow */}
        <div className="flex flex-col gap-3 mx-6 mt-4">
          {/* Profile sub-card with left connector */}
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
                <div className="text-xs" style={{ color: '#4A4A4A' }}>VP of Sales at InnovateIQ</div>
                <div className="text-xs text-muted-foreground">michael@innovateiq.com</div>
              </div>
            </div>
          </div>

          {/* Signal tags with left connector */}
          {/* Signal tags with left and right connectors */}
          <div className="relative pl-5">
            {/* Left connector: vertical from profile */}
            <div className="absolute left-0 top-[-0.75rem] h-[calc(50%+0.75rem)] w-0 border-l border-dashed border-primary/30" />
            <div className="absolute left-0 top-1/2 w-5 h-0 border-t border-dashed border-primary/30" />
            {/* Right connector: horizontal from "Followed you" */}
            <div className="absolute right-[-1.25rem] top-1/2 w-5 h-0 border-t border-dashed border-primary/30" />
            <div className="flex justify-between gap-2">
              <span className="relative flex-1 inline-flex items-center justify-center text-xs font-medium px-3 py-1.5 rounded-full bg-background text-foreground shadow-sm overflow-visible">
                {/* Animated gradient border */}
                <span
                  className="absolute inset-[-1px] rounded-full group-hover:animate-[borderSpin_2s_linear_infinite]"
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
          {/* Why they fit sub-card with right connector */}
          <div className="relative pl-5">
            <div className="absolute right-[-1.25rem] -top-[1.625rem] h-[calc(50%+1.625rem)] w-0 border-l border-dashed border-primary/30" />
            <div className="absolute right-[-1.25rem] top-1/2 w-5 h-0 border-t border-dashed border-primary/30" />
            <div className="bg-background rounded-xl p-3 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#75A3FE' }}>
                  <img src={intentslySmile} alt="" className="w-4 h-4 object-contain" />
                </div>
                <span className="text-xs font-semibold text-foreground">Why they fit</span>
              </div>
              <div className="space-y-1.5">
                <div className="w-full rounded px-3 py-2 flex items-center gap-2 text-xs text-foreground text-left" style={{ backgroundColor: '#F5F5F5' }}>
                  <Users className="w-3 h-3 shrink-0 text-foreground" /> Is a decision-maker
                </div>
                <div className="w-full rounded px-3 py-2 flex items-center gap-2 text-xs text-foreground text-left" style={{ backgroundColor: '#F5F5F5' }}>
                  <Sparkles className="w-3 h-3 shrink-0 text-foreground" /> Posts about sales software
                </div>
              </div>
            </div>
          </div>

          {/* Actions sub-card */}
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
      </div>

      {/* Card 2: Lead Insights */}
      <div className="group rounded-3xl bg-foreground p-5 text-left flex flex-col gap-3 relative overflow-hidden opacity-80 hover:opacity-100 hover:scale-[1.02] transition-all duration-300">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-background">Lead insights</h3>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform duration-300" />
        </div>

        <div className="bg-background rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-xs font-bold text-background shrink-0 ring-2 ring-background">DH</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Danielle Harris</div>
            <div className="text-xs text-muted-foreground">CMO at Thread Theory · 2 months in</div>
            <div className="text-xs text-muted-foreground">danielle.harris@theory.com</div>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border text-muted-foreground shrink-0">1st degree</span>
        </div>

        <div className="flex items-center gap-1.5 px-2">
          <span className="border-t border-dashed border-muted-foreground/40 flex-1" />
          <span className="text-[10px] text-muted-foreground/60">→</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-background text-foreground shadow-sm">
            <Users className="w-3 h-3" /> Is hiring
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2">
          <span className="border-t border-dashed border-muted-foreground/40 flex-1" />
          <span className="text-[10px] text-muted-foreground/60">→</span>
        </div>

        <div className="bg-background rounded-xl p-3 shadow-sm border-l-2 border-amber-400 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Why they fit</span>
          </div>
          <div className="space-y-1.5 pl-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="w-3 h-3 shrink-0" /> Matches your ICP
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 shrink-0" /> Skills: lead generation
            </div>
          </div>
        </div>

        <div className="bg-background rounded-xl p-3 shadow-sm space-y-2 mt-auto">
          <p className="text-sm font-semibold text-foreground">Move this lead forward</p>
          <button className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg bg-foreground text-background">
            <MessageCircle className="w-3 h-3" /> Generate AI-personalized message
          </button>
        </div>
      </div>

      {/* Card 3: Company Intel */}
      <div className="group rounded-3xl bg-foreground p-5 text-left flex flex-col gap-3 relative overflow-hidden opacity-80 hover:opacity-100 hover:scale-[1.02] transition-all duration-300">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-background">Company intel</h3>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform duration-300" />
        </div>

        <div className="bg-background rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[9px] font-bold text-background tracking-tight shrink-0">RB</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">RevBoost</div>
            <div className="text-xs text-muted-foreground">+500 employees</div>
            <div className="text-xs text-muted-foreground">contact@revboost.com</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2">
          <span className="border-t border-dashed border-muted-foreground/40 flex-1" />
          <span className="text-[10px] text-muted-foreground/60">→</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-background text-foreground shadow-sm">
            <TrendingUp className="w-3 h-3" /> Company raised funds
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2">
          <span className="border-t border-dashed border-muted-foreground/40 flex-1" />
          <span className="text-[10px] text-muted-foreground/60">→</span>
        </div>

        <div className="bg-background rounded-xl p-3 shadow-sm border-l-2 border-amber-400 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Why they fit</span>
          </div>
          <div className="space-y-1.5 pl-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3 shrink-0" /> Industry: Information technology
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" /> Headquartered in Chicago
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3 shrink-0" /> Headcount grew 30% last year
            </div>
          </div>
        </div>

        <div className="bg-background rounded-xl p-3 shadow-sm space-y-2 mt-auto">
          <p className="text-sm font-semibold text-foreground">Move this lead forward</p>
          <button className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg bg-foreground text-background">
            <Search className="w-3 h-3" /> Find decision makers
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroCards;
