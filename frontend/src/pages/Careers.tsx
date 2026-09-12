import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FadeInView from "@/components/view/FadeInView";
import { toast } from "react-toastify";
import { Briefcase, MapPin, CheckCircle2, Send, Sparkles } from "lucide-react";

const jobOpenings = [
  {
    id: 1,
    title: "Bác sĩ chuyên khoa Nội",
    location: "Hà Nội / Hồ Chí Minh",
    type: "Toàn thời gian",
    description:
      "Chăm sóc bệnh nhân khám sức khỏe định kỳ và điều trị các bệnh nội khoa. Yêu cầu có chứng chỉ hành nghề và kinh nghiệm tối thiểu 3 năm.",
    responsibilities: [
      "Khám, tư vấn và điều trị cho bệnh nhân",
      "Tham gia cập nhật phác đồ điều trị lâm sàng",
      "Hợp tác cùng các bộ phận khác để nâng cao chất lượng dịch vụ y tế số",
    ],
    requirements: [
      "Bằng cấp chuyên ngành y khoa phù hợp",
      "Chứng chỉ hành nghề còn hiệu lực",
      "Kinh nghiệm thực tế tối thiểu 3 năm",
      "Kỹ năng giao tiếp tốt, tận tâm với bệnh nhân",
    ],
  },
  {
    id: 2,
    title: "Chuyên viên Tư vấn & CSKH Y tế",
    location: "Làm việc tại văn phòng hoặc từ xa",
    type: "Toàn thời gian / Bán thời gian",
    description:
      "Tư vấn, hỗ trợ bệnh nhân và khách hàng trong quá trình đặt lịch khám và sử dụng dịch vụ trên nền tảng LifeHealth.",
    responsibilities: [
      "Tiếp nhận và giải đáp kịp thời yêu cầu của người bệnh",
      "Hỗ trợ hướng dẫn các dịch vụ khám chuyên khoa và MedAI",
      "Phối hợp với đội ngũ hỗ trợ kỹ thuật và phòng khám đối tác",
    ],
    requirements: [
      "Kỹ năng giao tiếp tốt, thái độ nhẹ nhàng, thân thiện",
      "Ưu tiên có kinh nghiệm tư vấn trong lĩnh vực y tế / bảo hiểm",
      "Sử dụng thành thạo các công cụ tin học văn phòng",
    ],
  },
  {
    id: 3,
    title: "Kỹ sư Phát triển Phần mềm (Fullstack)",
    location: "Làm việc tại văn phòng hoặc từ xa",
    type: "Toàn thời gian",
    description:
      "Phát triển và tối ưu nền tảng y tế số LifeHealth, bảo đảm hiệu năng cao, trải nghiệm trực quan và an toàn bảo mật dữ liệu y tế.",
    responsibilities: [
      "Thiết kế, xây dựng và hoàn thiện các module giao diện người dùng",
      "Tối ưu hiệu năng, bảo mật và khả năng mở rộng hệ thống",
      "Làm việc trực tiếp cùng đội ngũ sản phẩm và cố vấn y khoa",
    ],
    requirements: [
      "Kinh nghiệm làm việc vững chắc với React, TypeScript, TailwindCSS",
      "Hiểu biết sâu sắc về bảo mật web, REST API và cấu trúc dữ liệu",
      "Tinh thần trách nhiệm cao, chủ động học hỏi công nghệ mới",
    ],
  },
];

const Careers = () => {
  const { t } = useTranslation();

  const handleApply = (title: string) => {
    toast.success(
      t("staticPages.careersApplyToast", { title }),
      { autoClose: 6000 }
    );
  };

  return (
    <section className="mt-16 md:mt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        <FadeInView>
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              {t("staticPages.careersBadge")}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {t("staticPages.careersTitle")}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed">
              {t("staticPages.careersSubtitle")}
            </p>
          </div>
        </FadeInView>

        <div className="space-y-6">
          {jobOpenings.map((job) => (
            <FadeInView key={job.id}>
              <Card className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 md:p-8 shadow-xs hover:shadow-md transition-all">
                <CardHeader className="p-0 mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {job.title}
                    </CardTitle>
                    <Badge variant="outline" className="w-fit border-primary/20 bg-primary/5 text-primary text-xs font-semibold gap-1">
                      <Briefcase className="h-3 w-3" />
                      {job.type}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{job.location}</span>
                  </div>
                </CardHeader>

                <CardContent className="p-0 space-y-5 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {job.description}
                  </p>

                  <div className="grid md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider mb-2.5">
                        {t("staticPages.careersJobDesc")}
                      </h4>
                      <ul className="space-y-2 text-xs sm:text-sm">
                        {job.responsibilities.map((task, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider mb-2.5">
                        {t("staticPages.careersJobReq")}
                      </h4>
                      <ul className="space-y-2 text-xs sm:text-sm">
                        {job.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80">
                    <p className="text-xs text-slate-400">
                      {t("staticPages.careersSendCv")}{" "}
                      <strong className="text-slate-600 dark:text-slate-300">tuyendung@lifehealth.vn</strong>
                    </p>
                    <Button
                      onClick={() => handleApply(job.title)}
                      className="gap-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{t("staticPages.careersApplyBtn")}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Careers;
