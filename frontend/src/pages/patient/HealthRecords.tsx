import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  AlertTriangle,
  CalendarCheck2,
  CigaretteOff,
  ClipboardList,
  Dna,
  Droplet,
  Droplets,
  HeartPulse,
  Pill,
  Ruler,
  Scale,
  Stethoscope,
  Syringe,
  Wine,
} from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  usePatientHealthProfiles,
  useUpdatePatientHealthProfile,
} from "@/hooks/usePatientPortalApi";
import type {
  HealthProfile,
  HealthProfilePayload,
} from "@/types/interface/patient.interface";
import {
  BLOOD_TYPE_OPTIONS,
  UNSPECIFIED,
  healthProfileFormSchema,
  type HealthProfileFormValues,
} from "@/schemas/healthProfile.schema";

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
): HealthProfileFormValues => ({
  weight: profile?.weight?.toString() ?? "",
  height: profile?.height?.toString() ?? "",
  blood_type:
    profile?.blood_type &&
    (BLOOD_TYPE_OPTIONS as readonly string[]).includes(profile.blood_type)
      ? profile.blood_type
      : UNSPECIFIED,
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
      ? UNSPECIFIED
      : String(profile.smoking),
  alcohol_consumption:
    profile?.alcohol_consumption === null ||
    profile?.alcohol_consumption === undefined
      ? UNSPECIFIED
      : String(profile.alcohol_consumption),
  exercise_frequency: profile?.exercise_frequency ?? "",
  last_checkup_date: toDateInputValue(profile?.last_checkup_date),
});

const optionalNumber = (value: string | undefined) =>
  !value || value.trim() === "" ? undefined : Number(value);

const optionalBoolean = (value: string | undefined) =>
  !value || value === UNSPECIFIED ? undefined : value === "true";

const optionalString = (value: string | undefined) =>
  !value || value.trim() === "" ? undefined : value.trim();

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
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HealthProfileFormValues>({
    resolver: zodResolver(healthProfileFormSchema),
    defaultValues: getInitialForm(),
  });

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
    reset(getInitialForm(selectedHealthRecord));
  }, [selectedHealthRecord, reset]);

  const handleUpdate = (values: HealthProfileFormValues) => {
    if (!selectedHealthRecord) return;

    const payload: HealthProfilePayload = {
      weight: optionalNumber(values.weight),
      height: optionalNumber(values.height),
      blood_type:
        values.blood_type === UNSPECIFIED ? undefined : values.blood_type,
      medical_history: optionalString(values.medical_history),
      allergies: optionalString(values.allergies),
      heart_rate: optionalNumber(values.heart_rate),
      blood_pressure: optionalString(values.blood_pressure),
      glucose_level: optionalNumber(values.glucose_level),
      cholesterol_level: optionalNumber(values.cholesterol_level),
      medications: optionalString(values.medications),
      vaccinations: optionalString(values.vaccinations),
      smoking: optionalBoolean(values.smoking),
      alcohol_consumption: optionalBoolean(values.alcohol_consumption),
      exercise_frequency: optionalString(values.exercise_frequency),
      last_checkup_date: optionalString(values.last_checkup_date),
    };

    updateHealthProfileMutation.mutate(
      {
        relativeId: selectedHealthRecord.patient.id,
        data: payload,
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật hồ sơ sức khỏe.");
          setIsUpdateOpen(false);
        },
        onError: () => toast.error("Không thể cập nhật hồ sơ sức khỏe."),
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
                <p className="text-sm text-slate-500">Hồ sơ đang chọn</p>
                <p className="text-lg font-bold text-slate-900">
                  {selectedHealthRecord.patient.fullname ?? "Bệnh nhân"} -{" "}
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
                <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
                  <Droplet className="h-4 w-4 text-rose-500" />
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
                <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
                  <Ruler className="h-4 w-4 text-sky-500" />
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
                <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
                  <Scale className="h-4 w-4 text-emerald-500" />
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
                <CardTitle className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarCheck2 className="h-4 w-4 text-violet-500" />
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
                    icon: <HeartPulse className="h-4 w-4 text-rose-500" />,
                  },
                  {
                    label: "Nhịp tim",
                    value: formatValue(selectedHealthRecord.heart_rate, " bpm"),
                    icon: <Activity className="h-4 w-4 text-pink-500" />,
                  },
                  {
                    label: "Đường huyết",
                    value: formatValue(
                      selectedHealthRecord.glucose_level,
                      " mg/dL",
                    ),
                    icon: <Droplets className="h-4 w-4 text-amber-500" />,
                  },
                  {
                    label: "Cholesterol",
                    value: formatValue(
                      selectedHealthRecord.cholesterol_level,
                      " mg/dL",
                    ),
                    icon: <Dna className="h-4 w-4 text-indigo-500" />,
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-center gap-2">
                      {metric.icon}
                      <p className="text-sm font-semibold text-slate-900">
                        {metric.label}
                      </p>
                    </div>
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
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-cyan-500" />
                    <p className="text-sm font-semibold text-slate-900">
                      Thuốc đang sử dụng
                    </p>
                  </div>
                  <p className="mt-2 min-h-20 whitespace-pre-line rounded-md bg-slate-50 p-2 text-sm text-slate-600">
                    {formatValue(selectedHealthRecord.medications)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <Syringe className="h-4 w-4 text-teal-500" />
                    <p className="text-sm font-semibold text-slate-900">
                      Vắc xin đã tiêm
                    </p>
                  </div>
                  <p className="mt-2 min-h-20 whitespace-pre-line rounded-md bg-slate-50 p-2 text-sm text-slate-600">
                    {formatValue(selectedHealthRecord.vaccinations)}
                  </p>
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
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-semibold text-slate-900">Dị ứng</p>
                </div>
                <p className="mt-2 min-h-20 whitespace-pre-line rounded-md bg-slate-50 p-2 text-sm text-slate-600">
                  {formatValue(selectedHealthRecord.allergies)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-rose-500" />
                  <p className="text-sm font-semibold text-slate-900">Bệnh nền</p>
                </div>
                <p className="mt-2 min-h-20 whitespace-pre-line rounded-md bg-slate-50 p-2 text-sm text-slate-600">
                  {formatValue(selectedHealthRecord.medical_history)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <CigaretteOff className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-900">
                    Hút thuốc
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {formatValue(selectedHealthRecord.smoking)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <Wine className="h-4 w-4 text-purple-500" />
                  <p className="text-sm font-semibold text-slate-900">Rượu bia</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {formatValue(selectedHealthRecord.alcohol_consumption)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-900">
                    Tần suất vận động
                  </p>
                </div>
                <p className="mt-2 min-h-20 whitespace-pre-line rounded-md bg-slate-50 p-2 text-sm text-slate-600">
                  {formatValue(selectedHealthRecord.exercise_frequency)}
                </p>
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
                onSubmit={handleSubmit(handleUpdate)}
              >
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Nhóm máu</Label>
                  <Controller
                    name="blood_type"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="bloodType" className="w-full">
                          <SelectValue placeholder="Chọn nhóm máu" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNSPECIFIED}>Chưa cập nhật</SelectItem>
                          {BLOOD_TYPE_OPTIONS.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastCheckupDate">Ngày khám gần nhất</Label>
                  <Input
                    id="lastCheckupDate"
                    type="date"
                    {...register("last_checkup_date")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Chiều cao (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="0"
                    error={errors.height?.message}
                    {...register("height")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Cân nặng (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    error={errors.weight?.message}
                    {...register("weight")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heartRate">Nhịp tim (bpm)</Label>
                  <Input
                    id="heartRate"
                    type="number"
                    min="0"
                    error={errors.heart_rate?.message}
                    {...register("heart_rate")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodPressure">Huyết áp</Label>
                  <Input
                    id="bloodPressure"
                    placeholder="Ví dụ: 120/80"
                    error={errors.blood_pressure?.message}
                    {...register("blood_pressure")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="glucoseLevel">Đường huyết (mg/dL)</Label>
                  <Input
                    id="glucoseLevel"
                    type="number"
                    min="0"
                    error={errors.glucose_level?.message}
                    {...register("glucose_level")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cholesterolLevel">Cholesterol (mg/dL)</Label>
                  <Input
                    id="cholesterolLevel"
                    type="number"
                    min="0"
                    error={errors.cholesterol_level?.message}
                    {...register("cholesterol_level")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smoking">Hút thuốc</Label>
                  <Controller
                    name="smoking"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="smoking" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNSPECIFIED}>Chưa cập nhật</SelectItem>
                          <SelectItem value="true">Có</SelectItem>
                          <SelectItem value="false">Không</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alcoholConsumption">Rượu bia</Label>
                  <Controller
                    name="alcohol_consumption"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="alcoholConsumption" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNSPECIFIED}>Chưa cập nhật</SelectItem>
                          <SelectItem value="true">Có</SelectItem>
                          <SelectItem value="false">Không</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="exerciseFrequency">Tần suất vận động</Label>
                  <Textarea
                    id="exerciseFrequency"
                    {...register("exercise_frequency")}
                  />
                  {errors.exercise_frequency?.message && (
                    <p className="text-sm text-red-600">
                      {errors.exercise_frequency.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medicalHistory">Bệnh nền</Label>
                  <Textarea id="medicalHistory" {...register("medical_history")} />
                  {errors.medical_history?.message && (
                    <p className="text-sm text-red-600">
                      {errors.medical_history.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="allergies">Dị ứng</Label>
                  <Textarea id="allergies" {...register("allergies")} />
                  {errors.allergies?.message && (
                    <p className="text-sm text-red-600">
                      {errors.allergies.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medications">Thuốc đang sử dụng</Label>
                  <Textarea id="medications" {...register("medications")} />
                  {errors.medications?.message && (
                    <p className="text-sm text-red-600">
                      {errors.medications.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="vaccinations">Vắc xin đã tiêm</Label>
                  <Textarea id="vaccinations" {...register("vaccinations")} />
                  {errors.vaccinations?.message && (
                    <p className="text-sm text-red-600">
                      {errors.vaccinations.message}
                    </p>
                  )}
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
