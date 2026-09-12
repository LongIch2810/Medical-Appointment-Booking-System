interface MedAiMarkProps {
  imgClassName?: string;
  checkClassName?: string;
}

// Icon nhận diện dùng chung cho ChatHeader và nhãn AI trên mỗi tin nhắn —
// logo LifeHealth + tích xanh verified (tái sử dụng đúng SVG check đã có ở
// bản header cũ), chỉ 1 kích thước khác nhau tuỳ nơi đặt.
export default function MedAiMark({
  imgClassName = "w-9 h-9",
  checkClassName = "w-3.5 h-3.5",
}: MedAiMarkProps) {
  return (
    <span className="relative inline-flex shrink-0">
      <img
        src="/logo.jpg"
        alt="LifeHealth"
        className={`${imgClassName} rounded-xl object-cover border border-primary/20`}
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`absolute -bottom-0.5 -right-0.5 ${checkClassName} text-sky-500 bg-white dark:bg-[#172033] rounded-full`}
      >
        <path d="M22.5 12c0 5.79-4.71 10.5-10.5 10.5S1.5 17.79 1.5 12 6.21 1.5 12 1.5 22.5 6.21 22.5 12zM10.94 17.25l7.31-7.31-1.06-1.06-6.25 6.25-2.81-2.81-1.06 1.06 3.87 3.87z" />
      </svg>
    </span>
  );
}
