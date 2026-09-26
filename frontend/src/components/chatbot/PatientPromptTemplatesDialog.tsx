import { useState } from "react";
import {
  CalendarClock,
  FileText,
  HeartPulse,
  Pencil,
  Send,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PromptTemplateGroup {
  id: string;
  category: string;
  icon: LucideIcon;
  badge: string;
  items: Array<{
    title: string;
    tag: string;
    prompt: string;
  }>;
}

const PATIENT_PROMPT_GROUPS: PromptTemplateGroup[] = [
  {
    id: "symptoms",
    category: "Tư vấn triệu chứng & Sơ cứu",
    icon: HeartPulse,
    badge: "Triệu chứng",
    items: [
      {
        title: "Sốt cao và đau mỏi người",
        tag: "Sốt & Cảm cúm",
        prompt: "Tôi bị sốt 38.5 độ từ hôm qua kèm đau đầu và mỏi cơ, cần theo dõi và xử trí tại nhà như thế nào?",
      },
      {
        title: "Dấu hiệu sốt xuất huyết",
        tag: "Truyền nhiễm",
        prompt: "Những triệu chứng sốt xuất huyết nào cần đặc biệt lưu ý và khi nào phải đến bệnh viện ngay?",
      },
      {
        title: "Đau rát dạ dày sau ăn",
        tag: "Tiêu hóa",
        prompt: "Tôi hay bị đau âm ỉ và ợ chua vùng thượng vị sau khi ăn, dấu hiệu này có cần đi khám nội soi không?",
      },
      {
        title: "Sơ cứu bỏng sinh hoạt",
        tag: "Sơ cứu ban đầu",
        prompt: "Cách sơ cứu đúng chuẩn y khoa khi bị bỏng nước sôi hoặc dầu nóng tại nhà?",
      },
    ],
  },
  {
    id: "doctors",
    category: "Tìm bác sĩ & Đặt lịch hẹn",
    icon: Stethoscope,
    badge: "Bác sĩ & Lịch hẹn",
    items: [
      {
        title: "Tìm bác sĩ theo triệu chứng",
        tag: "Chuyên khoa",
        prompt: "Tôi bị ho kéo dài 2 tuần không khỏi, tôi nên đặt lịch khám chuyên khoa nào và với bác sĩ nào?",
      },
      {
        title: "Đặt lịch khám tổng quát",
        tag: "Khám định kỳ",
        prompt: "Tôi muốn đặt lịch khám sức khỏe tổng quát vào cuối tuần này, hệ thống có những gói khám nào?",
      },
      {
        title: "Đặt lịch cho người thân",
        tag: "Hồ sơ người thân",
        prompt: "Tôi muốn đặt lịch khám tim mạch cho mẹ của tôi thì cần cung cấp những thông tin gì?",
      },
    ],
  },
  {
    id: "preparation",
    category: "Chuẩn bị xét nghiệm & Thủ tục",
    icon: CalendarClock,
    badge: "Hướng dẫn khám",
    items: [
      {
        title: "Nhịn ăn trước xét nghiệm",
        tag: "Xét nghiệm máu",
        prompt: "Trước khi đi làm xét nghiệm máu và đường huyết tổng quát, tôi cần nhịn ăn uống trong bao lâu?",
      },
      {
        title: "Chuẩn bị trước nội soi dạ dày",
        tag: "Nội soi tiêu hóa",
        prompt: "Tôi cần chuẩn bị và kiêng những thức ăn gì trước buổi khám nội soi dạ dày vào ngày mai?",
      },
      {
        title: "Giấy tờ bảo hiểm cần mang",
        tag: "Bảo hiểm Y tế",
        prompt: "Khi đến khám tại LifeHealth, tôi cần mang theo những giấy tờ tùy thân và bảo hiểm gì để được hỗ trợ?",
      },
    ],
  },
  {
    id: "wellness",
    category: "Dinh dưỡng & Phòng bệnh",
    icon: FileText,
    badge: "Chăm sóc sức khỏe",
    items: [
      {
        title: "Chế độ ăn giảm mỡ máu",
        tag: "Tim mạch",
        prompt: "Bác sĩ chẩn đoán tôi bị mỡ máu cao, xin gợi ý chế độ ăn uống và tập luyện an toàn để cải thiện.",
      },
      {
        title: "Kiểm soát đường huyết",
        tag: "Nội tiết",
        prompt: "Những lưu ý quan trọng trong bữa ăn hàng ngày để phòng ngừa và kiểm soát bệnh đái tháo đường?",
      },
    ],
  },
];

interface PatientPromptTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendPrompt: (promptText: string) => void;
  onFillPrompt: (promptText: string) => void;
  disabled?: boolean;
}

export default function PatientPromptTemplatesDialog({
  open,
  onOpenChange,
  onSendPrompt,
  onFillPrompt,
  disabled,
}: PatientPromptTemplatesDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("symptoms");

  const currentGroup =
    PATIENT_PROMPT_GROUPS.find((group) => group.id === selectedCategory) ??
    PATIENT_PROMPT_GROUPS[0];

  const handleSend = (prompt: string) => {
    onOpenChange(false);
    onSendPrompt(prompt);
  };

  const handleFill = (prompt: string) => {
    onOpenChange(false);
    onFillPrompt(prompt);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden sm:max-w-3xl">
        <DialogHeader className="border-b border-border/80 px-5 py-4 text-left">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <div>
              <DialogTitle className="font-heading text-base font-bold text-foreground">
                Gợi ý câu hỏi y tế & Hướng dẫn khám
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Chọn câu hỏi mẫu để gửi ngay hoặc đưa vào khung soạn thảo để chỉnh sửa theo tình trạng thực tế của bạn.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 border-b border-border/70 px-4 py-2 bg-muted/40 overflow-x-auto">
          {PATIENT_PROMPT_GROUPS.map((group) => {
            const Icon = group.icon;
            const isActive = group.id === selectedCategory;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedCategory(group.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span>{group.category}</span>
              </button>
            );
          })}
        </div>

        {/* Prompt Items List */}
        <ScrollArea className="max-h-[60vh] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {currentGroup.items.map((item) => (
              <div
                key={item.title}
                className="group flex flex-col justify-between rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs hover:border-primary/50 hover:bg-muted/30 transition-all"
              >
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-1">
                    <span className="rounded-md border border-primary/25 bg-primary/8 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {item.tag}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Mẫu câu hỏi</span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground line-clamp-1">{item.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                    &ldquo;{item.prompt}&rdquo;
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-[11px] font-semibold">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => handleFill(item.prompt)}
                    className="h-7 gap-1 px-2 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                    title="Đưa vào khung soạn thảo để chỉnh sửa"
                  >
                    <Pencil className="size-3" aria-hidden="true" />
                    <span>Sửa trước khi gửi</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={disabled}
                    onClick={() => handleSend(item.prompt)}
                    className="h-7 gap-1 rounded-lg bg-primary px-2.5 text-primary-foreground shadow-2xs hover:bg-primary/90 cursor-pointer"
                  >
                    <span>Gửi ngay</span>
                    <Send className="size-3" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
