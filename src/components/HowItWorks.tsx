import { ArrowRight, UserPlus, Zap, TrendingUp, Users, MessageCircle, Sparkles } from "lucide-react";
import intentslySmile from "@/assets/intentsly-smile.png";

function SignupCard() {
  return (
    <div className="group rounded-3xl p-5 text-left flex flex-col relative overflow-hidden border-2 border-background opacity-80 hover:opacity-100 hover:scale-[1.02] transition-all duration-300 h-full" style={{ background: "hsl(0 0% 96%)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Add your ICP</h3>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform duration-300" />
      </div>

      <div className="flex flex-col gap-3 mx-6 mt-2">
        {["Job titles", "Industries", "Company size", "Locations", "Keywords"].map((placeholder, i) => (
          <div key={i} className="bg-background rounded-xl px-4 py-3 text-xs text-muted-foreground shadow-sm">
            {placeholder}
          </div>
        ))}
        <button className="w-full btn-cta !rounded-xl inline-flex items-center justify-center gap-1.5 text-xs px-4 py-3 mt-1">
          <UserPlus className="w-3 h-3" /> Save ICP
        </button>
      </div>
    </div>
  );
}

function SignalsCard() {
  const signals = [
    { label: "Liked competitor post", icon: <Zap className="w-3 h-3" /> },
    { label: "New funding round", icon: <TrendingUp className="w-3 h-3" /> },
    { label: "Joined industry group", icon: <Users className="w-3 h-3" /> },
    { label: "New role: VP Sales", icon: <UserPlus className="w-3 h-3" /> },
    { label: "Published content", icon: <MessageCircle className="w-3 h-3" /> },
    { label: "Attended webinar", icon: <Sparkles className="w-3 h-3" /> },
  ];

  return (
    <div className="group rounded-3xl p-5 text-left flex flex-col relative overflow-hidden border-2 border-background opacity-80 hover:opacity-100 hover:scale-[1.02] transition-all duration-300 h-full" style={{ background: "hsl(0 0% 96%)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Intent Signals</h3>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform duration-300" />
      </div>

      <div className="flex flex-col gap-3 mx-6 mt-2">
        <div className="bg-background rounded-xl p-3 shadow-sm space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#75A3FE' }}>
              <img src={intentslySmile} alt="" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-xs font-semibold text-foreground">Signals detected</span>
          </div>
          <div className="space-y-1.5">
            {signals.map((s, i) => (
              <div key={i} className="w-full rounded px-3 py-2 flex items-center gap-2 text-xs text-foreground text-left" style={{ backgroundColor: '#F5F5F5' }}>
                {s.icon} {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OutreachCard() {
  const leads = [
    { initials: "MC", name: "Michael Chang", title: "VP of Sales at InnovateIQ", gradient: "from-amber-300 to-amber-600" },
    { initials: "SL", name: "Sarah Lin", title: "Head of Growth at Nexora", gradient: "from-blue-300 to-blue-600" },
    { initials: "JR", name: "James Rivera", title: "CRO at ScalePoint", gradient: "from-emerald-300 to-emerald-600" },
  ];

  return (
    <div className="group rounded-3xl p-5 text-left flex flex-col relative overflow-hidden border-2 border-background opacity-80 hover:opacity-100 hover:scale-[1.02] transition-all duration-300 h-full" style={{ background: "hsl(0 0% 96%)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Qualified leads</h3>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform duration-300" />
      </div>

      <div className="flex flex-col gap-3 mx-6 mt-2">
        {leads.map((lead, i) => (
          <div key={i} className="bg-background rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${lead.gradient} flex items-center justify-center text-[10px] font-bold text-background shrink-0 ring-2 ring-background`}>
              {lead.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{lead.name}</div>
              <div className="text-xs" style={{ color: '#4A4A4A' }}>{lead.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const steps = [
  {
    num: "01",
    title: "Define your ICP",
    description: "Set your ideal customer profile — job titles, industries, and company size.",
    visual: <SignupCard />,
  },
  {
    num: "02",
    title: "Pick your signals",
    description:
      "AI Agents track buyers engaging with content, competitors, influencers — or signals like funding rounds, new roles, events, and groups.",
    visual: <SignalsCard />,
  },
  {
    num: "03",
    title: "Get qualified leads",
    description: "Receive a curated list of leads that match your ICP, scored and ready to engage.",
    visual: <OutreachCard />,
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
            Get started with our simple
            <br />
            3 step process
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col gap-5">
              <div className="flex-1">{step.visual}</div>
              <div className="px-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background text-[10px] font-bold shrink-0">
                    {step.num}
                  </span>
                  <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-9">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
