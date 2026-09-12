import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Linkedin } from "lucide-react";
import FadeInView from "@/components/view/FadeInView";

const teamMembers = [
  {
    name: "Dr. Nguyễn Văn Minh",
    role: "Trưởng phòng y tế",
    education: "Đại học Y Hà Nội, Thạc sĩ Nội khoa",
    certifications: ["Chứng chỉ Quản lý Y tế", "Chứng nhận An toàn Bệnh viện"],
    experience:
      "Hơn 20 năm kinh nghiệm trong lĩnh vực nội khoa, chuyên sâu về các bệnh mãn tính và quản lý chất lượng bệnh viện.",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    email: "minh.nguyen@lifehealth.vn",
    linkedin: "https://linkedin.com/in/nguyenvanminh",
  },
  {
    name: "Trần Thị Hoa",
    role: "Giám đốc sản phẩm",
    education: "Cử nhân Công nghệ Thông tin, MBA",
    certifications: ["Scrum Master", "Quản lý dự án Agile"],
    experience:
      "Dẫn dắt phát triển sản phẩm với hơn 10 năm kinh nghiệm trong ngành công nghệ y tế.",
    avatarUrl: "https://randomuser.me/api/portraits/women/65.jpg",
    email: "hoa.tran@lifehealth.vn",
    linkedin: "https://linkedin.com/in/tranthihoa",
  },
  {
    name: "Lê Quốc Dũng",
    role: "Kỹ sư phần mềm trưởng",
    education: "Cử nhân Khoa học Máy tính",
    certifications: [
      "AWS Certified Solutions Architect",
      "Chứng nhận Bảo mật CNTT",
    ],
    experience:
      "Chuyên gia phát triển hệ thống với nền tảng bảo mật cao, đảm bảo hoạt động ổn định và an toàn.",
    avatarUrl: "https://randomuser.me/api/portraits/men/45.jpg",
    email: "dung.le@lifehealth.vn",
    linkedin: "https://linkedin.com/in/lequocdung",
  },
  {
    name: "Phạm Hương Giang",
    role: "Chuyên viên hỗ trợ khách hàng",
    education: "Cử nhân Quản trị Kinh doanh",
    certifications: ["Chứng chỉ chăm sóc khách hàng"],
    experience:
      "Có kinh nghiệm tư vấn và hỗ trợ người dùng trong lĩnh vực y tế trực tuyến, luôn tận tâm và nhiệt tình.",
    avatarUrl: "https://randomuser.me/api/portraits/women/75.jpg",
    email: "giang.pham@lifehealth.vn",
    linkedin: "https://linkedin.com/in/phamhuonggiang",
  },
];

const Team = () => {
  const { t } = useTranslation();

  return (
    <section className="mt-16 md:mt-28">
      <FadeInView>
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            {t("staticPages.teamTitle")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t("staticPages.teamSubtitle")}
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed mt-4">
            {t("staticPages.teamIntro2")}
          </p>
        </div>
      </FadeInView>
      <FadeInView>
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 mt-12 px-4">
          {teamMembers.map((member, index) => (
            <Card
              key={index}
              className="p-6 flex flex-col sm:flex-row gap-5 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs hover:shadow-md transition-all duration-300"
            >
              <Avatar className="w-20 h-20 flex-shrink-0 border-2 border-primary/20 shadow-xs">
                <AvatarImage src={member.avatarUrl} alt={member.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1">
                <CardHeader className="p-0 mb-2">
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {member.name}
                  </CardTitle>
                  <p className="text-sm font-medium text-primary">
                    {member.role}
                  </p>
                </CardHeader>
                <CardContent className="p-0 text-slate-600 dark:text-slate-300 space-y-2 text-sm">
                  <p>
                    <strong className="text-slate-900 dark:text-slate-200">{t("staticPages.teamEducation")}</strong> {member.education}
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-slate-200">{t("staticPages.teamCertifications")}</strong>{" "}
                    {member.certifications.join(", ")}
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-slate-200">{t("staticPages.teamExperience")}</strong> {member.experience}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-primary font-semibold">
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-1 hover:underline"
                    >
                      <Mail size={16} /> Email
                    </a>
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:underline"
                    >
                      <Linkedin size={16} /> LinkedIn
                    </a>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </FadeInView>
    </section>
  );
};

export default Team;
