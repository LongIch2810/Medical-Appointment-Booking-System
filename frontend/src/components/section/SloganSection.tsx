import { Typewriter } from "react-simple-typewriter";
import FadeInView from "../view/FadeInView";

const SloganSection = () => {
  return (
    <FadeInView>
      <section className="flex flex-col items-center justify-center text-center px-4 sm:px-6 md:px-10 py-10 sm:py-14 md:py-20">
        {/* Tiêu đề chính */}
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-gray-800 leading-snug mb-3 sm:mb-4 md:mb-6">
          <span className="text-[#45bba5]">LifeHealth</span>{" "}
          <span className="text-gray-800">
            — Nền tảng chăm sóc sức khỏe thông minh
          </span>
        </h2>

        {/* Hiệu ứng Typewriter */}
        <p className="text-gray-600 text-base sm:text-lg md:text-2xl font-medium max-w-[90%] sm:max-w-xl md:max-w-3xl leading-relaxed">
          <Typewriter
            words={[
              "Đặt lịch nhanh – Khám khỏe mạnh",
              "Chủ động hẹn khám – An tâm sức khỏe",
              "Công nghệ y tế thông minh – Chăm sóc tận tâm",
            ]}
            loop
            cursor
            cursorStyle="|"
            typeSpeed={70}
            deleteSpeed={50}
            delaySpeed={1500}
          />
        </p>

        {/* Đường line trang trí */}
        <div className="w-16 sm:w-20 md:w-24 h-1 bg-[#45bba5] rounded-full mt-6 sm:mt-8"></div>
      </section>
    </FadeInView>
  );
};

export default SloganSection;
