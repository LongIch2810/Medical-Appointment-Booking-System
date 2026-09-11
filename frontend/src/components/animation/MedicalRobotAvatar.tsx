import { useId } from "react";

// Avatar bot "Robot AI Y tế" — SVG thuần + CSS @keyframes (xem
// frontend/src/index.css: mrx-eye-blink/mrx-cross-glow), không dùng Framer
// Motion cho component này để animation chạy hoàn toàn bằng CSS
// (off-main-thread, tối ưu hiệu năng khi hiển thị lặp lại nhiều lần trong
// lịch sử chat dài). Bố cục "chân dung nửa người" (đầu + vai + ống nghe +
// huy hiệu ngực) được vẽ trong 1 khung vuông rồi để chính khung tròn có sẵn
// của Avatar (rounded-full overflow-hidden) crop tự nhiên như ảnh đại diện
// thật — không cần tự viết clipPath riêng.
export default function MedicalRobotAvatar({
  active = false,
}: {
  active?: boolean;
}) {
  const gradId = useId();

  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id={gradId} cx="50%" cy="35%" r="75%">
          <stop offset="0%" className="[stop-color:var(--color-primary)]" stopOpacity="0.18" />
          <stop offset="100%" className="[stop-color:var(--color-primary)]" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${gradId})`} />

      {/* Vai/thân — nửa dưới, để lộ 1 phần rồi bị khung tròn Avatar crop */}
      <path
        d="M6 62 Q6 44 20 42 L44 42 Q58 44 58 62 Z"
        className="fill-white stroke-primary"
        strokeWidth="2"
      />
      <circle cx="14" cy="48" r="4" className="fill-primary" />
      <circle cx="50" cy="48" r="4" className="fill-primary" />

      {/* Ống nghe vắt từ vai qua ngực */}
      <path
        d="M13 50 Q8 58 15 62 Q20 65 25 60"
        className="stroke-primary"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="26" cy="59" r="2.6" className="fill-white stroke-primary" strokeWidth="1.6" />

      {/* Huy hiệu chữ thập y tế phát sáng — màu teal đồng bộ thương hiệu,
          luôn breathe nhẹ (dấu ấn nhận diện bắt buộc, không chỉ lúc loading) */}
      <g className="animate-mrx-cross-glow">
        <circle cx="40" cy="55" r="5" className="fill-white stroke-primary" strokeWidth="1.6" />
        <path
          d="M40 51.8 V58.2 M36.8 55 H43.2"
          className="stroke-primary"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>

      {/* Đầu — mũ phi hành gia mini, 2 tai robot tròn 2 bên. Cả khối đầu
          gật gù nhẹ (mrx-head-bob) khi active — chuyển động thật, không chỉ
          chớp mắt — pivot quanh cổ (transform-origin đặt ở đáy đầu). */}
      <g className={active ? "animate-mrx-head-bob" : ""}>
        <rect x="14" y="8" width="36" height="30" rx="14" className="fill-white stroke-primary" strokeWidth="2" />
        <circle cx="12" cy="24" r="4" className="fill-primary" />
        <circle cx="52" cy="24" r="4" className="fill-primary" />

        {/* Màn hình mặt — nền tối, mắt cười cong + miệng cười phát sáng kiểu LED */}
        <rect x="20" y="15" width="24" height="17" rx="7" className="fill-[#0B3B3D]" />
        <path
          d="M25 22 Q27.5 18.6 30 22"
          className={active ? "stroke-[#5EEAD4] animate-mrx-eye-blink" : "stroke-[#5EEAD4]"}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M34 22 Q36.5 18.6 39 22"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          className={active ? "stroke-[#5EEAD4] animate-mrx-eye-blink" : "stroke-[#5EEAD4]"}
          style={active ? { animationDelay: "0.3s" } : undefined}
        />
        <path
          d="M24 27 Q32 31.5 40 27"
          className="stroke-[#5EEAD4]"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
