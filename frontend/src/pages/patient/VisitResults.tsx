import React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientPortal } from "@/pages/patient/usePatientPortal";

const VisitResults: React.FC = () => {
  const { visitResults } = usePatientPortal();

  return (
    <Card className="border-primary/15 py-5">
      <CardHeader className="px-5">
        <CardTitle className="text-lg">Kết quả khám sau mỗi lần khám</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-5">
        {visitResults.length === 0 ? (
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
                  {result.visitDate} - {result.doctorName}
                </p>
                <Badge variant="secondary">{result.specialty}</Badge>
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-sm">
                  <span className="font-semibold text-slate-900">Chẩn đoán:</span>{" "}
                  <span className="text-slate-700">{result.diagnosis}</span>
                </p>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Chỉ định/khuyến nghị:
                  </p>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-slate-700">
                    {result.recommendations.map((recommendation) => (
                      <li key={recommendation}>{recommendation}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">Đơn thuốc:</p>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-slate-700">
                    {result.prescriptions.map((prescription) => (
                      <li key={prescription}>{prescription}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm">
                  <span className="font-semibold text-slate-900">Ghi chú:</span>{" "}
                  <span className="text-slate-700">{result.note}</span>
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
