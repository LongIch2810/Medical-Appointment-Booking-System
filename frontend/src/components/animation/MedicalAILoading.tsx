import { useId } from "react";
import { Clock } from "lucide-react";

// Chữ chờ kết quả xoay vòng theo elapsed (3 giây/câu, dùng luôn bộ đếm giây
// có sẵn ở Chatbot.tsx thay vì tạo thêm 1 interval riêng).
// Dấu "..." được render riêng bằng animate-ai-dot (nhấp nháy tuần tự) nên
// các câu ở đây không tự có "..." ở cuối, tránh bị lặp dấu chấm tĩnh + động.
const LOADING_MESSAGES = [
  "Đang phân tích triệu chứng của bạn",
  "Đang xử lý dữ liệu y tế",
  "Đang tìm bác sĩ và chuyên khoa phù hợp",
  "Sắp có kết quả, bạn chờ chút nhé",
];

// Chatbot service backend chạy trên free-tier tự "ngủ" sau thời gian dài
// không ai chat, cold-start có thể mất tới ~1 phút — hiện thêm 1 dòng giải
// thích sau ngưỡng này để người dùng không tưởng nhầm là app bị treo/lỗi.
const COLD_START_HINT_THRESHOLD_SECONDS = 12;
const COLD_START_HINT =
  "Hệ thống AI có thể đang khởi động lại sau thời gian nghỉ, việc này đôi khi mất đến 1 phút";

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
    <div className="flex items-center gap-3 py-0.5">
      <div className="w-16 h-16 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
          <defs>
            <clipPath id={clipId}>
              <path d="M24 46 Q50 18 76 46 Q76 62 50 66 Q24 62 24 46 Z" />
            </clipPath>
          </defs>

          {/* Vỏ đầu — mũ phi hành gia mini */}
          <circle cx="50" cy="50" r="28" className="fill-white stroke-primary" strokeWidth="3" />
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
            <circle cx="50" cy="26" r="7" className="fill-white stroke-red-500" strokeWidth="2.2" />
            <path
              d="M50 21.6 V30.4 M45.6 26 H54.4"
              className="stroke-red-500"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-sm text-gray-700 inline-flex items-baseline">
          {message}
          <span className="inline-flex ml-0.5" aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="animate-ai-dot"
                style={{ animationDelay: `${dot * 0.2}s` }}
              >
                .
              </span>
            ))}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" aria-hidden="true" />
          {elapsed}s
        </span>
      </div>
    </div>
  );
}
