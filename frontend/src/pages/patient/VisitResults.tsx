import React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientExaminationResults } from "@/hooks/usePatientPortalApi";

const VisitResults: React.FC = () => {
  const { data, isLoading, isError } = usePatientExaminationResults({
    page: 1,
    limit: 50,
    arrange: "desc",
  });

  const visitResults = data?.data.examination_results ?? [];

  return (
    <Card className="border-primary/15 py-5">
      <CardHeader className="px-5">
        <CardTitle className="text-lg">Kết quả khám sau mỗi lần khám</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-5">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 p-5 text-sm text-slate-600">
            Đang tải kết quả khám...
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 p-5 text-sm text-red-600">
            Không thể tải kết quả khám.
          </div>
        ) : visitResults.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
            Chưa có kết quả khám nào.
          </div>
        ) : (
          visitResults.map((result) => (
            <div
              key={result.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {result.created_at} -{" "}
                  {result.appointment.doctor.user.fullname ??
                    "Bác sĩ chưa cập nhật"}
                </p>
                <Badge variant="secondary">
                  {result.appointment.doctor.specialty.specialty_name ??
                    result.appointment.doctor.specialty.name ??
                    "Chuyên khoa"}
                </Badge>
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-sm">
                  <span className="font-semibold text-slate-900">
                    Bệnh nhân:
                  </span>{" "}
                  <span className="text-slate-700">
                    {result.appointment.patient.fullname}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-900">
                    Triệu chứng:
                  </span>{" "}
                  <span className="text-slate-700">{result.symptoms}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-900">
                    Chẩn đoán:
                  </span>{" "}
                  <span className="text-slate-700">{result.diagnosis}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-900">
                    Hướng điều trị:
                  </span>{" "}
                  <span className="text-slate-700">{result.treatment}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-900">
                    Đơn thuốc:
                  </span>{" "}
                  <span className="text-slate-700">{result.prescription}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default VisitResults;
