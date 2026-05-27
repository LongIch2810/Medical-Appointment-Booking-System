import React, { useMemo, useState } from "react";
import {
  Activity,
  CalendarClock,
  ClipboardList,
  Eye,
  FileSearch,
  FileText,
  Microscope,
  Pill,
  Search,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatientExaminationResults } from "@/hooks/usePatientPortalApi";
import { cn } from "@/lib/utils";
import type { ExaminationResult } from "@/types/interface/patient.interface";

const getSpecialtyName = (result: ExaminationResult) =>
  result.appointment?.doctor?.specialty?.specialty_name ??
  result.appointment?.doctor?.specialty?.name ??
  "Chưa cập nhật chuyên khoa";

const getDoctorName = (result: ExaminationResult) =>
  result.appointment?.doctor?.user?.fullname ?? "Bác sĩ chưa cập nhật";

const getPatientName = (result: ExaminationResult) =>
  result.appointment?.patient?.fullname ??
  result.appointment?.patient?.user?.fullname ??
  "Bệnh nhân chưa cập nhật";

type Section = {
  key: "symptoms" | "diagnosis" | "treatment" | "prescription";
  label: string;
  icon: React.ElementType;
  iconClass: string;
  surfaceClass: string;
};

const sections: Section[] = [
  {
    key: "symptoms",
    label: "Triệu chứng",
    icon: Activity,
    iconClass: "bg-amber-100 text-amber-700",
    surfaceClass: "border-amber-100 bg-amber-50/40",
  },
  {
    key: "diagnosis",
    label: "Chẩn đoán",
    icon: Microscope,
    iconClass: "bg-sky-100 text-sky-700",
    surfaceClass: "border-sky-100 bg-sky-50/40",
  },
  {
    key: "treatment",
    label: "Hướng điều trị",
    icon: ClipboardList,
    iconClass: "bg-violet-100 text-violet-700",
    surfaceClass: "border-violet-100 bg-violet-50/40",
  },
  {
    key: "prescription",
    label: "Đơn thuốc",
    icon: Pill,
    iconClass: "bg-emerald-100 text-emerald-700",
    surfaceClass: "border-emerald-100 bg-emerald-50/40",
  },
];

const ResultSection: React.FC<{
  section: Section;
  value: string | null | undefined;
  compact?: boolean;
}> = ({ section, value, compact }) => {
  const Icon = section.icon;
  const text = value && value.trim().length > 0 ? value : "Chưa cập nhật";
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        section.surfaceClass,
        compact && "p-2.5",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            section.iconClass,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          {section.label}
        </p>
      </div>
      <p
        className={cn(
          "mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700",
          compact && "line-clamp-2",
        )}
      >
        {text}
      </p>
    </div>
  );
};

const VisitResults: React.FC = () => {
  const { data, isLoading, isError } = usePatientExaminationResults({
    page: 1,
    limit: 50,
    arrange: "desc",
  });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ExaminationResult | null>(null);

  const visitResults = useMemo<ExaminationResult[]>(
    () => data?.data.examination_results ?? [],
    [data],
  );

  const filteredResults = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return visitResults;
    return visitResults.filter((result) => {
      return [
        getDoctorName(result),
        getPatientName(result),
        getSpecialtyName(result),
        result.symptoms,
        result.diagnosis,
        result.treatment,
        result.prescription,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(keyword));
    });
  }, [search, visitResults]);

  return (
    <Card className="overflow-hidden border-primary/15 py-0">
      <CardHeader className="space-y-4 border-b border-slate-100 bg-gradient-to-r from-primary/5 via-white to-sky-50/40 px-5 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-slate-900">
                Kết quả khám sau mỗi lần khám
              </CardTitle>
              <p className="text-xs text-slate-500">
                Tổng hợp triệu chứng, chẩn đoán, hướng điều trị và đơn thuốc của
                các lần khám gần đây.
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
          >
            {visitResults.length} kết quả
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo bác sĩ, chuyên khoa, chẩn đoán..."
            className="h-10 rounded-full border-slate-200 bg-white pl-9 text-sm shadow-sm focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-5">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 text-sm text-red-600">
            Không thể tải kết quả khám.
          </div>
        ) : visitResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
            <FileSearch className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">
              Chưa có kết quả khám nào
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sau khi hoàn thành lịch khám, kết quả sẽ hiển thị tại đây.
            </p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">
              Không tìm thấy kết quả phù hợp
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Thử thay đổi từ khóa tìm kiếm khác.
            </p>
          </div>
        ) : (
          filteredResults.map((result) => {
            const doctorName = getDoctorName(result);
            const patientName = getPatientName(result);
            const specialty = getSpecialtyName(result);
            const startTime = result.appointment?.doctor_schedule?.start_time;
            const endTime = result.appointment?.doctor_schedule?.end_time;
            const appointmentDate = result.appointment?.appointment_date;

            return (
              <div
                key={result.id}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-1 gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">
                          BS. {doctorName}
                        </p>
                        <Badge
                          variant="secondary"
                          className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700"
                        >
                          {specialty}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {appointmentDate ?? result.created_at}
                        </span>
                        {startTime && endTime ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-slate-300">•</span>
                            {startTime} - {endTime}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <span className="text-slate-300">•</span>
                          <UserRound className="h-3.5 w-3.5" />
                          {patientName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0 gap-1.5 self-start rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-primary/40 hover:bg-primary/5 hover:text-primary md:self-center"
                    onClick={() => setSelected(result)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Chi tiết
                  </Button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {sections.map((section) => (
                    <ResultSection
                      key={section.key}
                      section={section}
                      value={result[section.key] as string}
                      compact
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FileText className="h-5 w-5 text-primary" />
              Chi tiết kết quả khám
            </DialogTitle>
            <DialogDescription>
              {selected
                ? `BS. ${getDoctorName(selected)} • ${getSpecialtyName(selected)}`
                : null}
            </DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-3">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Ngày khám
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                    {selected.appointment?.appointment_date ??
                      selected.created_at}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Bệnh nhân
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <UserRound className="h-3.5 w-3.5 text-slate-400" />
                    {getPatientName(selected)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Bác sĩ
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                    BS. {getDoctorName(selected)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {sections.map((section) => (
                  <ResultSection
                    key={section.key}
                    section={section}
                    value={selected[section.key] as string}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default VisitResults;
