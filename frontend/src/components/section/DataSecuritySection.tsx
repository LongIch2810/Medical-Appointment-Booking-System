import { ShieldCheck, FileCheck2, Users, Lock } from "lucide-react";
import FadeInView from "../view/FadeInView";

const DataSecuritySection = () => {
  const items = [
    {
      icon: <FileCheck2 className="w-10 h-10 text-white" />,
      title: "Hạ tầng đạt tiêu chuẩn",
      desc: "ISO 27001:2013",
    },
    {
      icon: <ShieldCheck className="w-10 h-10 text-white" />,
      title: "Thông tin sức khỏe được bảo mật",
      desc: "Theo quy chuẩn HIPAA",
    },
    {
      icon: <Users className="w-10 h-10 text-white" />,
      title: "Thành viên",
      desc: "VNISA (Hiệp hội An toàn thông tin Việt Nam)",
    },
    {
      icon: <Lock className="w-10 h-10 text-white" />,
      title: "Pentest định kỳ",
      desc: "Được kiểm thử bảo mật hàng năm",
    },
  ];

  return (
    <FadeInView>
      <section className="bg-white py-16 px-6">
        <div className="container mx-auto text-center">
          {/* Tiêu đề */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Bảo mật dữ liệu
          </h2>
          <p className="text-gray-500 mb-10">
            An toàn dữ liệu của bạn là ưu tiên hàng đầu của chúng tôi
          </p>

          {/* Các mục bảo mật */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center"
              >
                <div className="bg-[#45bba5] p-5 rounded-full mb-4 shadow-md">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Ghi chú cuối */}
          <p className="text-gray-500 text-sm max-w-2xl mx-auto mt-10 leading-relaxed">
            Với nhiều năm kinh nghiệm trong lĩnh vực Y tế, chúng tôi hiểu rằng
            dữ liệu sức khỏe của bạn chỉ thuộc về bạn. LIFEHEALTH tuân thủ các
            tiêu chuẩn và chính sách bảo mật dữ liệu cao nhất trên thế giới.
          </p>
        </div>
      </section>
    </FadeInView>
  );
};

export default DataSecuritySection;
