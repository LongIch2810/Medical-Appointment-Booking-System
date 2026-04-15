import AIApplicationInHealthCareAnimation from "../animation/AIApplicationInHealthCareAnimation";
import ArtificialIntelligenceInHealthCareAnimation from "../animation/ArtificialIntelligenceInHealthCareAnimation";
import Title from "../title/Title";
import FadeInView from "../view/FadeInView";

const AiHealthcareAssistantSection = () => {
  return (
    <FadeInView>
      <section className="container mx-auto px-4 py-12">
        {/* Tiêu đề và mô tả */}
        <div className="text-center mb-6">
          <Title text="Chẩn đoán thông minh cùng Trí tuệ nhân tạo (AI)" />
          <p className="text-gray-500 text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
            Tại <span className="font-semibold text-[#45bba5]">LIFEHEALTH</span>
            , chúng tôi ứng dụng{" "}
            <span className="font-semibold">LangChain AI</span> để hỗ trợ quá
            trình chăm sóc sức khỏe. <br />
            <br />
            Đối với bác sĩ, hệ thống AI giúp phân tích triệu chứng và đưa ra gợi
            ý chẩn đoán tham khảo, hỗ trợ quá trình ra quyết định nhanh và chính
            xác hơn. <br />
            <br />
            Đối với bệnh nhân, nền tảng cung cấp{" "}
            <span className="font-semibold">chatbot y tế</span> tư vấn sức khỏe,
            hỗ trợ <span className="font-semibold">đặt lịch khám tự động</span>{" "}
            và{" "}
            <span className="font-semibold">
              huấn luyện viên sức khỏe cá nhân
            </span>{" "}
            giúp xây dựng lộ trình ăn uống, tập luyện trong 3 hoặc 6 tháng tùy
            theo mục tiêu và hồ sơ sức khỏe của từng người.
          </p>
        </div>

        {/* Animation hiển thị trung tâm */}
        <div
          className="flex flex-col items-center justify-center gap-6 
            md:flex-row md:gap-10 
            w-full"
        >
          <AIApplicationInHealthCareAnimation />
          <ArtificialIntelligenceInHealthCareAnimation />
        </div>
      </section>
    </FadeInView>
  );
};

export default AiHealthcareAssistantSection;
