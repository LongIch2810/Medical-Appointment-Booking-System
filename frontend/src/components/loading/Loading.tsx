import { Loader2 } from "lucide-react";
import MedicalAiLoading from "./MedicalAiLoading";

interface LoadingProps {
  size?: number;
  label?: string;
  className?: string;
}

const Loading = ({ size = 16, label, className }: LoadingProps) => {
  if (size > 24 || label) {
    return <MedicalAiLoading label={label} className={className} />;
  }

  return (
    <div className="flex items-center justify-center p-1">
      <Loader2 size={size} className="animate-spin text-inherit" />
    </div>
  );
};

export default Loading;
