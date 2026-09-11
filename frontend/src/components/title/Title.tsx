import type { TitleProps } from "../../types/global";

const Title = ({ text, className = "", align = "center" }: TitleProps) => {
  const alignment = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  return (
    <div className={`flex items-center gap-4 mb-6 ${alignment[align]}`}>
      {/* Left L-shape line */}
      <div className="w-6 h-6 border-l-4 border-b-4 border-primary rounded-sm"></div>

      {/* Title text */}
      <h2
        className={`text-lg md:text-2xl font-bold text-gray-800 dark:text-slate-100 ${className}`}
      >
        {text}
      </h2>

      {/* Right L-shape line (rotated) */}
      <div className="w-6 h-6 border-r-4 border-t-4 border-primary rounded-sm"></div>
    </div>
  );
};

export default Title;
