import { Star } from "lucide-react";
import { useEffect, useRef } from "react";

const testimonials = [
  {
    name: "Kenny Saad",
    role: "CEO @ Vision Media",
    avatar: "https://framerusercontent.com/images/2rHJc9DRzuslWXwysrWiEmtU.jpeg",
    text: "Intentsly is solving the hardest problem in outbound: Finding high-intent leads, people who are already in the market, searching for what you offer, and ready to engage.",
  },
  {
    name: "Stuart Brent",
    role: "Founder at SaasyDB",
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
    role: "Growth Manager @Mindflow",
    avatar: "https://framerusercontent.com/images/PuKXMfLxtVLQLCgauFRxcgtVHko.jpeg",
    text: "With Intentsly we track people engaging with our competitors and it's bringing in some of our best leads. It's like having a radar for high-intent prospects.",
  },
];

const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
};

const Testimonials = () => {
  const ref = useReveal();

  return (
    <section id="testimonials" className="py-20 md:py-32 overflow-hidden bg-background">
      <div ref={ref} className="reveal-up max-w-6xl mx-auto px-6">
        <span className="section-label mb-6 block">Testimonials</span>

        <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>
          What they say about us?
        </h2>
        <p className="text-base text-muted-foreground max-w-xl mb-14 leading-relaxed">
          Here's what they shared about their experience working with our AI platform.
        </p>
      </div>

      {/* Horizontal scroll cards — Aeline style: large photo with dark overlay */}
      <div className="flex gap-6 px-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="snap-start shrink-0 w-80 md:w-96 rounded-3xl overflow-hidden relative group cursor-pointer"
            style={{ height: 480 }}
          >
            <img
              src={t.avatar}
              alt={t.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-[#C8FF00] text-[#C8FF00]" />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-4 line-clamp-3">"{t.text}"</p>
              <p className="text-xs text-white/70">– {t.name} {t.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
