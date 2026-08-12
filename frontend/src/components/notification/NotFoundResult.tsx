import { SearchX } from "lucide-react";
import StateCard from "./StateCard";

interface NotFoundResultProps {
  title?: string;
  description?: string;
  onReset?: () => void;
}

export default function NotFoundResult({
  title = "Không tìm thấy kết quả",
  description = "Vui lòng thử tìm kiếm với từ khóa khác hoặc đặt lại bộ lọc.",
  onReset,
}: NotFoundResultProps) {
  return (
    <StateCard
      icon={<SearchX className="w-8 h-8" />}
      title={title}
      description={description}
      actionLabel={onReset ? "Đặt lại bộ lọc" : undefined}
      onAction={onReset}
    />
  );
}
