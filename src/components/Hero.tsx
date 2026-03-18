import { ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";
import HeroCards from "./HeroCards";

const platformLogos = [
  <svg key="linkedin" className="inline h-10 md:h-14 w-10 md:w-14" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  <svg key="x" className="inline h-10 md:h-14 w-10 md:w-14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  <svg key="reddit" className="inline h-10 md:h-14 w-10 md:w-14" viewBox="0 0 24 24" fill="#FF4500"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 13.38c.7 0 1.28.58 1.28 1.28 0 .7-.58 1.28-1.28 1.28-.7 0-1.28-.58-1.28-1.28 0-.7.58-1.28 1.28-1.28zm-10.02 0c.7 0 1.28.58 1.28 1.28 0 .7-.58 1.28-1.28 1.28-.7 0-1.28-.58-1.28-1.28 0-.7.58-1.28 1.28-1.28zm8.56 4.37c-.98.98-2.56 1.46-3.55 1.46-.99 0-2.57-.48-3.55-1.46a.424.424 0 0 1 .6-.6c.77.77 2.06 1.16 2.95 1.16.89 0 2.18-.39 2.95-1.16a.424.424 0 0 1 .6.6zM17.97 12c-.97 0-1.75-.44-1.75-.98 0-.27.24-.75.83-.75.97 0 1.75.43 1.75.98 0 .26-.24.75-.83.75zm-6.45-2.6c1.03 0 1.87.57 1.87 1.28 0 .71-.84 1.28-1.87 1.28-1.03 0-1.87-.57-1.87-1.28 0-.71.84-1.28 1.87-1.28zm-4.6.85c-.59 0-.83-.48-.83-.75 0-.55.78-.98 1.75-.98.59 0 .83.48.83.75 0 .55-.78.98-1.75.98zm5.08-4c2.41 0 4.37.72 4.37 1.61 0 .89-1.96 1.61-4.37 1.61-2.41 0-4.37-.72-4.37-1.61 0-.89 1.96-1.61 4.37-1.61zM19.54 9.4c1.1 0 2 .62 2 1.38 0 .76-.9 1.38-2 1.38-.26 0-.5-.04-.72-.12.53-.37.87-.87.87-1.42 0-.42-.2-.8-.53-1.1.12-.08.25-.12.38-.12zM4.46 9.4c.13 0 .26.04.38.12-.33.3-.53.68-.53 1.1 0 .55.34 1.05.87 1.42-.22.08-.46.12-.72.12-1.1 0-2-.62-2-1.38 0-.76.9-1.38 2-1.38z"/></svg>,
];

const Hero = () => {
  const [currentLogo, setCurrentLogo] = useState(0);
  const [phase, setPhase] = useState<"visible" | "exit" | "enter">("visible");

  useEffect(() => {
    const DISPLAY_TIME = 2200;
    const ANIM_TIME = 350;

    const cycle = () => {
      setPhase("exit");
      setTimeout(() => {
        setCurrentLogo((prev) => (prev + 1) % platformLogos.length);
        setPhase("enter");
        setTimeout(() => setPhase("visible"), ANIM_TIME);
      }, ANIM_TIME);
    };

    const interval = setInterval(cycle, DISPLAY_TIME + ANIM_TIME * 2);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-16">
      {/* Video background */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/videos/hero-gradient.webm"
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-7xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-light text-foreground leading-[1.1] tracking-tight mt-16 md:mt-24 mb-6 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          Find People Looking For
          <br />
          What You Offer on{" "}
          <span className="inline-flex items-center align-middle relative h-10 md:h-14 w-10 md:w-14 overflow-hidden">
            <span className="absolute inset-0 flex items-center justify-center" style={{ transition: "transform 350ms ease-in-out, opacity 350ms ease-in-out", transform: phase === "exit" ? "translateY(-100%)" : "translateY(0)", opacity: phase === "exit" ? 0 : 1 }}>
              {platformLogos[currentLogo]}
            </span>
          </span>
        </h1>

        <p className="text-lg md:text-xl text-foreground max-w-2xl mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          Our AI detects intent signals, scores prospects based on your ideal customers,
          starts relevant conversations on LinkedIn, and books more demos, on autopilot.
        </p>

        <a href="https://app.gojiberry.ai/registration" className="btn-cta text-base animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          Launch your AI Agent for free
          <ArrowUpRight className="w-4 h-4" />
        </a>

        <div className="mt-14 w-full animate-fade-in-up" style={{ animationDelay: "360ms" }}>
          <HeroCards />
        </div>
      </div>
    </section>
  );
};

export default Hero;
