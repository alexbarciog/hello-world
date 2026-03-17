const logos = [
  { url: "https://framerusercontent.com/images/bEG9VzNL7xd61r4GEyImRx2WA.png", alt: "Company 1", w: 120 },
  { url: "https://framerusercontent.com/images/jlNEv4AA5ippzmMLDsKnFsjxso.png", alt: "Company 2", w: 80 },
  { url: "https://framerusercontent.com/images/7gOzB68JbraOQDYaOhD7QE2lRk.png", alt: "Company 3", w: 110 },
  { url: "https://framerusercontent.com/images/U0VLXaReJdsK5WRqFji2WTA90.svg", alt: "Company 4", w: 90 },
  { url: "https://framerusercontent.com/images/z48WKreOCViSAoR0MwwtzGIjPE.svg", alt: "Company 5", w: 100 },
  { url: "https://framerusercontent.com/images/7mS3sTVa6kTuiTKI11jXQuurI.svg", alt: "Company 6", w: 100 },
];

const LogoMarquee = () => {
  const doubled = [...logos, ...logos];

  return (
    <section className="py-10 border-y border-border/50 overflow-hidden bg-background">
      <p className="text-center text-sm font-medium text-goji-text-muted mb-8">
        Trusted by 500+ Small Sales Teams and B2B Founders
      </p>
      <div className="relative">
        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, hsl(var(--background)), transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, hsl(var(--background)), transparent)" }} />

        <div className="animate-marquee flex items-center gap-16 px-8">
          {doubled.map((logo, i) => (
            <img
              key={i}
              src={logo.url}
              alt={logo.alt}
              className="h-8 object-contain opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 shrink-0"
              style={{ width: logo.w }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoMarquee;
