import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FadeInView from "@/components/view/FadeInView";
import { HelpCircle, Mail, Phone } from "lucide-react";

const FAQ = () => {
  return (
    <section className="mt-16 md:mt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <FadeInView>
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <HelpCircle className="w-3.5 h-3.5" />
              Trung tâm trợ giúp
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Câu hỏi thường gặp
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Dưới đây là danh sách những câu hỏi phổ biến nhất giúp bạn nắm rõ quy trình đặt khám và sử dụng LifeHealth nhanh chóng, dễ dàng.
            </p>
          </div>
        </FadeInView>

        <FadeInView>
          <Accordion type="multiple" className="space-y-3 mt-4">
            <AccordionItem
              value="q1"
              className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm px-5 transition-colors"
            >
              <AccordionTrigger className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 hover:no-underline py-4">
                LifeHealth là gì?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                LifeHealth là nền tảng đặt lịch khám bệnh trực tuyến, giúp người dùng kết nối với bác sĩ và bệnh viện uy tín trên toàn quốc chỉ qua vài bước chạm.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="q2"
              className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm px-5 transition-colors"
            >
              <AccordionTrigger className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 hover:no-underline py-4">
                Làm sao để đặt lịch khám?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                Bạn chỉ cần tạo tài khoản, chọn chuyên khoa, bác sĩ hoặc cơ sở y tế mong muốn và chọn khung giờ phù hợp để hoàn tất đặt lịch.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="q3"
              className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm px-5 transition-colors"
            >
              <AccordionTrigger className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 hover:no-underline py-4">
                Tôi có thể hủy lịch khám không?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                Có, bạn có thể hủy lịch trước tối thiểu 2 giờ so với giờ khám dự kiến trong mục "Lịch hẹn của tôi" mà không phát sinh thêm chi phí.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="q4"
              className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm px-5 transition-colors"
            >
              <AccordionTrigger className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 hover:no-underline py-4">
                LifeHealth có miễn phí không?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                Việc đăng ký tài khoản và tìm kiếm bác sĩ là hoàn toàn miễn phí. Bạn chỉ thanh toán đúng mức phí dịch vụ khám bệnh theo quy định niêm yết của bác sĩ/phòng khám.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="q5"
              className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm px-5 transition-colors"
            >
              <AccordionTrigger className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 hover:no-underline py-4">
                Thông tin cá nhân của tôi có được bảo mật không?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                Có. LifeHealth tuân thủ các tiêu chuẩn bảo mật y tế nghiêm ngặt như HIPAA và chứng nhận bảo mật thông tin ISO 27001 để đảm bảo hồ sơ của bạn an toàn tuyệt đối.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="q6"
              className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm px-5 transition-colors"
            >
              <AccordionTrigger className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 hover:no-underline py-4">
                Có hỗ trợ thanh toán trực tuyến không?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                Có. Nền tảng hỗ trợ thanh toán an toàn qua cổng VNPay, chuyển khoản ngân hàng (VietQR) và các ví điện tử thông dụng.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="q7"
              className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm px-5 transition-colors"
            >
              <AccordionTrigger className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 hover:no-underline py-4">
                Làm sao để xem lịch sử khám bệnh?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                Bạn có thể xem chi tiết chẩn đoán và đơn thuốc trong mục "Kết quả khám". Mục "Hồ sơ sức khỏe" lưu trữ các chỉ số cơ thể, tiền sử bệnh án và dị ứng mà bạn tự cập nhật.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="q8"
              className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm px-5 transition-colors"
            >
              <AccordionTrigger className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 hover:no-underline py-4">
                Tôi có thể đặt lịch giúp người thân không?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                Hoàn toàn được. Bạn có thể thêm hồ sơ người thân trong mục "Hồ sơ người thân" và chọn đúng người được khám khi tiến hành đặt lịch.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="q9"
              className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm px-5 transition-colors"
            >
              <AccordionTrigger className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 hover:no-underline py-4">
                Làm sao để liên hệ hỗ trợ kỹ thuật?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                <div className="flex flex-wrap gap-4 pt-1">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Mail className="w-4 h-4 text-primary" />
                    <span>support@lifehealth.vn</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-primary" />
                    <span>0909 123 456</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </FadeInView>
      </div>
    </section>
  );
};

export default FAQ;
