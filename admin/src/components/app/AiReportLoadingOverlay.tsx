import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Database, Lock, Sparkles } from "lucide-react";

type AiReportLoadingOverlayProps = {
  isLoading: boolean;
};

/**
 * Overlay hiển thị trong lúc hệ thống truy vấn và tạo báo cáo.
 * Khóa toàn bộ thao tác để tránh gửi trùng lặp, thể hiện trạng thái
 * xử lý trung thực (không giả lập các bước backend không cung cấp).
 */
export function AiReportLoadingOverlay({
  isLoading,
}: AiReportLoadingOverlayProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isLoading ? (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label="Hệ thống đang truy vấn và tạo báo cáo"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm dark:bg-slate-950/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
        >
          <div className="mx-4 flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {/* Visual Icon / Motion */}
            <div className="relative flex h-20 w-20 items-center justify-center">
              {!prefersReducedMotion ? (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/10 opacity-75" />
                  <span className="absolute inline-flex h-14 w-14 animate-pulse rounded-full bg-primary/15" />
                </>
              ) : null}
              <div className="relative flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-xs dark:border-primary/40 dark:bg-primary/20">
                <Sparkles aria-hidden="true" className="size-6 text-primary" />
              </div>
            </div>

            {/* Badge */}
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary dark:border-primary/30 dark:bg-primary/15">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span>Đang xử lý yêu cầu</span>
            </div>

            <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
              Đang truy vấn dữ liệu & tổng hợp báo cáo
            </h2>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Hệ thống đang thực hiện truy vấn an toàn trên cơ sở dữ liệu vận
              hành. Quá trình có thể mất từ vài giây đến một phút tùy khối lượng
              dữ liệu.
            </p>

            <div className="mt-5 flex w-full items-center justify-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-800/80 dark:bg-slate-800/40 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="size-3 text-slate-400" aria-hidden="true" />
                Khóa thao tác trùng lặp
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Database
                  className="size-3 text-slate-400"
                  aria-hidden="true"
                />
                Dữ liệu thực tế
              </span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
