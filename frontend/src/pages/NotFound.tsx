import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ErrorNotFoundAnimation from "../components/animation/ErrorNotFoundAnimation";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3 items-center justify-center min-h-screen bg-muted/30 p-4">
      <ErrorNotFoundAnimation width={700} />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center gap-x-1">
          <AlertTriangle className="w-6 h-6 text-destructive" />
          <p className="text-muted-foreground">
            Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển.
          </p>
        </div>
        <Button onClick={() => navigate("/")} className="w-full">
          Quay về Trang chủ
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
