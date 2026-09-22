import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

const STATUS_MESSAGES = [
  "Đang thu thập dữ liệu hệ thống...",
  "Đang phân tích các chỉ số vận hành...",
  "Đang xác định xu hướng và biến động...",
  "Đang tổng hợp insight quản trị...",
  "Đang hoàn thiện nội dung báo cáo...",
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
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md dark:bg-slate-950/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.25 }}
        >
          <div className="mx-4 flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/95">
            {/* Status indicator / ECG animation */}
            <div className="relative flex h-24 w-24 items-center justify-center">
              {!prefersReducedMotion ? (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ai-pulse-ring rounded-full bg-primary/15" />
                  <span
                    className="absolute inline-flex h-16 w-16 animate-ai-pulse-ring rounded-full bg-primary/20"
                    style={{ animationDelay: "0.6s" }}
                  />
                </>
              ) : null}
              <div className="relative flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-sm dark:border-primary/40 dark:bg-primary/20">
                <Sparkles aria-hidden="true" className="size-7" />
              </div>
            </div>

            {/* Badge */}
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold tracking-wide text-slate-700 uppercase dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <span>Hệ thống phân tích AI</span>
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              AI đang phân tích dữ liệu doanh nghiệp
            </h2>

            <div className="mt-2 min-h-6">
              <AnimatePresence mode="wait">
                <motion.p
                  key={messageIndex}
                  className="text-sm text-slate-600 dark:text-slate-400"
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -4 }}
                  transition={{ duration: prefersReducedMotion ? 0.1 : 0.25 }}
                >
                  {STATUS_MESSAGES[messageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <span className="font-medium">Hệ thống xử lý an toàn</span>
              <span>·</span>
              <span>Dữ liệu thực tế từ cơ sở dữ liệu</span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

