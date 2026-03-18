import { ArrowRight, Heart, UserPlus, Users, Target, Sparkles, Building2, MapPin, TrendingUp, Download, MessageCircle, Search } from "lucide-react";

const HeroCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
      {/* Card 1: Engagement Signals */}
      <div className="rounded-2xl bg-foreground p-5 text-left flex flex-col gap-3 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-background">Engagement signals</h3>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Profile sub-card */}
        <div className="bg-background rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-xs font-bold text-background shrink-0 ring-2 ring-background">MC</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Michael Chang</div>
            <div className="text-xs text-muted-foreground">VP of Sales at InnovateIQ</div>
            <div className="text-xs text-muted-foreground">michael@innovateiq.com</div>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border text-muted-foreground shrink-0">2nd degree</span>
        </div>

        {/* Dashed connector */}
        <div className="flex items-center gap-1.5 px-2">
          <span className="border-t border-dashed border-muted-foreground/40 flex-1" />
          <span className="text-[10px] text-muted-foreground/60">→</span>
        </div>

        {/* Signal tags */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-background text-foreground shadow-sm">
            <Heart className="w-3 h-3" /> Liked your post
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-background text-foreground shadow-sm">
            <UserPlus className="w-3 h-3" /> Followed you
          </span>
        </div>

        {/* Dashed connector */}
        <div className="flex items-center gap-1.5 px-2">
          <span className="border-t border-dashed border-muted-foreground/40 flex-1" />
          <span className="text-[10px] text-muted-foreground/60">→</span>
        </div>

        {/* Why they fit sub-card */}
        <div className="bg-background rounded-xl p-3 shadow-sm border-l-2 border-amber-400 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Why they fit</span>
          </div>
          <div className="space-y-1.5 pl-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3 shrink-0" /> Is a decision-maker
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 shrink-0" /> Posts about sales software
            </div>
          </div>
        </div>

        {/* Actions sub-card */}
        <div className="bg-background rounded-xl p-3 shadow-sm space-y-2 mt-auto">
          <p className="text-sm font-semibold text-foreground">Move this lead forward</p>
          <div className="flex gap-2">
            <button className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg bg-foreground text-background">
              <Download className="w-3 h-3" /> Save to CRM
            </button>
            <button className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-lg border border-border text-foreground">
              <UserPlus className="w-3 h-3" /> Connect
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: Lead Insights */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg p-5 text-left flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Lead insights</h3>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Profile */}
        <div className="bg-muted/40 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-xs font-bold text-white shrink-0">DH</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Danielle Harris</div>
            <div className="text-xs text-muted-foreground">CMO at Thread Theory · 2 months in</div>
            <div className="text-xs text-muted-foreground">danielle.harris@theory.com</div>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border text-muted-foreground shrink-0">1st degree</span>
        </div>

        {/* Signal tags */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border text-muted-foreground">
            <Users className="w-3 h-3" /> Is hiring
          </span>
        </div>

        {/* Why they fit */}
        <div className="space-y-2">
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

        {/* Actions */}
        <div className="mt-auto pt-2 space-y-2">
          <p className="text-xs font-medium text-foreground">Move this lead forward</p>
          <button className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-foreground text-background">
            <MessageCircle className="w-3 h-3" /> Generate AI-personalized message
          </button>
        </div>
      </div>

      {/* Card 3: Company Intel */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg p-5 text-left flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Company intel</h3>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Company profile */}
        <div className="bg-muted/40 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[8px] font-bold text-white tracking-tight shrink-0">RB</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">RevBoost</div>
            <div className="text-xs text-muted-foreground">+500 employees</div>
            <div className="text-xs text-muted-foreground">contact@revboost.com</div>
          </div>
        </div>

        {/* Signal tags */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border text-muted-foreground">
            <TrendingUp className="w-3 h-3" /> Company raised funds
          </span>
        </div>

        {/* Why they fit */}
        <div className="space-y-2">
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

        {/* Actions */}
        <div className="mt-auto pt-2 space-y-2">
          <p className="text-xs font-medium text-foreground">Move this lead forward</p>
          <button className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-foreground text-background">
            <Search className="w-3 h-3" /> Find decision makers
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroCards;
