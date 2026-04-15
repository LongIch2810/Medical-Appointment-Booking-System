import React, { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { usePatientPortal } from "@/pages/patient/usePatientPortal";

const HealthRecords: React.FC = () => {
  const {
    healthProfileTargets,
    selectedHealthProfileId,
    selectHealthProfile,
    selectedHealthRecord,
  } = usePatientPortal();

  const selectedTarget = useMemo(
    () =>
      healthProfileTargets.find((target) => target.id === selectedHealthProfileId),
    [healthProfileTargets, selectedHealthProfileId]
  );

  return (
    <div className="space-y-4">
      <Card className="border-primary/15 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-lg">Danh sách hồ sơ sức khỏe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-5">
          <p className="text-sm text-slate-600">
            Mặc định hiển thị hồ sơ của chủ tài khoản. Chọn người thân để xem hồ
            sơ tương ứng.
          </p>
          <div className="flex flex-wrap gap-2">
            {healthProfileTargets.map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => selectHealthProfile(target.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  target.id === selectedHealthProfileId
                    ? "border-primary bg-primary text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary"
                )}
              >
                {target.displayName} ({target.relationship})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {!selectedHealthRecord ? (
        <Card className="border-primary/15 py-5">
          <CardHeader className="px-5">
            <CardTitle className="text-lg">
              Hồ sơ sức khỏe của {selectedTarget?.displayName ?? "người thân"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Hồ sơ sức khỏe của người này chưa được cập nhật.
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="gap-2 border-primary/15 py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-sm text-slate-600">Nhóm máu</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <p className="text-xl font-extrabold text-primary">
                  {selectedHealthRecord.bloodType}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2 border-primary/15 py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-sm text-slate-600">Chiều cao</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <p className="text-xl font-extrabold text-primary">
                  {selectedHealthRecord.height}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2 border-primary/15 py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-sm text-slate-600">Cân nặng</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <p className="text-xl font-extrabold text-primary">
                  {selectedHealthRecord.weight}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2 border-primary/15 py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-sm text-slate-600">Bệnh mạn tính</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <p className="text-xl font-extrabold text-primary">
                  {selectedHealthRecord.chronicConditions.length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-primary/15 py-5">
              <CardHeader className="px-5">
                <CardTitle className="text-lg">Chỉ số sức khỏe gần đây</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-5">
                {selectedHealthRecord.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {metric.label}
                      </p>
                      <p className="text-sm text-slate-600">{metric.value}</p>
                    </div>
                    <Badge variant="secondary">{metric.trend}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-primary/15 py-5">
              <CardHeader className="px-5">
                <CardTitle className="text-lg">Thuốc đang sử dụng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-5">
                {selectedHealthRecord.medications.map((medication) => (
                  <div
                    key={medication.name}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {medication.name}
                    </p>
                    <p className="text-sm text-slate-600">
                      Liều dùng: {medication.dosage}
                    </p>
                    <p className="text-sm text-slate-600">
                      Lịch dùng: {medication.schedule}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/15 py-5">
            <CardHeader className="px-5">
              <CardTitle className="text-lg">Tiền sử và timeline sức khỏe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">Dị ứng</p>
                <div className="flex flex-wrap gap-2">
                  {selectedHealthRecord.allergies.map((allergy) => (
                    <Badge key={allergy} variant="outline">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  Bệnh nền/mạn tính
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedHealthRecord.chronicConditions.map((condition) => (
                    <Badge key={condition}>{condition}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {selectedHealthRecord.timeline.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border-l-4 border-primary bg-white p-3 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {item.date}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.event}
                    </p>
                    <p className="text-sm text-slate-600">{item.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default HealthRecords;

