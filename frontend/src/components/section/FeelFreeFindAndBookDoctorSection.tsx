import FeatureItem from "../item/FeatureItem";
import Line from "../line/Line";
import Title from "../title/Title";
import FadeInView from "../view/FadeInView";

const FeelFreeFindAndBookDoctorSection = () => {
  return (
    <FadeInView>
      <section className="container mx-auto px-4 py-12">
        {/* Tiêu đề & mô tả */}
        <div className="text-center mb-6">
          <Title text="An tâm tìm và đặt bác sĩ" />
          <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto">
            Hơn 600 bác sĩ liên kết chính thức với Lifheora.
          </p>
        </div>

        {/* Nội dung chính */}
        <div className="flex flex-col md:flex-row mt-10 gap-6">
          {/* Hình ảnh */}
          <div className="md:w-3/4 w-full h-60 md:h-auto">
            <img
              src="https://youmed.vn/dat-kham/assets/img/booking/png/Doctor/Feature1.webp"
              alt="Đặt bác sĩ dễ dàng"
              width={400}
              height={400}
              className="w-full h-full object-cover rounded-xl shadow-lg"
            />
          </div>

          {/* Nội dung mô tả */}
          <div className="flex flex-col justify-between md:pl-6">
            <FeatureItem
              title="Đội ngũ bác sĩ"
              description="Tất cả các bác sĩ đều có liên kết chính thức với YouMed để bảo đảm lịch đặt khám của bạn được xác nhận."
              className="md:flex-1"
            />
            <Line />
            <FeatureItem
              className="md:flex-1"
              title="Đặt khám dễ dàng, nhanh chóng, chủ động"
              description="Chỉ với 1 phút, bạn có thể đặt khám thành công với bác sĩ. Phiếu khám bao gồm số thứ tự và khung thời gian dự kiến."
            />
          </div>
        </div>
      </section>
    </FadeInView>
  );
};

export default FeelFreeFindAndBookDoctorSection;
