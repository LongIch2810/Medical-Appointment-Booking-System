import { useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MedicalAiLoadingProps = {
  label?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  minHeight?: string;
  fullScreen?: boolean;
};

/**
 * Global Standard Medical AI ECG Loading Component for Frontend
 * Styled with the Medical AI Heartbeat ECG Pulse Ring animation.
 */
export function MedicalAiLoading({
  label = "Đang tải dữ liệu y tế...",
  description,
  size = "md",
  className,
  minHeight = "min-h-64",
  fullScreen = false,
}: MedicalAiLoadingProps) {
  const prefersReducedMotion = useReducedMotion();

  const isSmall = size === "sm";
  const isLarge = size === "lg";

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6",
        minHeight,
        className,
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center",
          isSmall ? "h-16 w-16" : isLarge ? "h-28 w-28" : "h-20 w-20",
        )}
      >
        {!prefersReducedMotion ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ai-pulse-ring rounded-full bg-primary/20" />
            <span
              className={cn(
                "absolute inline-flex animate-ai-pulse-ring rounded-full bg-primary/20",
                isSmall ? "h-12 w-12" : isLarge ? "h-20 w-20" : "h-14 w-14",
              )}
              style={{ animationDelay: "0.6s" }}
            />
          </>
        ) : null}

        <svg
          viewBox="0 0 100 100"
          className={cn(
            "relative",
            isSmall ? "h-10 w-10" : isLarge ? "h-16 w-16" : "h-12 w-12",
          )}
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            className="fill-primary stroke-primary/30"
            strokeWidth="2"
          />
          <path
            d="M18 50 L34 50 L42 33 L50 66 L58 40 L66 50 L82 50"
            pathLength={100}
            strokeDasharray="24 12"
            className={cn(
              "fill-none stroke-white",
              !prefersReducedMotion && "animate-ai-ecg-scroll",
            )}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-800 tracking-tight">
        {label}
      </p>

      {description && (
        <p className="mt-1 text-xs text-slate-500 max-w-xs">
          {description}
        </p>
      )}

      <div className="mt-2.5 flex items-center justify-center gap-1">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className={cn(
              "h-1.5 w-1.5 rounded-full bg-primary",
              !prefersReducedMotion && "animate-ai-dot",
            )}
            style={{ animationDelay: `${dot * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xs shadow-xs">
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  );
}

export default MedicalAiLoading;
