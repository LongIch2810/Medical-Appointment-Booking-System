import { useId } from "react";

// Chữ chờ kết quả xoay vòng theo elapsed (3 giây/câu), dùng cho cả lúc
// "đang tạo hồ sơ" (API create) lẫn lúc "AI đang phân tích" (mock generate
// plan) trên trang AICoachHealth.tsx — cùng 1 component cho nhất quán hình
// ảnh, đúng yêu cầu "thay thế các component loading cũ".
const LOADING_MESSAGES = [
  "Đang phân tích mục tiêu sức khỏe...",
  "Đang tạo hồ sơ huấn luyện viên...",
  "Đang cá nhân hoá lộ trình...",
  "Sắp xong rồi...",
];

// Hiệu ứng loading riêng cho AI Coach — SVG thuần + CSS @keyframes (không
// Framer Motion), cùng phong cách "màn hình mặt tối + mắt cười LED" với
// AIHealthCoachAvatar.tsx. 3 hiệu ứng: (1) ECG chạy trong màn hình ngực,
// tái dùng animate-mrx-ecg-scroll; (2) các điểm dữ liệu + icon DNA nhỏ
// xoay quanh đầu (Data Orbiting, keyframe mrx-orbit mới); (3) chữ thập y
// tế toả sáng nhịp nhàng, tái dùng animate-mrx-cross-glow. Kích thước cố
// định (wrapper w-16 h-16) để không tràn/vỡ layout bubble/khối cha.
export default function HealthAILoading({ elapsed }: { elapsed: number }) {
  const clipId = useId();
  const message =
    LOADING_MESSAGES[Math.floor(elapsed / 3) % LOADING_MESSAGES.length];

  return (
    <div className="flex items-center gap-3 py-0.5">
      <div className="w-16 h-16 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
          <defs>
            <clipPath id={clipId}>
              <rect x="32" y="24" width="36" height="26" rx="11" />
            </clipPath>
          </defs>

          {/* Data Orbiting — chấm dữ liệu + icon DNA nhỏ xoay quanh đầu */}
          <g
            className="animate-mrx-orbit"
            style={{ transformOrigin: "50px 36px" }}
            opacity="0.85"
          >
            <circle cx="50" cy="4" r="2.2" className="fill-primary" />
            <circle cx="86" cy="36" r="2" className="fill-primary/70" />
            <g transform="translate(14 36)" className="stroke-primary" strokeWidth="1" fill="none">
              <path d="M-2 -6 C2 -3 2 3 -2 6" />
              <path d="M2 -6 C-2 -3 -2 3 2 6" />
            </g>
          </g>

          {/* Đầu — mũ phi hành gia, 2 tai robot tròn 2 bên */}
          <rect x="22" y="12" width="56" height="48" rx="22" className="fill-white stroke-primary" strokeWidth="3" />
          <circle cx="18" cy="38" r="6.5" className="fill-primary" />
          <circle cx="82" cy="38" r="6.5" className="fill-primary" />

          {/* Màn hình mặt — nền tối, mắt cười cong + miệng cười LED */}
          <rect x="32" y="24" width="36" height="26" rx="11" className="fill-[#0B3B3D]" />
          <path d="M39 34 Q43 28.5 47 34" className="stroke-[#5EEAD4]" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M53 34 Q57 28.5 61 34" className="stroke-[#5EEAD4]" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M37 42 Q50 48 63 42" className="stroke-[#5EEAD4]" strokeWidth="1.8" fill="none" strokeLinecap="round" />

          {/* Hiệu ứng 1: ECG chạy liên tục trong màn hình ngực */}
          <path
            d="M32 44 L38 44 L40 39 L43 49 L45 41 L47 44 L62 44"
            pathLength={100}
            strokeDasharray="20 10"
            className="stroke-[#5EEAD4] animate-mrx-ecg-scroll"
            fill="none"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath={`url(#${clipId})`}
          />

          {/* Cổ nối xuống huy hiệu ngực */}
          <rect x="44" y="58" width="12" height="8" className="fill-white stroke-primary" strokeWidth="2" />

          {/* Hiệu ứng 3: chữ thập y tế trên ngực toả sáng nhịp nhàng */}
          <g className="animate-mrx-cross-glow">
            <circle cx="50" cy="76" r="9" className="fill-white stroke-primary" strokeWidth="2.6" />
            <path
              d="M50 71 V81 M45 76 H55"
              className="stroke-primary"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-sm text-gray-700">{message}</span>
        <span className="text-xs text-gray-400">{elapsed}s</span>
      </div>
    </div>
  );
}
