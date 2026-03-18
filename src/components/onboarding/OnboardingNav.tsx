import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

type Props = {
  onPrev?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  isLast?: boolean;
};

export const OnboardingNav = ({
  onPrev,
  onNext,
  nextLabel = "Next Step",
  nextDisabled = false,
  loading = false,
  isLast = false,
}: Props) => (
  <div className="flex items-center justify-between border-t border-border pt-5 mt-6">
    {onPrev ? (
      <button
        type="button"
        onClick={onPrev}
        className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Previous
      </button>
    ) : (
      <div />
    )}

    <button
      type="button"
      onClick={onNext}
      disabled={nextDisabled || loading}
      className="btn-cta h-11 px-8 text-sm disabled:opacity-40 disabled:pointer-events-none"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating…
        </span>
      ) : (
        <>
          {isLast ? "Launch Campaign" : nextLabel}
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  </div>
);
