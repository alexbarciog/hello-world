import { useState, useEffect, useRef } from "react";

const WEBSITE_TEXT = "intentsly.com";

const Frame4Animation = ({ onComplete }: { onComplete: () => void }) => {
  const [typedText, setTypedText] = useState("");
  const [phase, setPhase] = useState<"typing" | "moving" | "clicking" | "done">("typing");
  const [cursorPos, setCursorPos] = useState({ x: 420, y: 300 });
  const [buttonPressed, setButtonPressed] = useState(false);
  const charIndex = useRef(0);

  // Typing animation
  useEffect(() => {
    if (phase !== "typing") return;
    if (charIndex.current >= WEBSITE_TEXT.length) {
      setTimeout(() => setPhase("moving"), 400);
      return;
    }
    const timeout = setTimeout(() => {
      charIndex.current += 1;
      setTypedText(WEBSITE_TEXT.slice(0, charIndex.current));
    }, 80 + Math.random() * 60);
    return () => clearTimeout(timeout);
  }, [typedText, phase]);

  // Cursor movement to button
  useEffect(() => {
    if (phase !== "moving") return;
    const targetX = 640;
    const targetY = 380;
    const duration = 600;
    const startX = cursorPos.x;
    const startY = cursorPos.y;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCursorPos({
        x: startX + (targetX - startX) * ease,
        y: startY + (targetY - startY) * ease,
      });
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setPhase("clicking");
      }
    };
    requestAnimationFrame(animate);
  }, [phase]);

  // Click animation
  useEffect(() => {
    if (phase !== "clicking") return;
    setButtonPressed(true);
    const t1 = setTimeout(() => setButtonPressed(false), 150);
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase, onComplete]);

  return (
    <div className="w-full h-full flex items-center justify-center relative" style={{ backgroundColor: "#f2f1f3" }}>
      {/* Website container */}
      <div
        className="relative rounded-2xl shadow-2xl overflow-hidden"
        style={{
          width: 720,
          minHeight: 260,
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          padding: "48px 56px",
        }}
      >
        <h2
          className="text-white font-semibold mb-6"
          style={{ fontSize: 22, letterSpacing: "-0.02em" }}
        >
          Enter your website
        </h2>

        {/* Input field */}
        <div
          className="flex items-center rounded-xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            height: 56,
          }}
        >
          <div className="flex-1 px-5 flex items-center">
            <span className="text-white/40 mr-2 text-lg">🔗</span>
            <span className="text-white text-lg font-medium tracking-wide">
              {typedText}
              {phase === "typing" && (
                <span className="inline-block w-0.5 h-5 bg-white/80 ml-0.5 animate-pulse align-middle" />
              )}
            </span>
            {!typedText && phase === "typing" && (
              <span className="text-white/30 text-lg">https://yourwebsite.com</span>
            )}
          </div>
        </div>

        {/* Button */}
        <button
          className="mt-5 rounded-xl font-semibold text-white transition-transform"
          style={{
            background: buttonPressed
              ? "linear-gradient(135deg, #6c3bdb 0%, #4f46e5 100%)"
              : "linear-gradient(135deg, #7c5ce7 0%, #6366f1 100%)",
            padding: "14px 36px",
            fontSize: 17,
            transform: buttonPressed ? "scale(0.96)" : "scale(1)",
            boxShadow: buttonPressed
              ? "0 2px 12px rgba(99,102,241,0.3)"
              : "0 4px 20px rgba(99,102,241,0.4)",
          }}
        >
          ✨ Analyze with AI
        </button>
      </div>

      {/* Animated cursor */}
      <div
        className="absolute pointer-events-none z-50"
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          transition: phase === "clicking" ? "transform 0.1s" : undefined,
          transform: buttonPressed ? "scale(0.85)" : "scale(1)",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 3L19 12L12 13L9 20L5 3Z"
            fill="white"
            stroke="#333"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

const VideoShowcase = () => {
  const [frame, setFrame] = useState(1);

  return (
    <div className="w-screen h-screen overflow-hidden" style={{ backgroundColor: "#f2f1f3" }}>
      {frame === 1 && (
        <div className="w-full h-full flex items-center justify-center">
          <video
            className="w-full max-w-4xl"
            src="/videos/Search_1.mp4"
            autoPlay
            muted
            playsInline
            onEnded={() => setFrame(2)}
          />
        </div>
      )}

      {frame === 2 && (
        <video
          className="w-full h-full object-cover"
          src="/videos/Simple-text-remix.mp4"
          autoPlay
          muted
          playsInline
          onEnded={() => setFrame(3)}
        />
      )}

      {frame === 3 && (
        <video
          className="w-full h-full object-cover"
          src="/videos/Logo-5-remix.mp4"
          autoPlay
          muted
          playsInline
          onEnded={() => setFrame(4)}
        />
      )}

      {frame === 4 && (
        <Frame4Animation onComplete={() => setFrame(5)} />
      )}

      {frame === 5 && (
        <video
          className="w-full h-full object-cover"
          src="/videos/Negative-mask-effect.mp4"
          autoPlay
          muted
          playsInline
        />
      )}
    </div>
  );
};

export default VideoShowcase;
