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
  Home,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Forbidden = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(18,184,134,0.18),_transparent_30%),linear-gradient(145deg,rgba(247,252,250,1)_0%,rgba(240,248,245,1)_45%,rgba(255,255,255,1)_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-6rem] h-56 w-56 rounded-full bg-primary/15 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute bottom-[-8rem] right-[-3rem] h-64 w-64 rounded-full bg-sky/20 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute inset-x-0 top-20 mx-auto h-px w-[min(92%,72rem)] bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-6 text-left">
            <Badge className="rounded-full border-primary/20 bg-white/80 px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-primary shadow-sm backdrop-blur-sm">
              <ShieldAlert className="size-3.5" />
              Access Restricted
            </Badge>

            <div className="space-y-4">
              <p className="text-[4.5rem] font-black leading-none tracking-[-0.08em] text-foreground/95 sm:text-[6.5rem] lg:text-[8rem]">
                403
              </p>
              <div className="max-w-2xl space-y-3">
                <h1 className="text-3xl font-black tracking-[-0.04em] text-foreground sm:text-5xl">
                  Khu vực này đang được giới hạn quyền truy cập.
                </h1>
                <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Tài khoản của bạn đã đăng nhập thành công, nhưng hiện không
                  có quyền mở trang này. Hãy quay về khu vực phù hợp để tiếp
                  tục sử dụng dịch vụ mà không bị gián đoạn.
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/65 p-4 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur-sm">
                <p className="font-semibold text-foreground">
                  Trường hợp thường gặp
                </p>
                <p className="mt-2">
                  Bạn đang mở một khu vực chỉ dành cho hồ sơ bệnh nhân hoặc vai
                  trò khác trong hệ thống.
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/65 p-4 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur-sm">
                <p className="font-semibold text-foreground">
                  Hướng xử lý nhanh
                </p>
                <p className="mt-2">
                  Quay lại trang trước để tiếp tục phiên làm việc hoặc trở về
                  trang chủ để chọn hành trình phù hợp.
                </p>
              </div>
            </div>
          </section>

          <Card className="relative overflow-hidden border-white/70 bg-white/75 py-0 shadow-[0_32px_120px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-sky to-primary" />
            <CardHeader className="space-y-4 px-6 pb-0 pt-8 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner shadow-primary/10">
                  <LockKeyhole className="size-7" />
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"
                >
                  Quyền truy cập
                </Badge>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">
                  Bạn không thể tiếp tục tại đây
                </CardTitle>
                <CardDescription className="text-sm leading-6 sm:text-base">
                  Hệ thống đã chặn truy cập để bảo vệ dữ liệu và giữ đúng phạm
                  vi sử dụng theo vai trò tài khoản hiện tại.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6 py-6 sm:px-8">
              <div className="rounded-2xl border border-border/70 bg-secondary/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Gợi ý tiếp theo
                </p>
                <ul className="mt-3 space-y-3 text-sm text-foreground/85">
                  <li className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 size-4 text-primary" />
                    Kiểm tra lại vai trò tài khoản nếu bạn cho rằng đây là nhầm
                    lẫn.
                  </li>
                  <li className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 size-4 text-primary" />
                    Quay lại màn hình trước để tiếp tục thao tác trong khu vực
                    được cấp quyền.
                  </li>
                  <li className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 size-4 text-primary" />
                    Dùng trang chủ để điều hướng lại đến đúng trải nghiệm dành
                    cho bạn.
                  </li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 border-t border-border/60 px-6 py-6 sm:px-8">
              <Button
                className="h-11 w-full rounded-xl text-sm font-semibold sm:text-base"
                onClick={() => navigate("/")}
              >
                <Home className="size-4.5" />
                Về trang chủ
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl border-border/70 bg-white/70 text-sm font-semibold sm:text-base"
                onClick={handleGoBack}
              >
                <ArrowLeft className="size-4.5" />
                Quay lại trang trước
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default Forbidden;
