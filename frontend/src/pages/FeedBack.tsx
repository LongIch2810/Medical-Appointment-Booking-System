import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import FadeInView from "@/components/view/FadeInView";
import { useComplaint } from "@/hooks/useComplaint";
import { useUserStore } from "@/store/useUserStore";
import { Link } from "react-router-dom";

const Feedback = () => {
  const { userInfo } = useUserStore();
  const { mutate: submitComplaint, isPending } = useComplaint();

  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitComplaint(
      { title: form.title, description: form.description },
      {
        onSuccess: () => {
          setForm({ title: "", description: "" });
        },
      }
    );
  };

  return (
    <FadeInView>
      <section className="mt-16 md:mt-28">
        <div className="max-w-2xl mx-auto p-6 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary font-bold text-center">
                Góp ý & phản hồi
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm text-gray-700">
              <p>
                LifeHealth luôn mong muốn nâng cao chất lượng dịch vụ. Nếu bạn
                có ý kiến góp ý, phản hồi về trải nghiệm sử dụng, hãy để lại lời
                nhắn cho chúng tôi. Mọi góp ý đều được trân trọng!
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullname">Họ tên</Label>
                  <Input
                    id="fullname"
                    value={userInfo?.fullname || ""}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="title">Tiêu đề</Label>
                  <Input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    placeholder="Tiêu đề góp ý"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Nội dung góp ý</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={form.description}
                    onChange={handleChange}
                    required
                    placeholder="Hãy chia sẻ ý kiến của bạn..."
                  />
                </div>

                <CardFooter className="flex flex-col gap-3 p-0">
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Đang gửi..." : "Gửi góp ý"}
                  </Button>
                  <Link
                    to="/patient/complaints"
                    className="text-center text-xs text-primary underline-offset-2 hover:underline"
                  >
                    Xem lịch sử góp ý
                  </Link>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </FadeInView>
  );
};

export default Feedback;
