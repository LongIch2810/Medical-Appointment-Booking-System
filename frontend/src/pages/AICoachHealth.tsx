import { useState } from "react";
import { motion } from "framer-motion";
import NutritionAnimation from "@/components/animation/NutritionAnimation";
import PlankAnimation from "@/components/animation/PlankAnimation";

export default function AICoachHealth() {
  const [selectedProfile, setSelectedProfile] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [completedProfile, setCompletedProfile] = useState<string | null>(null);

  const profiles = [
    {
      id: 1,
      relationship: "Bản thân",
      fullname: "Ích Trác Huy Long",
      dob: "28-10-2004",
    },
    {
      id: 2,
      relationship: "Con gái",
      fullname: "Ích Thị Thùy Linh",
      dob: "28-10-2004",
    },
    {
      id: 3,
      relationship: "Con trai",
      fullname: "Ích Thị Thùy Trang",
      dob: "28-10-2004",
    },
  ];

  const handleGenerate = () => {
    setError("");
    setPdfUrl("");

    if (!selectedProfile) {
      setError("Vui lòng chọn hồ sơ sức khỏe để AI tạo lộ trình phù hợp.");
      return;
    }

    setStatus("processing");

    setTimeout(() => {
      const random = Math.random();
      if (random < 0.85) {
        setPdfUrl(`https://lifehealth.ai/pdf/plan-${selectedProfile}.pdf`);
        setStatus("completed");
        setCompletedProfile(selectedProfile); // Đánh dấu hồ sơ đã tạo xong
      } else {
        setError("AI không thể tạo lộ trình lúc này, vui lòng thử lại sau.");
        setStatus("failed");
      }
    }, 2500);
  };

  const handleProfileChange = (value: string) => {
    setSelectedProfile(value);
    setPdfUrl("");
    setError("");
    setStatus("idle");
    setCompletedProfile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 py-12 px-4">
      <div className="max-w-5xl mx-auto text-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-700 mb-3">
            AI Health Coach
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            Huấn luyện viên sức khỏe thông minh giúp tạo lộ trình ăn uống và tập
            luyện cá nhân hóa để đạt thể trạng tốt nhất cho bạn và gia đình.
          </p>
        </motion.div>

        {/* Animations Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-10">
          <div className="flex justify-center">
            <NutritionAnimation />
          </div>
          <div className="flex justify-center">
            <PlankAnimation />
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 text-left">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Chọn hồ sơ sức khỏe
            </label>
            <select
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 bg-white text-gray-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition"
              value={selectedProfile}
              onChange={(e) => handleProfileChange(e.target.value)}
            >
              <option value="">-- Chọn hồ sơ --</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {`(${p.relationship}/${p.dob}) ${p.fullname}`}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              Huấn luyện viên thông minh{" "}
              <span className="font-semibold text-[#45bba5]">LIFEHEALTH</span>{" "}
              sẽ tự động tính toán lộ trình và phân tích dữ liệu trên hồ sơ sức
              khỏe để thiết thực và thực tế nhất, bao gồm ăn uống, tập luyện phù
              hợp.
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            <button
              onClick={handleGenerate}
              disabled={
                status === "processing" ||
                (!!completedProfile && completedProfile === selectedProfile)
              }
              className="rounded-2xl bg-emerald-500 text-white font-semibold px-6 py-3 shadow-md hover:bg-emerald-600 transition disabled:opacity-60"
            >
              {status === "processing"
                ? "AI đang tạo lộ trình..."
                : completedProfile === selectedProfile
                ? "Đã tạo lộ trình"
                : "Tạo lộ trình với AI"}
            </button>

            {status === "processing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center text-emerald-600"
              >
                <div className="loader border-4 border-emerald-300 border-t-emerald-600 rounded-full w-10 h-10 animate-spin mb-2"></div>
                <p className="text-sm font-medium">
                  Đang tính toán lộ trình tối ưu...
                </p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 text-center"
              >
                {error}
              </motion.div>
            )}

            {pdfUrl &&
              status === "completed" &&
              completedProfile === selectedProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-6 p-6 border border-emerald-100 rounded-3xl bg-emerald-50 text-center"
                >
                  <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                    Lộ trình AI đã sẵn sàng 🎉
                  </h3>
                  <p className="text-sm text-emerald-700 mb-3">
                    Đây là đường dẫn PDF báo cáo được AI tạo tự động:
                  </p>
                  <code className="block break-all rounded-xl bg-white border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
                    {pdfUrl}
                  </code>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center mt-4 rounded-2xl px-5 py-2.5 text-white font-semibold shadow-sm bg-emerald-500 hover:bg-emerald-600 transition"
                  >
                    Mở PDF
                  </a>
                </motion.div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
