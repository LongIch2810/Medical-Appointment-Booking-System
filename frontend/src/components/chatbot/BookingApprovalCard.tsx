import { AlertCircle, CalendarDays, Clock3, Stethoscope, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PatientChatMessage } from "@/types/interface/patientChat.interface";

interface BookingSummary {
  patientName: string;
  createsRelative: boolean;
  specialtyName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string | null;
}

interface BookingApprovalCardProps {
  message: PatientChatMessage;
  isBusy: boolean;
  onApprove: (approvalMessageId: number) => void;
  onEdit: () => void;
  onCancel: (approvalMessageId: number) => void;
}

function readSummary(payload: Record<string, unknown> | null): BookingSummary | null {
  const value = payload?.bookingSummary;
  if (!value || typeof value !== "object") return null;
  const summary = value as Partial<BookingSummary>;
  if (
    typeof summary.patientName !== "string" ||
    typeof summary.createsRelative !== "boolean" ||
    typeof summary.specialtyName !== "string" ||
    typeof summary.appointmentDate !== "string" ||
    typeof summary.startTime !== "string"
  ) return null;
  return {
    patientName: summary.patientName,
    createsRelative: summary.createsRelative,
    specialtyName: summary.specialtyName,
    appointmentDate: summary.appointmentDate,
    startTime: summary.startTime,
    endTime: typeof summary.endTime === "string" ? summary.endTime : null,
  };
}

function displayDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
}

export default function BookingApprovalCard({
  message,
  isBusy,
  onApprove,
  onEdit,
  onCancel,
}: BookingApprovalCardProps) {
  const summary = readSummary(message.payload);

  return (
    <section
      aria-label="Xác nhận thông tin đặt lịch"
      className="mt-3 max-w-xl rounded-2xl border border-primary/25 bg-card p-4 shadow-xs sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarDays className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base font-bold text-foreground">Kiểm tra lịch hẹn</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Chưa có lịch nào được tạo. Hãy xác nhận thông tin để tiếp tục.
          </p>
        </div>
      </div>

      {summary ? (
        <dl className="mt-4 grid gap-3 rounded-xl bg-muted/60 p-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <UserRound className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">Người khám</dt><dd className="font-semibold text-foreground">{summary.patientName}</dd></div>
          </div>
          <div className="flex items-start gap-2">
            <Stethoscope className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">Chuyên khoa</dt><dd className="font-semibold text-foreground">{summary.specialtyName}</dd></div>
          </div>
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">Ngày khám</dt><dd className="font-semibold text-foreground">{displayDate(summary.appointmentDate)}</dd></div>
          </div>
          <div className="flex items-start gap-2">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">Thời gian</dt><dd className="font-semibold text-foreground">{summary.startTime}{summary.endTime ? ` – ${summary.endTime}` : ""}</dd></div>
          </div>
        </dl>
      ) : (
        <p className="mt-4 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
          Thông tin đề xuất không đầy đủ. Hãy chỉnh sửa yêu cầu để trợ lý lập lại kế hoạch.
        </p>
      )}

      {summary?.createsRelative && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Khi xác nhận, hệ thống sẽ tạo hồ sơ người thân mới để gắn với lịch hẹn.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" className="min-h-11 flex-1" disabled={isBusy || !summary} onClick={() => onApprove(message.id)}>
          {isBusy ? "Đang xử lý…" : "Xác nhận đặt lịch"}
        </Button>
        <Button type="button" variant="outline" className="min-h-11 flex-1" disabled={isBusy} onClick={onEdit}>
          Chỉnh sửa
        </Button>
        <Button type="button" variant="ghost" className="min-h-11 flex-1 text-destructive hover:text-destructive" disabled={isBusy} onClick={() => onCancel(message.id)}>
          Hủy yêu cầu
        </Button>
      </div>
    </section>
  );
}

