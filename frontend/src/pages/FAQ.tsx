import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MainLayout from "@/layouts/MainLayout";
import FadeInView from "@/components/view/FadeInView";

const FAQ = () => {
  return (
    <section className="mt-16 md:mt-28">
      <div className="max-w-3xl mx-auto p-6 mt-12 space-y-6">
        <FadeInView>
          <h1 className="text-3xl font-bold text-center text-primary">
            Câu hỏi thường gặp
          </h1>
          <p className="text-center text-gray-600 max-w-2xl mx-auto">
            LifeHealth nhận được rất nhiều câu hỏi từ người dùng. Dưới đây là
            danh sách những câu hỏi phổ biến nhất để giúp bạn giải đáp nhanh
            chóng và dễ dàng hơn.
          </p>
        </FadeInView>

        <FadeInView>
          <Accordion type="multiple" className="space-y-4 mt-4">
            <AccordionItem value="q1">
              <AccordionTrigger>LifeHealth là gì?</AccordionTrigger>
              <AccordionContent>
                LifeHealth là nền tảng đặt lịch khám bệnh trực tuyến, giúp người
                dùng kết nối với bác sĩ và bệnh viện uy tín trên toàn quốc.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q2">
              <AccordionTrigger>Làm sao để đặt lịch khám?</AccordionTrigger>
              <AccordionContent>
                Bạn chỉ cần tạo tài khoản, chọn chuyên khoa, bác sĩ hoặc bệnh
                viện mong muốn và chọn khung giờ phù hợp để đặt lịch.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q3">
              <AccordionTrigger>
                Tôi có thể hủy lịch khám không?
              </AccordionTrigger>
              <AccordionContent>
                Có, bạn có thể hủy lịch trước 2 giờ so với thời gian khám dự
                kiến bằng cách vào mục "Lịch hẹn của tôi".
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q4">
              <AccordionTrigger>LifeHealth có miễn phí không?</AccordionTrigger>
              <AccordionContent>
                Việc đăng ký tài khoản và đặt lịch là hoàn toàn miễn phí. Bạn
                chỉ thanh toán khi sử dụng dịch vụ khám hoặc tư vấn từ bác sĩ.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q5">
              <AccordionTrigger>
                Thông tin cá nhân của tôi có được bảo mật không?
              </AccordionTrigger>
              <AccordionContent>
                Có. LifeHealth tuân thủ các tiêu chuẩn bảo mật quốc tế như HIPAA
                và ISO 27001 để bảo vệ thông tin người dùng.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q6">
              <AccordionTrigger>
                Có hỗ trợ thanh toán online không?
              </AccordionTrigger>
              <AccordionContent>
                Có. LifeHealth hỗ trợ nhiều phương thức thanh toán như thẻ tín
                dụng, chuyển khoản ngân hàng, ví điện tử (Momo, ZaloPay...).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q7">
              <AccordionTrigger>
                Làm sao để xem lịch sử khám bệnh?
              </AccordionTrigger>
              <AccordionContent>
                Bạn có thể xem lại lịch sử khám bệnh trong mục "Kết quả khám"
                sau khi đăng nhập. Mục "Hồ sơ sức khỏe" chỉ lưu các thông tin
                sức khỏe bạn tự khai báo (chỉ số cơ thể, tiền sử, dị ứng...),
                không phải kết quả khám của bác sĩ.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q8">
              <AccordionTrigger>
                Tôi có thể đặt lịch giúp người thân không?
              </AccordionTrigger>
              <AccordionContent>
                Có, bạn có thể thêm hồ sơ người thân và đặt lịch khám thay trong
                cùng một tài khoản.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q9">
              <AccordionTrigger>
                LifeHealth có ứng dụng di động không?
              </AccordionTrigger>
              <AccordionContent>
                Có. Bạn có thể tải ứng dụng LifeHealth trên App Store (iOS) hoặc
                Google Play (Android).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q10">
              <AccordionTrigger>
                Làm sao để liên hệ hỗ trợ kỹ thuật?
              </AccordionTrigger>
              <AccordionContent>
                Bạn có thể liên hệ qua email{" "}
                <strong>support@lifehealth.vn</strong> hoặc gọi hotline{" "}
                <strong>0909 123 456</strong>.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </FadeInView>
      </div>
    </section>
  );
};

export default FAQ;
