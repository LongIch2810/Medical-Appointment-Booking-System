import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FadeInView from "@/components/view/FadeInView";

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
      "Tham gia cập nhật phác đồ điều trị",
      "Hợp tác cùng các bộ phận khác để nâng cao chất lượng dịch vụ",
    ],
    requirements: [
      "Bằng cấp chuyên ngành y phù hợp",
      "Chứng chỉ hành nghề",
      "Kinh nghiệm thực tế tối thiểu 3 năm",
      "Kỹ năng giao tiếp tốt, tận tâm với bệnh nhân",
    ],
  },
  {
    id: 2,
    title: "Chuyên viên Tư vấn Khách hàng",
    location: "Làm việc tại văn phòng hoặc từ xa",
    type: "Toàn thời gian / Bán thời gian",
    description:
      "Tư vấn, hỗ trợ khách hàng trong quá trình sử dụng dịch vụ đặt lịch khám trên nền tảng LifeHealth.",
    responsibilities: [
      "Tiếp nhận và xử lý yêu cầu khách hàng",
      "Hỗ trợ giải đáp thắc mắc về dịch vụ",
      "Phối hợp với bộ phận kỹ thuật khi cần",
    ],
    requirements: [
      "Kỹ năng giao tiếp tốt, thân thiện",
      "Có kinh nghiệm tư vấn, chăm sóc khách hàng là lợi thế",
      "Sử dụng thành thạo các công cụ văn phòng",
    ],
  },
  {
    id: 3,
    title: "Kỹ sư Phát triển Phần mềm",
    location: "Làm việc tại văn phòng hoặc từ xa",
    type: "Toàn thời gian",
    description:
      "Phát triển và bảo trì nền tảng đặt lịch khám trực tuyến, đảm bảo hiệu năng và bảo mật hệ thống.",
    responsibilities: [
      "Thiết kế, phát triển các tính năng mới",
      "Bảo trì và tối ưu hệ thống",
      "Hợp tác cùng đội ngũ y tế để hiểu yêu cầu",
    ],
    requirements: [
      "Kinh nghiệm với React, Node.js, hoặc các công nghệ tương đương",
      "Hiểu biết về bảo mật web và cơ sở dữ liệu",
      "Khả năng làm việc nhóm và tự học tốt",
    ],
  },
];

const Careers = () => {
  return (
    <section className="mt-16 md:mt-28">
      <FadeInView>
        <h1 className="text-4xl font-extrabold text-center text-primary mb-6">
          Cơ hội nghề nghiệp tại LifeHealth
        </h1>
        <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-12">
          LifeHealth không ngừng phát triển và cần những nhân sự tận tâm, chuyên
          nghiệp để cùng nâng cao chất lượng dịch vụ y tế trực tuyến. Nếu bạn
          đam mê công nghệ và sức khỏe cộng đồng, hãy tham gia đội ngũ của chúng
          tôi!
        </p>
      </FadeInView>

      <div className="space-y-8">
        {jobOpenings.map((job) => (
          <FadeInView key={job.id}>
            <Card className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-2xl font-semibold">
                  {job.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {job.location} —{" "}
                  <span className="font-medium">{job.type}</span>
                </p>
              </CardHeader>
              <CardContent className="p-0 space-y-4 text-gray-700">
                <p>{job.description}</p>

                <div>
                  <h4 className="font-semibold mb-1">Mô tả công việc:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {job.responsibilities.map((task, idx) => (
                      <li key={idx}>{task}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">Yêu cầu:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {job.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() =>
                      alert(
                        `Cảm ơn bạn đã quan tâm vị trí "${job.title}". Vui lòng gửi CV về email: tuyendung@lifehealth.vn`
                      )
                    }
                  >
                    Ứng tuyển ngay
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FadeInView>
        ))}
      </div>
    </section>
  );
};

export default Careers;
