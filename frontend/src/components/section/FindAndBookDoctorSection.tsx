import DoctorAnimation from "../animation/DoctorAnimation";
import FindADoctorAnimation from "../animation/FindADoctorAnimation";
import Title from "../title/Title";
import FadeInView from "../view/FadeInView";

const FindAndBookDoctorSection = () => {
  return (
    <FadeInView>
      <section className="container mx-auto px-4 py-12">
        {/* Tiêu đề */}
        <div className="text-center mb-6">
          <Title text="Tìm và đặt lịch khám nhanh chóng cùng bác sĩ uy tín" />
          <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Với <span className="font-semibold text-[#45bba5]">LIFEHEALTH</span>
            , việc chăm sóc sức khỏe của bạn trở nên dễ dàng và thuận tiện hơn
            bao giờ hết.
            <br />
            <br />
            Chỉ trong vài bước, bạn có thể tìm kiếm bác sĩ phù hợp theo chuyên
            khoa, kinh nghiệm hoặc thời gian làm việc — và đặt lịch khám nhanh
            chóng, mọi lúc, mọi nơi.
            <br />
            <br />
            Chúng tôi giúp bạn kết nối trực tiếp với đội ngũ bác sĩ chuyên môn
            cao, luôn sẵn sàng lắng nghe và tư vấn tận tâm, để hành trình chăm
            sóc sức khỏe của bạn trở nên hiệu quả và an toàn hơn.
          </p>
        </div>

        {/* Khối animation */}
        <div
          className="
            flex flex-col items-center justify-center gap-6 
            md:flex-row md:gap-10 
            w-full
          "
        >
          <FindADoctorAnimation />
          <DoctorAnimation />
        </div>
      </section>
    </FadeInView>
  );
};

export default FindAndBookDoctorSection;
