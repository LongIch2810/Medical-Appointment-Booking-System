import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  usePatientHealthProfiles,
  useUpdatePatientHealthProfile,
} from "@/hooks/usePatientPortalApi";
import type {
  HealthProfile,
  HealthProfilePayload,
} from "@/types/interface/patient.interface";

const formatValue = (
  value: string | number | boolean | null | undefined,
  suffix: string = "",
) => {
  if (value === null || value === undefined || value === "") {
    return "Chưa cập nhật";
  }
  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }
  return `${value}${suffix}`;
};

type HealthProfileFormState = {
  weight: string;
  height: string;
  blood_type: string;
  medical_history: string;
  allergies: string;
  heart_rate: string;
  blood_pressure: string;
  glucose_level: string;
  cholesterol_level: string;
  medications: string;
  vaccinations: string;
  smoking: string;
  alcohol_consumption: string;
  exercise_frequency: string;
  last_checkup_date: string;
};

const toDateInputValue = (value: string | null | undefined) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);

  const separator = value.includes("/") ? "/" : "-";
  const parts = value.split(separator);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (year?.length === 4) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  return "";
};

const getInitialForm = (
  profile?: HealthProfile | null,
): HealthProfileFormState => ({
  weight: profile?.weight?.toString() ?? "",
  height: profile?.height?.toString() ?? "",
  blood_type: profile?.blood_type ?? "",
  medical_history: profile?.medical_history ?? "",
  allergies: profile?.allergies ?? "",
  heart_rate: profile?.heart_rate?.toString() ?? "",
  blood_pressure: profile?.blood_pressure ?? "",
  glucose_level: profile?.glucose_level?.toString() ?? "",
  cholesterol_level: profile?.cholesterol_level?.toString() ?? "",
  medications: profile?.medications ?? "",
  vaccinations: profile?.vaccinations ?? "",
  smoking:
    profile?.smoking === null || profile?.smoking === undefined
      ? ""
      : String(profile.smoking),
  alcohol_consumption:
    profile?.alcohol_consumption === null ||
    profile?.alcohol_consumption === undefined
      ? ""
      : String(profile.alcohol_consumption),
  exercise_frequency: profile?.exercise_frequency ?? "",
  last_checkup_date: toDateInputValue(profile?.last_checkup_date),
});

const optionalNumber = (value: string) =>
  value.trim() === "" ? undefined : Number(value);

const optionalBoolean = (value: string) =>
  value === "" ? undefined : value === "true";

const optionalString = (value: string) =>
  value.trim() === "" ? undefined : value.trim();

const HealthRecords: React.FC = () => {
  const { data, isLoading, isError } = usePatientHealthProfiles({
    page: 1,
    limit: 50,
  });
  const updateHealthProfileMutation = useUpdatePatientHealthProfile();
  const healthProfiles = data?.data.healthProfiles ?? [];
  const [selectedRelativeId, setSelectedRelativeId] = useState<number | null>(
    null,
  );
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [form, setForm] = useState<HealthProfileFormState>(getInitialForm());

  useEffect(() => {
    if (!selectedRelativeId && healthProfiles[0]?.patient.id) {
      setSelectedRelativeId(healthProfiles[0].patient.id);
    }
  }, [healthProfiles, selectedRelativeId]);

  const selectedHealthRecord = useMemo(
    () =>
      healthProfiles.find(
        (profile) => profile.patient.id === selectedRelativeId,
      ) ?? null,
    [healthProfiles, selectedRelativeId],
  );

  useEffect(() => {
    setForm(getInitialForm(selectedHealthRecord));
  }, [selectedHealthRecord]);

  const handleChange = (key: keyof HealthProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedHealthRecord) return;

    const payload: HealthProfilePayload = {
      weight: optionalNumber(form.weight),
      height: optionalNumber(form.height),
      blood_type: optionalString(form.blood_type),
      medical_history: optionalString(form.medical_history),
      allergies: optionalString(form.allergies),
      heart_rate: optionalNumber(form.heart_rate),
      blood_pressure: optionalString(form.blood_pressure),
      glucose_level: optionalNumber(form.glucose_level),
      cholesterol_level: optionalNumber(form.cholesterol_level),
      medications: optionalString(form.medications),
      vaccinations: optionalString(form.vaccinations),
      smoking: optionalBoolean(form.smoking),
      alcohol_consumption: optionalBoolean(form.alcohol_consumption),
      exercise_frequency: optionalString(form.exercise_frequency),
      last_checkup_date: optionalString(form.last_checkup_date),
    };

    updateHealthProfileMutation.mutate(
      {
        relativeId: selectedHealthRecord.patient.id,
        data: payload,
      },
      {
        onSuccess: () => {
          toast.success("Da cap nhat ho so suc khoe.");
          setIsUpdateOpen(false);
        },
        onError: () => toast.error("Khong the cap nhat ho so suc khoe."),
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/15 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-lg">Danh sách hồ sơ sức khỏe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-5">
          {isLoading ? (
            <p className="text-sm text-slate-600">Đang tải hồ sơ sức khỏe...</p>
          ) : isError ? (
            <p className="text-sm text-red-600">
              Không thể tải hồ sơ sức khỏe.
            </p>
          ) : healthProfiles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Chưa có hồ sơ sức khỏe nào.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {healthProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedRelativeId(profile.patient.id)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    profile.patient.id === selectedRelativeId
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary",
                  )}
                >
                  {profile.patient.fullname ?? "Bệnh nhân"} (
                  {profile.patient.relationship.relationship_name})
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedHealthRecord ? (
        <Card className="border-primary/15 py-5">
          <CardHeader className="px-5">
            <CardTitle className="text-lg">Hồ sơ sức khỏe</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Chọn một hồ sơ để xem chi tiết.
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-primary/15 py-5">
            <CardContent className="flex flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Ho so dang chon</p>
                <p className="text-lg font-bold text-slate-900">
                  {selectedHealthRecord.patient.fullname ?? "Benh nhan"} -{" "}
                  {selectedHealthRecord.patient.relationship.relationship_name}
                </p>
              </div>
              <Button type="button" onClick={() => setIsUpdateOpen(true)}>
                Cập nhật thông tin
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="gap-2 border-primary/15 py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-sm text-slate-600">
                  Nhóm máu
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <p className="text-xl font-extrabold text-primary">
                  {formatValue(selectedHealthRecord.blood_type)}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2 border-primary/15 py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-sm text-slate-600">
                  Chiều cao
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <p className="text-xl font-extrabold text-primary">
                  {formatValue(selectedHealthRecord.height, " cm")}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2 border-primary/15 py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-sm text-slate-600">
                  Cân nặng
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <p className="text-xl font-extrabold text-primary">
                  {formatValue(selectedHealthRecord.weight, " kg")}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-2 border-primary/15 py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="text-sm text-slate-600">
                  Khám gần nhất
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <p className="text-xl font-extrabold text-primary">
                  {formatValue(selectedHealthRecord.last_checkup_date)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-primary/15 py-5">
              <CardHeader className="px-5">
                <CardTitle className="text-lg">
                  Chỉ số sức khỏe gần đây
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-5">
                {[
                  {
                    label: "Huyết áp",
                    value: formatValue(selectedHealthRecord.blood_pressure),
                  },
                  {
                    label: "Nhịp tim",
                    value: formatValue(selectedHealthRecord.heart_rate, " bpm"),
                  },
                  {
                    label: "Đường huyết",
                    value: formatValue(
                      selectedHealthRecord.glucose_level,
                      " mg/dL",
                    ),
                  },
                  {
                    label: "Cholesterol",
                    value: formatValue(
                      selectedHealthRecord.cholesterol_level,
                      " mg/dL",
                    ),
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {metric.label}
                    </p>
                    <Badge variant="secondary">{metric.value}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-primary/15 py-5">
              <CardHeader className="px-5">
                <CardTitle className="text-lg">Thuốc và tiêm chủng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-5">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Thuốc đang sử dụng
                  </p>
                  <Textarea
                    readOnly
                    value={formatValue(selectedHealthRecord.medications)}
                    className="mt-2 min-h-20 resize-none bg-slate-50 text-sm text-slate-600"
                  />
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Vắc xin đã tiêm
                  </p>
                  <Textarea
                    readOnly
                    value={formatValue(selectedHealthRecord.vaccinations)}
                    className="mt-2 min-h-20 resize-none bg-slate-50 text-sm text-slate-600"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/15 py-5">
            <CardHeader className="px-5">
              <CardTitle className="text-lg">
                Tiền sử và thói quen sức khỏe
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-5 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">Dị ứng</p>
                <Textarea
                  readOnly
                  value={formatValue(selectedHealthRecord.allergies)}
                  className="mt-2 min-h-20 resize-none bg-slate-50 text-sm text-slate-600"
                />
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">Bệnh nền</p>
                <Textarea
                  readOnly
                  value={formatValue(selectedHealthRecord.medical_history)}
                  className="mt-2 min-h-20 resize-none bg-slate-50 text-sm text-slate-600"
                />
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">
                  Hút thuốc
                </p>
                <p className="text-sm text-slate-600">
                  {formatValue(selectedHealthRecord.smoking)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">Rượu bia</p>
                <p className="text-sm text-slate-600">
                  {formatValue(selectedHealthRecord.alcohol_consumption)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 md:col-span-2">
                <p className="text-sm font-semibold text-slate-900">
                  Tần suất vận động
                </p>
                <Textarea
                  readOnly
                  value={formatValue(selectedHealthRecord.exercise_frequency)}
                  className="mt-2 min-h-20 resize-none bg-slate-50 text-sm text-slate-600"
                />
              </div>
            </CardContent>
          </Card>

          <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Cập nhật hồ sơ sức khỏe</DialogTitle>
              </DialogHeader>

              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={handleUpdate}
              >
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Nhóm máu</Label>
                  <Input
                    id="bloodType"
                    value={form.blood_type}
                    onChange={(event) =>
                      handleChange("blood_type", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastCheckupDate">Ngày khám gần nhất</Label>
                  <Input
                    id="lastCheckupDate"
                    type="date"
                    value={form.last_checkup_date}
                    onChange={(event) =>
                      handleChange("last_checkup_date", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Chiều cao (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="0"
                    value={form.height}
                    onChange={(event) =>
                      handleChange("height", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Cân nặng (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    value={form.weight}
                    onChange={(event) =>
                      handleChange("weight", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heartRate">Nhịp tim (bpm)</Label>
                  <Input
                    id="heartRate"
                    type="number"
                    min="0"
                    value={form.heart_rate}
                    onChange={(event) =>
                      handleChange("heart_rate", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodPressure">Huyết áp</Label>
                  <Input
                    id="bloodPressure"
                    value={form.blood_pressure}
                    onChange={(event) =>
                      handleChange("blood_pressure", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="glucoseLevel">Đường huyết (mg/dL)</Label>
                  <Input
                    id="glucoseLevel"
                    type="number"
                    min="0"
                    value={form.glucose_level}
                    onChange={(event) =>
                      handleChange("glucose_level", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cholesterolLevel">Cholesterol (mg/dL)</Label>
                  <Input
                    id="cholesterolLevel"
                    type="number"
                    min="0"
                    value={form.cholesterol_level}
                    onChange={(event) =>
                      handleChange("cholesterol_level", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smoking">Hút thuốc</Label>
                  <select
                    id="smoking"
                    value={form.smoking}
                    onChange={(event) =>
                      handleChange("smoking", event.target.value)
                    }
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    <option value="">Chưa cập nhật</option>
                    <option value="true">Có</option>
                    <option value="false">Không</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alcoholConsumption">Rượu bia</Label>
                  <select
                    id="alcoholConsumption"
                    value={form.alcohol_consumption}
                    onChange={(event) =>
                      handleChange("alcohol_consumption", event.target.value)
                    }
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    <option value="">Chưa cập nhật</option>
                    <option value="true">Có</option>
                    <option value="false">Không</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="exerciseFrequency">Tần suất vận động</Label>
                  <Textarea
                    id="exerciseFrequency"
                    value={form.exercise_frequency}
                    onChange={(event) =>
                      handleChange("exercise_frequency", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medicalHistory">Bệnh nền</Label>
                  <Textarea
                    id="medicalHistory"
                    value={form.medical_history}
                    onChange={(event) =>
                      handleChange("medical_history", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="allergies">Dị ứng</Label>
                  <Textarea
                    id="allergies"
                    value={form.allergies}
                    onChange={(event) =>
                      handleChange("allergies", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medications">Thuốc đang sử dụng</Label>
                  <Textarea
                    id="medications"
                    value={form.medications}
                    onChange={(event) =>
                      handleChange("medications", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="vaccinations">Vac xin đã tiêm</Label>
                  <Textarea
                    id="vaccinations"
                    value={form.vaccinations}
                    onChange={(event) =>
                      handleChange("vaccinations", event.target.value)
                    }
                  />
                </div>

                <DialogFooter className="md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUpdateOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateHealthProfileMutation.isPending}
                  >
                    {updateHealthProfileMutation.isPending
                      ? "Đang lưu..."
                      : "Lưu thay đổi"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default HealthRecords;
