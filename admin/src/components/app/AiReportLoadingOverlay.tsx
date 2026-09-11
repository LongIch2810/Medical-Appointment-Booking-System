import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const STATUS_MESSAGES = [
  "Đang thu thập dữ liệu...",
  "Đang phân tích các chỉ số...",
  "Đang xác định xu hướng...",
  "Đang tổng hợp insight...",
  "Đang hoàn thiện báo cáo...",
];

const MESSAGE_INTERVAL_MS = 2800;

type AiReportLoadingOverlayProps = {
  isLoading: boolean;
};

/**
 * Full-page overlay hiển thị trong lúc AI xử lý báo cáo doanh nghiệp
 * (có thể mất từ vài giây đến vài phút). Đọc thẳng `mutation.isPending`
 * từ trang gọi — không cần state loading riêng.
 */
export function AiReportLoadingOverlay({
  isLoading,
}: AiReportLoadingOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading ? (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label="AI đang xử lý báo cáo"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.25 }}
        >
          <div className="relative flex h-28 w-28 items-center justify-center">
            {!prefersReducedMotion ? (
              <>
                <span className="absolute inline-flex h-full w-full animate-ai-pulse-ring rounded-full bg-accent/20" />
                <span
                  className="absolute inline-flex h-20 w-20 animate-ai-pulse-ring rounded-full bg-accent/20"
                  style={{ animationDelay: "0.6s" }}
                />
              </>
            ) : null}
            <svg viewBox="0 0 100 100" className="relative h-16 w-16">
              <circle
                cx="50"
                cy="50"
                r="46"
                className="fill-primary stroke-accent"
                strokeWidth="2"
              />
              <path
                d="M18 50 L34 50 L42 33 L50 66 L58 40 L66 50 L82 50"
                pathLength={100}
                strokeDasharray="24 12"
                className={cn(
                  "fill-none stroke-accent",
                  !prefersReducedMotion && "animate-ai-ecg-scroll",
                )}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="mt-6 text-lg font-semibold text-foreground">
            AI đang phân tích dữ liệu doanh nghiệp
          </h2>

          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              className="mt-2 text-sm text-muted-foreground"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
              transition={{ duration: prefersReducedMotion ? 0.1 : 0.35 }}
            >
              {STATUS_MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Analyzing data</span>
            <span className="flex gap-0.5">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className={cn(
                    "h-1 w-1 rounded-full bg-accent",
                    !prefersReducedMotion && "animate-ai-dot",
                  )}
                  style={{ animationDelay: `${dot * 0.2}s` }}
                />
              ))}
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
