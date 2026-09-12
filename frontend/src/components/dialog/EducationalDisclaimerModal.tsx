import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  Sparkles,
  HeartPulse,
  Mail,
  Bot,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DISCLAIMER_STORAGE_KEY = "lifehealth_educational_disclaimer_ack";
const EXPIRATION_DAYS = 7;

interface EducationalDisclaimerModalProps {
  autoOpenOnHome?: boolean;
}

const EducationalDisclaimerModal: React.FC<EducationalDisclaimerModalProps> = ({
  autoOpenOnHome = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    // Listen for custom trigger event from anywhere (e.g. Footer)
    const handleOpenEvent = () => {
      setIsOpen(true);
    };

    window.addEventListener("lifehealth:open-disclaimer", handleOpenEvent);

    // Auto-open on initial load if not dismissed
    if (autoOpenOnHome) {
      try {
        const stored = localStorage.getItem(DISCLAIMER_STORAGE_KEY);
        if (stored) {
          const { expiry } = JSON.parse(stored);
          if (new Date().getTime() > expiry) {
            // Expired
            setIsOpen(true);
          }
        } else {
          // Never seen before
          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 600);
          return () => {
            clearTimeout(timer);
            window.removeEventListener("lifehealth:open-disclaimer", handleOpenEvent);
          };
        }
      } catch {
        setIsOpen(true);
      }
    }

    return () => {
      window.removeEventListener("lifehealth:open-disclaimer", handleOpenEvent);
    };
  }, [autoOpenOnHome]);

  const handleAcknowledge = () => {
    if (dontShowAgain) {
      const expiry = new Date().getTime() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(
        DISCLAIMER_STORAGE_KEY,
        JSON.stringify({ acknowledged: true, expiry })
      );
    } else {
      localStorage.removeItem(DISCLAIMER_STORAGE_KEY);
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0 border border-slate-200/80 shadow-xl rounded-3xl bg-white dark:border-[#293548] dark:bg-[#172033]">
        {/* Header styled matching Patient Portal cards */}
        <div className="shrink-0 bg-white dark:bg-[#111827] p-6 sm:p-7 border-b border-slate-100 dark:border-[#293548] flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>

          <div className="space-y-1.5 flex-1 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning" className="rounded-xl px-2.5 py-0.5 font-bold">
                DỰ ÁN HỌC TẬP & PHI THƯƠNG MẠI
              </Badge>
              <Badge variant="info" className="rounded-xl px-2.5 py-0.5 font-medium">
                <Sparkles className="w-3 h-3 mr-1" />
                Research & Demo
              </Badge>
            </div>

            <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
              Thông báo miễn trừ trách nhiệm
            </DialogTitle>

            <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Vui lòng đọc kỹ thông tin dưới đây trước khi trải nghiệm hệ thống y tế{" "}
              <span className="font-semibold text-primary">LifeHealth</span>.
            </DialogDescription>
          </div>
        </div>

        {/* Content body - InfoTiles pattern like Patient Portal */}
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-3.5 bg-slate-50/60 dark:bg-[#0B1220]/60 scrollbar-soft">
          {/* Item 1: Non-commercial Purpose */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-primary/40 hover:shadow-2xs flex items-start gap-3.5 dark:border-[#293548] dark:bg-[#172033]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                1. Mục đích học tập, nghiên cứu & phát triển đồ án
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Nền tảng này được xây dựng <span className="font-semibold text-slate-900 dark:text-slate-100">hoàn toàn vì mục đích học thuật</span>, thực nghiệm công nghệ (NestJS, React, AI RAG, Socket.io) và hoàn thiện đồ án. Dự án <span className="font-semibold text-rose-600 dark:text-rose-400">hoàn toàn phi thương mại</span>, không kinh doanh, không có thu phí hay phát sinh bất kỳ giao dịch tiền tệ thực tế nào.
              </p>
            </div>
          </div>

          {/* Item 2: Doctor photos & hospital demo data */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-primary/40 hover:shadow-2xs flex items-start gap-3.5 dark:border-[#293548] dark:bg-[#172033]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0 mt-0.5 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                2. Hình ảnh bác sĩ & Dữ liệu cơ sở y tế
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Một số hình ảnh bác sĩ, thông tin chuyên khoa và tên bệnh viện được sử dụng nhằm mục đích <span className="font-semibold text-slate-900 dark:text-slate-100">minh họa giao diện (UI/UX Mockup)</span> và dữ liệu thử nghiệm. Website <span className="font-semibold text-slate-900 dark:text-slate-100">không đại diện</span> cho các bác sĩ/bệnh viện thực tế và không cung cấp dịch vụ khám chữa bệnh pháp lý ngoài đời thực.
              </p>
            </div>
          </div>

          {/* Item 3: AI Advice Reference */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-primary/40 hover:shadow-2xs flex items-start gap-3.5 dark:border-[#293548] dark:bg-[#172033]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0 mt-0.5 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                3. Lời khuyên sức khỏe & Trợ lý AI (MedAI)
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Mọi thông tin phản hồi từ trợ lý trí tuệ nhân tạo (MedAI, AI Health Coach) và bài viết chỉ mang tính chất <span className="font-semibold text-slate-900 dark:text-slate-100">tham khảo kỹ thuật</span>. Không được sử dụng làm căn cứ chẩn đoán, điều trị y khoa thay thế bác sĩ chuyên môn trong trường hợp cấp cứu khẩn cấp.
              </p>
            </div>
          </div>

          {/* Item 4: Copyright and take-down request */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 transition-all hover:border-emerald-300 hover:shadow-2xs flex items-start gap-3.5 dark:border-emerald-800/50 dark:bg-[#1E293B]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0 mt-0.5 dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
              <Mail className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                4. Quyền riêng tư & Yêu cầu gỡ bỏ hình ảnh
              </h4>
              <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-300 leading-relaxed">
                Nếu bạn là chủ sở hữu bản quyền hình ảnh/thông tin cá nhân và có yêu cầu chỉnh sửa hoặc gỡ bỏ khỏi dự án học tập này, vui lòng liên hệ ban phát triển qua email{" "}
                <a
                  href="mailto:support@lifehealth.vn"
                  className="font-bold underline text-emerald-800 hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  support@lifehealth.vn
                </a>{" "}
                để được xử lý ngay lập tức.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions matching Patient Portal Buttons */}
        <div className="shrink-0 p-4 sm:p-6 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-[#293548] flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-slate-600 dark:text-slate-300 select-none font-medium">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded-md border-slate-300 text-primary focus:ring-primary accent-teal-600 cursor-pointer"
            />
            <span>Không hiển thị lại thông báo này trong 7 ngày</span>
          </label>

          <Button
            onClick={handleAcknowledge}
            className="w-full sm:w-auto rounded-xl !bg-primary hover:!bg-primary/90 font-bold !text-white dark:!text-primary-foreground shadow-xs hover:shadow-md transition-all cursor-pointer h-11 px-6 text-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4.5 h-4.5 !text-white dark:!text-primary-foreground" />
            <span className="!text-white dark:!text-primary-foreground">Tôi đã hiểu & Tiếp tục trải nghiệm</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EducationalDisclaimerModal;
