import { AlertCircle, CalendarDays, CheckCircle2, Clock3, Stethoscope, UserRound } from "lucide-react";
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
  )
    return null;
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
      className="mt-3 max-w-xl rounded-2xl border-2 border-primary/30 bg-card p-4.5 shadow-xs transition-colors dark:border-primary/40 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarDays className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-bold text-foreground">
              Kiểm tra lịch hẹn
            </h3>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              Chờ phê duyệt
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Chưa có lịch nào được tạo. Hãy xác nhận thông tin để tiếp tục.
          </p>
        </div>
      </div>

      {summary ? (
        <div className="mt-4 rounded-xl border border-border/80 bg-muted/40 p-3 sm:p-3.5">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserRound className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Người khám
                </dt>
                <dd className="truncate text-sm font-bold text-foreground">
                  {summary.patientName}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                <Stethoscope className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Chuyên khoa
                </dt>
                <dd className="truncate text-sm font-bold text-foreground">
                  {summary.specialtyName}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                <CalendarDays className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Ngày khám
                </dt>
                <dd className="text-sm font-bold text-foreground">
                  {displayDate(summary.appointmentDate)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <Clock3 className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Thời gian
                </dt>
                <dd className="text-sm font-bold text-foreground">
                  {summary.startTime}
                  {summary.endTime ? ` – ${summary.endTime}` : ""}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-border bg-muted/60 p-3 text-sm text-muted-foreground">
          Thông tin đề xuất không đầy đủ. Hãy chỉnh sửa yêu cầu để trợ lý lập lại kế hoạch.
        </p>
      )}

      {summary?.createsRelative && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span>
            Khi xác nhận, hệ thống sẽ tạo hồ sơ người thân mới để gắn với lịch hẹn.
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          className="min-h-11 flex-1 font-bold gap-2 text-primary-foreground cursor-pointer"
          disabled={isBusy || !summary}
          onClick={() => onApprove(message.id)}
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {isBusy ? "Đang xử lý…" : "Xác nhận đặt lịch"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 flex-1 font-semibold cursor-pointer"
          disabled={isBusy}
          onClick={onEdit}
        >
          Chỉnh sửa
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          disabled={isBusy}
          onClick={() => onCancel(message.id)}
        >
          Hủy yêu cầu
        </Button>
      </div>
    </section>
  );
}


