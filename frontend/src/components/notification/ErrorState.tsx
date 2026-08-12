import { AlertTriangle } from "lucide-react";
import StateCard from "./StateCard";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Đã xảy ra lỗi",
  description = "Không thể tải dữ liệu. Vui lòng thử lại.",
  onRetry,
}: ErrorStateProps) {
  return (
    <StateCard
      icon={<AlertTriangle className="w-8 h-8" />}
      title={title}
      description={description}
      actionLabel={onRetry ? "Thử lại" : undefined}
      onAction={onRetry}
      iconClassName="bg-error/10 text-error"
    />
  );
}
