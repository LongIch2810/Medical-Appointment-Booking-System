import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import FadeInView from "@/components/view/FadeInView";
import { FileText, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";

const Terms = () => {
  return (
    <FadeInView>
      <section className="mt-16 md:mt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <Card className="border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl md:text-2xl text-slate-900 dark:text-slate-100 font-bold tracking-tight">
                    Điều khoản thanh toán & chuyển khoản
                  </CardTitle>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Cập nhật mới nhất về quy chế giao dịch trực tuyến trên LifeHealth
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-3 text-amber-900 dark:text-amber-300">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p className="text-xs md:text-sm leading-relaxed">
                  Việc thực hiện thanh toán qua chuyển khoản hoặc cổng trực tuyến khi sử dụng dịch vụ đồng nghĩa với việc quý khách đã đọc, hiểu và hoàn toàn đồng ý với các điều khoản dưới đây.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  Quy định thực hiện giao dịch
                </h3>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Người dùng phải thực hiện chuyển khoản chính xác theo thông tin tài khoản hoặc mã VietQR do LifeHealth hiển thị tại bước xác nhận lịch.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Nội dung chuyển khoản cần ghi rõ mã cuộc hẹn (Appointment ID) để hệ thống ghi nhận đối soát tự động tức thì.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>LifeHealth không chịu trách nhiệm với các giao dịch chuyển nhầm số tài khoản hoặc sai cú pháp do người dùng nhập thủ công ngoài hướng dẫn.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Thời gian xác nhận giao dịch qua hệ thống thông thường từ 1 đến 5 phút; trong trường hợp nghẽn mạng ngân hàng có thể kéo dài tối đa 30 phút.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Sau khi chuyển khoản thành công, người dùng nên lưu lại biên lai hoặc ảnh chụp giao dịch để hỗ trợ kiểm tra khi cần thiết.</span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <p>
                  Nếu phát sinh sự cố hoặc chưa nhận được xác nhận sau 15 phút, vui lòng liên hệ bộ phận chăm sóc khách hàng qua email <strong className="text-slate-700 dark:text-slate-300">support@lifehealth.vn</strong> hoặc hotline <strong className="text-slate-700 dark:text-slate-300">0909 123 456</strong>.
                </p>
                <p>
                  LifeHealth bảo lưu quyền điều chỉnh và bổ sung các điều khoản này theo quy định pháp luật và thông báo công khai trên trang chủ.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </FadeInView>
  );
};

export default Terms;
