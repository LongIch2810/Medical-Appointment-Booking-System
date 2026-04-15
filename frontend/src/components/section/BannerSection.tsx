import { motion } from "framer-motion";
import FadeInView from "../view/FadeInView";
import { Button } from "../ui/button";

const BannerSection = () => {
  return (
    <FadeInView>
      <section className="relative w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[750px] xl:min-h-[850px] overflow-hidden rounded-md">
        {/* Ảnh nền full width */}
        <img
          src="/banner.png"
          alt="Banner"
          className="absolute inset-0 w-full h-full object-contain sm:object-cover object-center"
        />

        {/* Lớp phủ mờ (overlay sáng nhẹ) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-transparent"></div>

        {/* Nội dung */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center text-white min-h-[400px] sm:min-h-[500px] px-6 py-10">
          {/* Tiêu đề */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-2xl sm:text-4xl md:text-6xl font-extrabold leading-tight drop-shadow-lg"
          >
            Chăm sóc sức khỏe toàn diện <br />
            cùng <span className="text-[#45bba5]">LifeHealth</span>
          </motion.h1>

          {/* Mô tả */}
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="mt-5 text-sm sm:text-base md:text-xl max-w-2xl text-gray-100 leading-relaxed"
          >
            Đặt lịch khám nhanh chóng, nhận tư vấn thông minh, và theo dõi lộ
            trình sức khỏe của bạn — tất cả chỉ trong một nền tảng duy nhất.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            className="mt-8"
          >
            <Button>Đặt lịch khám ngay</Button>
          </motion.div>
        </div>
      </section>
    </FadeInView>
  );
};

export default BannerSection;
