import { useState, useEffect } from "react";

const THINKING_STEPS = [
  "Analyzing your request",
  "Thinking",
  "Processing context",
  "Generating response",
];

export function TypingIndicator() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % THINKING_STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex flex-col gap-1 max-w-[80%] items-start">
        <div className="px-1 py-1">
          <div className="flex items-center gap-2">
            <span className="thinking-text-shimmer text-sm font-medium" key={stepIndex}>
              {THINKING_STEPS[stepIndex]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
