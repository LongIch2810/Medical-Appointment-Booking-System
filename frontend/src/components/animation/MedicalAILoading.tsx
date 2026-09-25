import { useId } from "react";
import { Clock } from "lucide-react";

// Chữ chờ kết quả xoay vòng theo elapsed (3 giây/câu, dùng luôn bộ đếm giây
// có sẵn ở Chatbot.tsx thay vì tạo thêm 1 interval riêng).
// Dấu "..." được render riêng bằng animate-ai-dot (nhấp nháy tuần tự) nên
// các câu ở đây không tự có "..." ở cuối, tránh bị lặp dấu chấm tĩnh + động.
const LOADING_MESSAGES = [
  "Đang phân tích triệu chứng và câu hỏi của bạn",
  "Đang đối chiếu dữ liệu y khoa & chuyên khoa",
  "Đang tìm kiếm thông tin bác sĩ & lịch khám",
  "Đang hoàn tất câu trả lời tối ưu cho bạn",
];

// Chatbot service backend chạy trên free-tier tự "ngủ" sau thời gian dài
// không ai chat, cold-start có thể mất tới ~1 phút — hiện thêm 1 dòng giải
// thích sau ngưỡng này để người dùng không tưởng nhầm là app bị treo/lỗi.
const COLD_START_HINT_THRESHOLD_SECONDS = 12;
const COLD_START_HINT =
  "Hệ thống AI đang khởi động phiên xử lý, có thể mất thêm ít giây…";

// Hiệu ứng loading "máy y tế đang phân tích" — SVG thuần + CSS @keyframes
// (mrx-ecg-scroll/mrx-scan-sweep/mrx-cross-glow, xem frontend/src/index.css),
// không dùng Framer Motion để animation chạy hoàn toàn bằng CSS. 3 hiệu ứng
// đều contain trong vòm kính qua clipPath nên không bao giờ tràn ra ngoài
// hình đầu robot, dù wrapper kích thước cố định (w-16 h-16).
export default function MedicalAILoading({ elapsed }: { elapsed: number }) {
  const clipId = useId();
  const message =
    elapsed >= COLD_START_HINT_THRESHOLD_SECONDS
      ? COLD_START_HINT
      : LOADING_MESSAGES[Math.floor(elapsed / 3) % LOADING_MESSAGES.length];

  return (
    <div className="flex items-center gap-3.5 py-1">
      <div className="size-14 sm:size-16 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
          <defs>
            <clipPath id={clipId}>
              <path d="M24 46 Q50 18 76 46 Q76 62 50 66 Q24 62 24 46 Z" />
            </clipPath>
          </defs>

          {/* Vỏ đầu — mũ phi hành gia mini */}
          <circle cx="50" cy="50" r="28" className="fill-card dark:fill-slate-900 stroke-primary" strokeWidth="3" />
          {/* Vòm kính (visor) */}
          <path
            d="M24 46 Q50 18 76 46 Q76 62 50 66 Q24 62 24 46 Z"
            className="fill-primary/15"
          />
          <circle cx="22" cy="50" r="3" className="fill-primary/50" />
          <circle cx="78" cy="50" r="3" className="fill-primary/50" />

          {/* Hiệu ứng 1: đường ECG chạy liên tục trong vòm kính */}
          <path
            d="M30 50 L38 50 L41 42 L45 58 L48 46 L51 50 L70 50"
            pathLength={100}
            strokeDasharray="20 10"
            className="stroke-primary animate-mrx-ecg-scroll"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath={`url(#${clipId})`}
          />

          {/* Hiệu ứng 2: tia quét MRI/X-quang chạy từ đỉnh xuống đáy vòm kính */}
          <rect
            x="20"
            y="18"
            width="60"
            height="4"
            className="fill-primary/70 animate-mrx-scan-sweep"
            clipPath={`url(#${clipId})`}
          />

          {/* Hiệu ứng 3: chữ thập y tế toả sáng nhịp nhàng — "đang suy nghĩ" */}
          <g className="animate-mrx-cross-glow">
            <circle cx="50" cy="26" r="7" className="fill-card dark:fill-slate-900 stroke-rose-500" strokeWidth="2.2" />
            <path
              d="M50 21.6 V30.4 M45.6 26 H54.4"
              className="stroke-rose-500"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-foreground inline-flex items-baseline">
          {message}
          <span className="inline-flex ml-0.5" aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="animate-ai-dot font-bold text-primary"
                style={{ animationDelay: `${dot * 0.2}s` }}
              >
                .
              </span>
            ))}
          </span>
        </span>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
            <Clock className="size-3 text-primary/70" aria-hidden="true" />
            <span>{elapsed}s</span>
          </span>
          {elapsed >= COLD_START_HINT_THRESHOLD_SECONDS && (
            <span className="inline-flex items-center rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              Đang tối ưu tài nguyên
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
