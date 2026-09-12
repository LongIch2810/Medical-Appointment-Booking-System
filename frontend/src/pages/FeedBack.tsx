import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
                {t("staticPages.feedbackPageTitle")}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm text-gray-700 dark:text-slate-300">
              <p>
                {t("staticPages.feedbackIntro")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullname">{t("staticPages.feedbackFullName")}</Label>
                  <Input
                    id="fullname"
                    value={userInfo?.fullname || ""}
                    disabled
                    className="bg-gray-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <Label htmlFor="title">{t("staticPages.feedbackTitle")}</Label>
                  <Input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    placeholder={t("staticPages.feedbackTitlePlaceholder")}
                  />
                </div>

                <div>
                  <Label htmlFor="description">{t("staticPages.feedbackDesc")}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={form.description}
                    onChange={handleChange}
                    required
                    placeholder={t("staticPages.feedbackDescPlaceholder")}
                  />
                </div>

                <CardFooter className="flex flex-col gap-3 p-0">
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? t("staticPages.feedbackSending") : t("staticPages.feedbackSubmitBtn")}
                  </Button>
                  <Link
                    to="/patient/complaints"
                    className="text-center text-xs text-primary underline-offset-2 hover:underline"
                  >
                    {t("staticPages.feedbackViewHistory")}
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
