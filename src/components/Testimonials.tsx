import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Kenny Saad",
    role: "CEO @ Vision Media",
    avatar: "https://framerusercontent.com/images/2rHJc9DRzuslWXwysrWiEmtU.jpeg",
    text: "Intentsly is solving the hardest problem in outbound: Finding high-intent leads, people who are already in the market, searching for what you offer, and ready to engage.",
  },
  {
    name: "Stuart Brent",
    role: "Founder at SaasyDB (B2B SaaS)",
    avatar: "https://framerusercontent.com/images/LAvL9XyYfVUSXWW2z2f2HMek.jpeg",
    text: "We made our money back 6x already, and our week is now fully booked with leads Intentsly found for us.",
  },
  {
    name: "Frank Houbre",
    role: "Co-founder @ Lunesia",
    avatar: "https://framerusercontent.com/images/GiJdLM9mml1ig4OtoZZ90jXcUk.jpeg",
    text: "Before Intentsly, we were blasting outreach to anyone who fit our ICP. Now we only talk to the warmest leads in our market and reply rates tripled.",
  },
  {
    name: "Nathan Amram",
    role: "Growth Automation Manager @Mindflow",
    avatar: "https://framerusercontent.com/images/PuKXMfLxtVLQLCgauFRxcgtVHko.jpeg",
    text: "With Intentsly we track people engaging with our competitors and it's bringing in some of our best leads. It's like having a radar for high-intent prospects.",
  },
  {
    name: "Alessandro Paladin",
    role: "Co-Founder at KubaLabs (B2B SaaS)",
    avatar: "https://framerusercontent.com/images/AGz7vm4kKfkb2Q14ZP2eXQb6U.jpeg",
    text: "We booked 5 demos from just 30 leads found by our AI Agent. Intentsly gave us direct founder's contact info.",
  },
  {
    name: "Amin Lams",
    role: "CEO TheLams.io (Agency)",
    avatar: "https://framerusercontent.com/images/5B5Etij7d9BNNtcmUjw9IQEPLr0.jpeg",
    text: "The best part of Intentsly is predictability : every week we know we'll have a fresh batch of warm leads to work. It takes the stress out of outbound.",
  },
  {
    name: "Maxime Le Morillon",
    role: "Head of Sales (Marketing Agency)",
    avatar: "https://framerusercontent.com/images/IHtwM0cUJK03TEJxIRXI6REyS5k.jpeg",
    text: "We used to waste hours prospecting, now we get warm leads with buying intent, every morning in our inbox.",
  },
];

const TestimonialCard = ({ t }: { t: typeof testimonials[0] }) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-card w-72 shrink-0 hover:shadow-md transition-shadow">
    <div className="flex gap-0.5 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-goji-orange text-goji-orange" />
      ))}
    </div>
    <p className="text-sm text-goji-dark leading-relaxed mb-5 line-clamp-4">{t.text}</p>
    <div className="flex items-center gap-3">
      <img
        src={t.avatar}
        alt={t.name}
        className="w-9 h-9 rounded-full object-cover"
      />
      <div>
        <div className="text-xs font-bold text-goji-dark">{t.name}</div>
        <div className="text-[11px] text-goji-text-muted">{t.role}</div>
      </div>
    </div>
  </div>
);

const Testimonials = () => {
  const row1 = testimonials.slice(0, 4);
  const row2 = testimonials.slice(3);

  return (
    <section id="testimonials" className="py-24 overflow-hidden bg-background">
      <div className="max-w-6xl mx-auto px-4 mb-14 text-center">
        <span
          className="text-xs font-semibold uppercase tracking-widest mb-4 inline-block border rounded-full px-4 py-1.5"
          style={{
            color: "hsl(var(--goji-orange))",
            background: "hsl(var(--goji-orange) / 0.06)",
            borderColor: "hsl(var(--goji-orange) / 0.2)",
          }}
        >
          Testimonials
        </span>
        <p className="text-sm font-medium text-goji-text-muted mb-3 mt-4">
          Not just words, see results
        </p>
        <h2 className="text-4xl md:text-5xl font-extrabold text-goji-dark tracking-tight leading-tight">
          Trusted by 500+ small sales teams,
          <br />
          and B2B founders worldwide
        </h2>
      </div>

      {/* Row 1 — scrolling left */}
      <div className="relative mb-4">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, hsl(var(--background)), transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, hsl(var(--background)), transparent)" }} />
        <div className="animate-marquee gap-4 px-4">
          {[...row1, ...row1, ...row1].map((t, i) => (
            <div key={i} className="px-2">
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>
      </div>

      {/* Row 2 — scrolling right */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, hsl(var(--background)), transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, hsl(var(--background)), transparent)" }} />
        <div className="animate-marquee-reverse gap-4 px-4">
          {[...row2, ...row2, ...row2].map((t, i) => (
            <div key={i} className="px-2">
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
