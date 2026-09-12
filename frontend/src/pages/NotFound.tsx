import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  ChevronRight,
  Compass,
  FileQuestion,
  Home,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(21,154,152,0.15),_transparent_32%),linear-gradient(145deg,rgba(252,253,251,1)_0%,rgba(234,247,245,0.6)_45%,rgba(255,255,255,1)_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(44,212,209,0.12),_transparent_35%),linear-gradient(145deg,rgba(14,26,30,1)_0%,rgba(21,43,49,0.8)_50%,rgba(10,18,21,1)_100%)] px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-[-8rem] top-[-6rem] h-64 w-64 rounded-full bg-primary/15 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute bottom-[-8rem] right-[-3rem] h-64 w-64 rounded-full bg-teal-500/15 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute inset-x-0 top-20 mx-auto h-px w-[min(92%,72rem)] bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left Column */}
          <section className="space-y-6 text-left">
            <Badge className="rounded-full border-primary/25 bg-white/80 dark:bg-slate-900/80 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-primary shadow-xs backdrop-blur-sm">
              <Compass className="size-3.5 mr-1" />
              Trang không tồn tại
            </Badge>

            <div className="space-y-4">
              <p className="text-[5rem] font-black leading-none tracking-[-0.08em] text-slate-900 dark:text-slate-100 sm:text-[7rem] lg:text-[8.5rem] font-heading select-none">
                404
              </p>
              <div className="max-w-2xl space-y-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl lg:text-5xl font-heading">
                  Liên kết này có thể đã thay đổi hoặc không tồn tại.
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                  Đường dẫn bạn vừa truy cập không tìm thấy trên hệ thống LifeHealth.
                  Vui lòng kiểm tra lại địa chỉ hoặc sử dụng các phím điều hướng bên dưới để tiếp tục hành trình chăm sóc sức khỏe.
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 shadow-xs backdrop-blur-sm">
                <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Search className="size-4 text-primary" />
                  Tìm kiếm bác sĩ
                </p>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Tra cứu hơn 500+ bác sĩ chuyên khoa đầu ngành và đặt lịch khám ngay.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 shadow-xs backdrop-blur-sm">
                <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileQuestion className="size-4 text-primary" />
                  Hỏi đáp cùng MedAI
                </p>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Trò chuyện với trợ lý y tế thông minh để được định hướng triệu chứng 24/7.
                </p>
              </div>
            </div>
          </section>

          {/* Right Action Card */}
          <Card className="relative overflow-hidden border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 py-0 shadow-lg backdrop-blur-xl rounded-3xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-teal-400" />
            <CardHeader className="space-y-3 px-6 pb-0 pt-7 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex size-13 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                  <FileQuestion className="size-6" />
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary"
                >
                  Gợi ý điều hướng
                </Badge>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl font-heading">
                  Bạn muốn tìm nội dung gì?
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
                  Hãy chọn một trong các lối tắt dưới đây để trở về luồng sử dụng chính.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 px-6 py-5 sm:px-8">
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4">
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <li
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer group"
                    onClick={() => navigate("/doctors")}
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                      Danh sách bác sĩ &amp; đặt lịch khám
                    </span>
                    <ChevronRight className="size-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </li>
                  <li
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer group"
                    onClick={() => navigate("/chatbot")}
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                      Trợ lý sức khỏe MedAI 24/7
                    </span>
                    <ChevronRight className="size-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </li>
                  <li
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer group"
                    onClick={() => navigate("/news")}
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                      Tin tức &amp; kiến thức y khoa
                    </span>
                    <ChevronRight className="size-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2.5 border-t border-slate-100 dark:border-slate-800 px-6 py-5 sm:px-8">
              <Button
                className="h-11 w-full rounded-xl text-sm font-bold shadow-xs cursor-pointer"
                onClick={() => navigate("/")}
              >
                <Home className="size-4 mr-2" />
                Về trang chủ LifeHealth
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 text-sm font-bold cursor-pointer"
                onClick={handleGoBack}
              >
                <ArrowLeft className="size-4 mr-2" />
                Quay lại trang trước
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
