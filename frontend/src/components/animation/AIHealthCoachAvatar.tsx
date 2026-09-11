// Avatar hero cho hồ sơ "AI Coach Healthy" — SVG thuần + CSS @keyframes
// (không Framer Motion), cùng ngôn ngữ thiết kế đã dùng cho robot avatar
// Chatbot (MedicalRobotAvatar.tsx: mũ phi hành gia + màn hình mặt tối +
// mắt cười LED + ống nghe + huy hiệu chữ thập phát sáng) — phóng to tỉ lệ
// 2x vào viewBox riêng vì đây là avatar hero của trang hồ sơ (không phải
// avatar nhỏ trong bubble chat), có thêm chi tiết nền mờ ECG/DNA theo yêu
// cầu thiết kế. Kích thước cố định (wrapper w-28 h-28), không phụ thuộc
// context xung quanh.
export default function AIHealthCoachAvatar() {
  return (
    <div className="w-28 h-28 shrink-0">
      <svg viewBox="0 0 128 128" className="w-full h-full" aria-hidden="true">
        {/* Nền mờ: đường ECG */}
        <path
          d="M4 12 L20 12 L24 4 L28 20 L32 8 L36 12 L92 12 L96 4 L100 20 L104 8 L108 12 L124 12"
          className="stroke-primary"
          strokeWidth="1.5"
          fill="none"
          opacity="0.12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Nền mờ: DNA helix */}
        <g opacity="0.12" className="stroke-primary" fill="none" strokeWidth="1.3">
          <path d="M10 20 C18 26 18 34 10 40 C2 46 2 54 10 60" />
          <path d="M20 20 C12 26 12 34 20 40 C28 46 28 54 20 60" />
          <line x1="10" y1="24" x2="20" y2="24" />
          <line x1="10" y1="32" x2="20" y2="32" />
          <line x1="10" y1="40" x2="20" y2="40" />
          <line x1="10" y1="48" x2="20" y2="48" />
          <line x1="10" y1="56" x2="20" y2="56" />
        </g>

        {/* Vai/thân */}
        <path
          d="M12 124 Q12 88 40 84 L88 84 Q116 88 116 124 Z"
          className="fill-white stroke-primary"
          strokeWidth="3"
        />
        <circle cx="28" cy="96" r="8" className="fill-primary" />
        <circle cx="100" cy="96" r="8" className="fill-primary" />

        {/* Ống nghe vắt từ vai qua ngực */}
        <path
          d="M26 100 Q16 116 30 124 Q40 130 50 120"
          className="stroke-primary"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="52" cy="118" r="5.2" className="fill-white stroke-primary" strokeWidth="2.5" />

        {/* Huy hiệu chữ thập y tế phát sáng — breathe liên tục */}
        <g className="animate-mrx-cross-glow">
          <circle cx="80" cy="110" r="10" className="fill-white stroke-primary" strokeWidth="3" />
          <path
            d="M80 103.6 V116.4 M73.6 110 H86.4"
            className="stroke-primary"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Đầu — mũ phi hành gia, 2 tai robot tròn 2 bên */}
        <rect x="28" y="16" width="72" height="60" rx="28" className="fill-white stroke-primary" strokeWidth="3" />
        <circle cx="24" cy="48" r="8" className="fill-primary" />
        <circle cx="104" cy="48" r="8" className="fill-primary" />

        {/* Màn hình mặt — nền tối, mắt cười cong + miệng cười phát sáng kiểu LED */}
        <rect x="40" y="30" width="48" height="34" rx="14" className="fill-[#0B3B3D]" />
        <path
          d="M50 44 Q55 37.2 60 44"
          className="stroke-[#5EEAD4]"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M68 44 Q73 37.2 78 44"
          className="stroke-[#5EEAD4]"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M48 54 Q64 63 80 54"
          className="stroke-[#5EEAD4]"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
