import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Mail,
  Plus,
  RotateCcw,
  Search,
  UserRound,
  UserX,
  XCircle,
} from "lucide-react";

import { ActionCell, GenericList } from "@/components/app/GenericList";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { DetailDialog, type DetailRow } from "@/components/app/DetailDialog";
import { FormDialog, FormField } from "@/components/app/FormDialog";
import { UserCreateDialog } from "@/components/app/UserCreateDialog";
import { UserEditDialog } from "@/components/app/UserEditDialog";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { permissions, PERMISSIONS } from "@/config/permissions";
import { usePermission } from "@/hooks/usePermission";
import {
  useApproveArticle,
  useArticles,
  useCreateArticle,
  useDeleteArticle,
  useUpdateArticle,
} from "@/hooks/useArticles";
import {
  useAdminAppointments,
  useCancelAppointment,
  useCreateAppointment,
  useUpdateAppointmentStatus,
} from "@/hooks/useAppointments";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useCurrentDoctor } from "@/hooks/useCurrentDoctor";
import {
  useComplaints,
  useCreateComplaint,
  useDeleteComplaint,
  useUpdateComplaint,
} from "@/hooks/useComplaints";
import {
  useDeleteDoctor,
  useDoctors,
  useUpdateDoctor,
} from "@/hooks/useDoctors";
import {
  useCreateExaminationResult,
  useDeleteExaminationResult,
  useDoctorExaminationResults,
  useExaminationResults,
  useUpdateExaminationResult,
} from "@/hooks/useExaminationResults";
import { useAdminHealthProfiles } from "@/hooks/useHealthProfiles";
import {
  useCreateNotification,
  useDeleteNotification,
  useInfiniteNotificationRecipients,
  useNotifications,
  useSendNotificationBroadcast,
} from "@/hooks/useNotifications";
import { useRoles } from "@/hooks/useRoles";
import {
  useActivateUser,
  useDeactivateUser,
  useLockUser,
  usePatients,
  useUnlockUser,
  useUsers,
} from "@/hooks/useUsers";
import {
  useCreateRelationship,
  useDeleteRelationship,
  useRelationships,
  useUpdateRelationship,
} from "@/hooks/useRelationships";
import {
  useAdminRelatives,
  useCreateRelative,
  useDeleteRelative,
  useUpdateRelative,
} from "@/hooks/useRelatives";
import {
  useSatisfactionRatings,
  useUpdateSatisfactionRating,
} from "@/hooks/useSatisfactionRatings";
import {
  useCreateSpecialty,
  useDeleteSpecialty,
  useSpecialties,
  useUpdateSpecialty,
} from "@/hooks/useSpecialties";
import {
  useCreateTag,
  useDeleteTag,
  useTags,
  useUpdateTag,
} from "@/hooks/useTags";
import {
  useCreateTopic,
  useDeleteTopic,
  useTopics,
  useUpdateTopic,
} from "@/hooks/useTopics";
import {
  useCreateDoctorSchedule,
  useDeleteDoctorSchedule,
  useDoctorSchedulesByDoctorId,
  usePersonalSchedules,
  useUpdateDoctorSchedule,
  useUpdateDoctorScheduleStatus,
} from "@/hooks/useDoctorSchedules";
import { ErrorState } from "@/components/app/ErrorState";
import { EmptyState } from "@/components/app/EmptyState";
import { LoadingState } from "@/components/app/LoadingState";
import type {
  AppointmentStatus,
  ComplaintStatus,
} from "@/types/interface/api.interface";
import type { AdminAppointmentListPayload } from "@/types/interface/appointment.interface";
import type { Article } from "@/types/interface/article.interface";
import type { DoctorSchedule } from "@/types/interface/doctorSchedule.interface";
import type { Doctor } from "@/types/interface/doctor.interface";
import type { Specialty } from "@/types/interface/specialty.interface";
import type { Tag } from "@/types/interface/tag.interface";
import type { Topic } from "@/types/interface/topic.interface";
import type { ExaminationResult } from "@/types/interface/examinationResult.interface";
import type { Relationship } from "@/types/interface/relationship.interface";
import type { Relative } from "@/types/interface/relative.interface";
import type { User } from "@/types/interface/user.interface";

type ModuleViewProps = {
  search: string;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

function getRoleNames(roles?: { role_name: string }[]) {
  return roles?.map((role) => role.role_name).join(", ") ?? "";
}

function hasAdminRole(roles?: { role_name: string }[]) {
  return roles?.some((role) => role.role_name === "ADMIN") ?? false;
}

function getNextAppointmentStatus(
  status: AppointmentStatus,
): AppointmentStatus | null {
  if (status === "PENDING") return "CONFIRMED";
  if (status === "CONFIRMED") return "COMPLETED";
  return null;
}

function getNextComplaintStatus(status: ComplaintStatus): ComplaintStatus {
  if (status === "pending") return "in_progress";
  if (status === "in_progress") return "resolved";
  return "resolved";
}

const COMPLAINT_STATUS_META: Record<
  ComplaintStatus,
  {
    label: string;
    badgeVariant: "warning" | "info" | "success" | "danger" | "outline";
    icon: typeof AlertTriangle;
    accentClass: string;
    chipClass: string;
  }
> = {
  pending: {
    label: "Chờ xử lý",
    badgeVariant: "warning",
    icon: Clock,
    accentClass: "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/40",
    chipClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
  },
  in_progress: {
    label: "Đang xử lý",
    badgeVariant: "info",
    icon: AlertTriangle,
    accentClass: "border-sky-200 bg-sky-50 dark:border-sky-800/60 dark:bg-sky-950/40",
    chipClass: "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300",
  },
  resolved: {
    label: "Đã giải quyết",
    badgeVariant: "success",
    icon: CheckCircle2,
    accentClass: "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/40",
    chipClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
  },
  rejected: {
    label: "Từ chối",
    badgeVariant: "danger",
    icon: XCircle,
    accentClass: "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/40",
    chipClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300",
  },
};

function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const meta = COMPLAINT_STATUS_META[status] ?? {
    label: status,
    badgeVariant: "outline" as const,
    icon: AlertTriangle,
    accentClass: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
    chipClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };
  const Icon = meta.icon;
  return (
    <Badge variant={meta.badgeVariant} className="gap-1 px-2.5 py-1">
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

function ToolbarCreateButton({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function ViewDetailButton({
  title,
  description,
  rows,
  footer,
}: {
  title: string;
  description?: string;
  rows: DetailRow[];
  footer?: ReactNode;
}) {
  return (
    <DetailDialog
      title={title}
      description={description}
      rows={rows}
      footer={footer}
      trigger={
        <Button type="button" variant="outline" size="sm">
          Xem
        </Button>
      }
    />
  );
}

function formatBoolean(value: boolean | null | undefined, yes = "Có", no = "Không") {
  if (value === undefined || value === null) return "-";
  return value ? yes : no;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return value;
}

function UsersModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const { data, isLoading, isError, refetch } = useUsers({
    page,
    limit,
    search: search || undefined,
  });
  const { can } = usePermission();
  const rawUsers = useMemo(
    () => data?.data?.users ?? [],
    [data?.data?.users],
  );
  const rows = useMemo(() => {
    return rawUsers.filter(
      (user) =>
        !user.roles?.some(
          (role) => role.role_name?.toUpperCase() === "PATIENT"
        )
    );
  }, [rawUsers]);
  const total = data?.data?.total ?? rows.length;
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const lockUser = useLockUser();
  const unlockUser = useUnlockUser();
  const isMutating =
    activateUser.isPending ||
    deactivateUser.isPending ||
    lockUser.isPending ||
    unlockUser.isPending;

  const canActivate = can(PERMISSIONS.USER_ACTIVATE, PERMISSIONS.USER_MANAGE);
  const canDeactivate = can(
    PERMISSIONS.USER_DEACTIVATE,
    PERMISSIONS.USER_MANAGE,
  );
  const canLock = can(PERMISSIONS.USER_LOCK, PERMISSIONS.USER_MANAGE);
  const canUnlock = can(PERMISSIONS.USER_UNLOCK, PERMISSIONS.USER_MANAGE);
  const canUpdate = can(PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_MANAGE);
  const canCreate = can(PERMISSIONS.USER_CREATE, PERMISSIONS.USER_MANAGE);

  return (
    <GenericList
      title="Người dùng"
      rows={rows}
      total={total}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      rowKey={(row) => row.id}
      toolbar={
        canCreate ? (
          <UserCreateDialog
            trigger={
              <Button type="button" variant="outline" size="sm">
                + Tạo người dùng
              </Button>
            }
          />
        ) : undefined
      }
      columns={[
        { key: "id", label: "ID", render: (row) => row.id },
        {
          key: "fullname",
          label: "Họ tên",
          render: (row) => row.fullname || row.username,
        },
        { key: "email", label: "Email", render: (row) => row.email },
        { key: "phone", label: "SĐT", render: (row) => row.phone ?? "-" },
        {
          key: "roles",
          label: "Vai trò",
          render: (row) => getRoleNames(row.roles) || "-",
        },
        {
          key: "is_active",
          label: "Trạng thái",
          render: (row) =>
            row.is_active ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="outline">Inactive</Badge>
            ),
        },
        {
          key: "is_locked",
          label: "Khóa",
          render: (row) =>
            row.is_locked ? (
              <Badge variant="danger">Locked</Badge>
            ) : (
              <Badge variant="outline">Free</Badge>
            ),
        },
        {
          key: "actions",
          label: "Thao tác",
          render: (row) => (
            <ActionCell>
              <ViewDetailButton
                title={`Người dùng #${row.id}`}
                description={row.fullname || row.username}
                rows={[
                  { label: "ID", value: row.id },
                  { label: "Username", value: row.username },
                  { label: "Họ tên", value: row.fullname },
                  { label: "Email", value: row.email },
                  { label: "Số điện thoại", value: row.phone ?? "-" },
                  { label: "Địa chỉ", value: row.address ?? "-" },
                  {
                    label: "Giới tính",
                    value: row.gender === undefined ? "-" : row.gender ? "Nam" : "Nữ",
                  },
                  { label: "Ngày sinh", value: formatDate(row.date_of_birth) },
                  {
                    label: "Vai trò",
                    value: getRoleNames(row.roles) || "-",
                  },
                  {
                    label: "Trạng thái",
                    value: row.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    ),
                  },
                  {
                    label: "Khóa",
                    value: row.is_locked ? (
                      <Badge variant="danger">Locked</Badge>
                    ) : (
                      <Badge variant="outline">Free</Badge>
                    ),
                  },
                  {
                    label: "Quyền admin",
                    value: formatBoolean(row.isAdmin),
                  },
                  { label: "Tạo lúc", value: formatDate(row.created_at) },
                  { label: "Cập nhật", value: formatDate(row.updated_at) },
                ]}
              />
              {canUpdate ? (
                <UserEditDialog
                  user={row}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      Sửa
                    </Button>
                  }
                />
              ) : null}
              {!hasAdminRole(row.roles) && (row.is_active
                ? canDeactivate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isMutating}
                      onClick={() => deactivateUser.mutate(row.id)}
                    >
                      Vô hiệu
                    </Button>
                  )
                : canActivate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isMutating}
                      onClick={() => activateUser.mutate(row.id)}
                    >
                      Kích hoạt
                    </Button>
                  ))}
              {!hasAdminRole(row.roles) && (row.is_locked
                ? canUnlock && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isMutating}
                      onClick={() => unlockUser.mutate(row.id)}
                    >
                      Mở khóa
                    </Button>
                  )
                : canLock && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isMutating}
                      onClick={() => lockUser.mutate(row.id)}
                    >
                      Khóa
                    </Button>
                  ))}
            </ActionCell>
          ),
        },
      ]}
    />
  );
}

function PatientsModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const { data, isLoading, isError, refetch } = usePatients({
    page,
    limit,
    search: search || undefined,
  });

  const rows = data?.data?.patients ?? [];
  const total = data?.data?.total ?? 0;

  return (
    <GenericList
      title="Bệnh nhân"
      rows={rows}
      total={total}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      rowKey={(row) => row.id}
      columns={[
        { key: "id", label: "ID", render: (row) => row.id },
        {
          key: "fullname",
          label: "Họ tên",
          render: (row) => row.fullname || row.username,
        },
        { key: "email", label: "Email", render: (row) => row.email },
        { key: "phone", label: "SĐT", render: (row) => row.phone ?? "-" },
        {
          key: "is_active",
          label: "Trạng thái",
          render: (row) =>
            row.is_active ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="outline">Inactive</Badge>
            ),
        },
        {
          key: "actions",
          label: "Thao tác",
          render: (row) => (
            <ActionCell>
              <ViewDetailButton
                title={`Bệnh nhân #${row.id}`}
                description={row.fullname || row.username}
                rows={[
                  { label: "ID", value: row.id },
                  { label: "Username", value: row.username },
                  { label: "Họ tên", value: row.fullname },
                  { label: "Email", value: row.email },
                  { label: "Số điện thoại", value: row.phone ?? "-" },
                  { label: "Địa chỉ", value: row.address ?? "-" },
                  {
                    label: "Giới tính",
                    value: row.gender === undefined ? "-" : row.gender ? "Nam" : "Nữ",
                  },
                  { label: "Ngày sinh", value: formatDate(row.date_of_birth) },
                  {
                    label: "Vai trò",
                    value: getRoleNames(row.roles) || "-",
                  },
                  {
                    label: "Trạng thái",
                    value: row.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    ),
                  },
                  { label: "Tạo lúc", value: formatDate(row.created_at) },
                  { label: "Cập nhật", value: formatDate(row.updated_at) },
                ]}
              />
            </ActionCell>
          ),
        },
      ]}
    />
  );
}

type DoctorEditFormState = {
  workplace: string;
  experience: string;
  about_me: string;
  doctor_level: string;
};

function DoctorEditDialog({
  doctor,
  trigger,
}: {
  doctor: Doctor;
  trigger: ReactNode;
}) {
  const updateDoctor = useUpdateDoctor();
  const [form, setForm] = useState<DoctorEditFormState>({
    workplace: doctor.workplace ?? "",
    experience: String(doctor.experience ?? 0),
    about_me: doctor.about_me ?? "",
    doctor_level: String(doctor.doctor_level ?? ""),
  });

  return (
    <FormDialog
      trigger={trigger}
      title={`Cập nhật bác sĩ #${doctor.id}`}
      description="Chỉnh sửa thông tin nghiệp vụ của bác sĩ."
      isSubmitting={updateDoctor.isPending}
      onOpen={() =>
        setForm({
          workplace: doctor.workplace ?? "",
          experience: String(doctor.experience ?? 0),
          about_me: doctor.about_me ?? "",
          doctor_level: String(doctor.doctor_level ?? ""),
        })
      }
      onSubmit={() =>
        updateDoctor.mutateAsync({
          doctorId: doctor.id,
          payload: {
            workplace: form.workplace || undefined,
            experience: form.experience ? Number(form.experience) : undefined,
            about_me: form.about_me || undefined,
            doctor_level: form.doctor_level || undefined,
          },
        })
      }
    >
      <FormField label="Nơi công tác" htmlFor="doctor-workplace">
        <Input
          id="doctor-workplace"
          value={form.workplace}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, workplace: event.target.value }))
          }
        />
      </FormField>
      <FormField label="Kinh nghiệm (năm)" htmlFor="doctor-experience">
        <Input
          id="doctor-experience"
          type="number"
          min={0}
          value={form.experience}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, experience: event.target.value }))
          }
        />
      </FormField>
      <FormField label="Cấp bậc" htmlFor="doctor-level">
        <Input
          id="doctor-level"
          value={form.doctor_level}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, doctor_level: event.target.value }))
          }
        />
      </FormField>
      <FormField label="Giới thiệu" htmlFor="doctor-about">
        <Textarea
          id="doctor-about"
          value={form.about_me}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, about_me: event.target.value }))
          }
        />
      </FormField>
    </FormDialog>
  );
}

function DoctorsModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const { data, isLoading, isError, refetch } = useDoctors({
    page,
    limit,
    search: search || undefined,
  });
  const { can } = usePermission();
  const rows = data?.data?.doctors ?? [];
  const total = data?.data?.total ?? 0;
  const deleteDoctor = useDeleteDoctor();

  const canUpdate = can(PERMISSIONS.DOCTOR_UPDATE, PERMISSIONS.DOCTOR_MANAGE);
  const canDelete = can(PERMISSIONS.DOCTOR_DELETE, PERMISSIONS.DOCTOR_MANAGE);

  return (
    <GenericList
      title="Bác sĩ"
      rows={rows}
      total={total}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      rowKey={(row) => row.id}
      columns={[
        { key: "id", label: "ID", render: (row) => row.id },
        { key: "fullname", label: "Họ tên", render: (row) => row.fullname },
        {
          key: "specialty",
          label: "Chuyên khoa",
          render: (row) =>
            typeof row.specialty === "string"
              ? row.specialty
              : row.specialty?.name ?? row.specialty?.specialty_name ?? "-",
        },
        {
          key: "experience",
          label: "Kinh nghiệm",
          render: (row) => `${row.experience} năm`,
        },
        {
          key: "doctor_level",
          label: "Cấp bậc",
          render: (row) => row.doctor_level,
        },
        {
          key: "avg_rating",
          label: "Đánh giá",
          render: (row) => row.avg_rating?.toFixed?.(2) ?? row.avg_rating,
        },
        {
          key: "actions",
          label: "Thao tác",
          render: (row) => {
            const specialtyName =
              typeof row.specialty === "string"
                ? row.specialty
                : row.specialty?.name ?? row.specialty?.specialty_name ?? "-";
            return (
              <ActionCell>
                <ViewDetailButton
                  title={`Bác sĩ #${row.id}`}
                  description={row.fullname}
                  rows={[
                    { label: "ID", value: row.id },
                    { label: "User ID", value: row.user_id },
                    { label: "Họ tên", value: row.fullname },
                    { label: "Email", value: row.email ?? "-" },
                    { label: "Số điện thoại", value: row.phone ?? "-" },
                    { label: "Chuyên khoa", value: specialtyName },
                    {
                      label: "Kinh nghiệm",
                      value: `${row.experience} năm`,
                    },
                    { label: "Cấp bậc", value: row.doctor_level },
                    { label: "Nơi công tác", value: row.workplace ?? "-" },
                    {
                      label: "Điểm trung bình",
                      value: row.avg_rating?.toFixed?.(2) ?? row.avg_rating,
                    },
                    {
                      label: "Lượt khám hoàn tất",
                      value: row.appointments_completed ?? 0,
                    },
                    {
                      label: "Outstanding",
                      value: formatBoolean(row.isOutstanding),
                    },
                    {
                      label: "Giới tính",
                      value:
                        row.gender === undefined ? "-" : row.gender ? "Nam" : "Nữ",
                    },
                    { label: "Ngày sinh", value: formatDate(row.date_of_birth) },
                    { label: "Tạo lúc", value: formatDate(row.created_at) },
                    { label: "Cập nhật", value: formatDate(row.updated_at) },
                  ]}
                  footer={
                    row.about_me ? (
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                        <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                          Giới thiệu
                        </div>
                        <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                          {row.about_me}
                        </p>
                      </div>
                    ) : null
                  }
                />
                {canUpdate ? (
                  <DoctorEditDialog
                    doctor={row}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        Sửa
                      </Button>
                    }
                  />
                ) : null}
                {canDelete ? (
                  <ConfirmDialog
                    trigger={
                      <Button type="button" variant="destructive" size="sm">
                        Xóa
                      </Button>
                    }
                    title="Xóa bác sĩ"
                    description={`Bạn có chắc muốn xóa bác sĩ #${row.id}? Hành động không thể hoàn tác.`}
                    destructive
                    isSubmitting={deleteDoctor.isPending}
                    onConfirm={() => deleteDoctor.mutateAsync(row.id)}
                  />
                ) : null}
              </ActionCell>
            );
          },
        },
      ]}
    />
  );
}

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "COMPLETED", label: "Hoàn tất" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "ABSENT", label: "Vắng mặt" },
  { value: "EXPIRED", label: "Quá hạn khám" },
];

function AppointmentsModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
  scope = "admin",
}: ModuleViewProps & { scope?: "admin" | "doctor" }) {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [dateFilter, setDateFilter] = useState("");
  const [adminDoctorId, setAdminDoctorId] = useState<number | undefined>();

  const isDoctorScope = scope === "doctor";

  const doctorsQuery = useDoctors(
    { page: 1, limit: 200 },
  );
  const doctors: Doctor[] = doctorsQuery.data?.data?.doctors ?? [];

  // Bypass: backend endpoint /appointments/doctor/appointments hiện đang lỗi
  // (service truy cập user.doctor.id mà không nạp relation), nên dùng endpoint
  // admin có filter `doctorId` cho scope doctor.
  const currentDoctorQuery = useCurrentDoctor();
  const doctorId = currentDoctorQuery.data?.id;

  const queryPayload = useMemo<AdminAppointmentListPayload>(() => {
    const payload: AdminAppointmentListPayload = { page, limit };
    if (statusFilter) payload.appointmentStatus = statusFilter;
    if (dateFilter) payload.appointmentDate = dateFilter;
    if (isDoctorScope) {
      payload.doctorId = doctorId;
    } else if (adminDoctorId) {
      payload.doctorId = adminDoctorId;
    }
    return payload;
  }, [page, limit, statusFilter, dateFilter, doctorId, isDoctorScope, adminDoctorId]);

  const adminQuery = useAdminAppointments(
    queryPayload,
    !isDoctorScope || Boolean(doctorId),
  );
  const { data, isLoading, isError, refetch } = adminQuery;
  const total = data?.data?.total ?? 0;
  const { can } = usePermission();
  const updateStatus = useUpdateAppointmentStatus();
  const cancelAppointment = useCancelAppointment();
  const isMutating = updateStatus.isPending || cancelAppointment.isPending;

  const canUpdateStatus = can(
    PERMISSIONS.APPOINTMENT_UPDATE_STATUS,
    PERMISSIONS.APPOINTMENT_MANAGE,
  );
  const canCancel = can(
    PERMISSIONS.APPOINTMENT_CANCEL,
    PERMISSIONS.APPOINTMENT_MANAGE,
  );
  const canCreateExamResult = can(
    PERMISSIONS.EXAMINATION_RESULT_CREATE,
    PERMISSIONS.EXAMINATION_RESULT_MANAGE,
  );
  const canCreateAppointment = can(
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_MANAGE,
  );

  const filtered = useMemo(() => {
    const list = data?.data?.appointments ?? [];
    if (!search) return list;
    const term = search.toLowerCase();
    return list.filter((row) =>
      [
        row.patient?.fullname,
        row.doctor?.fullname,
        row.symptoms,
        row.appointment_status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [data, search]);

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as AppointmentStatus | "");
    onPageChange(1);
  };

  const handleDateFilter = (value: string) => {
    setDateFilter(value);
    onPageChange(1);
  };

  const handleDoctorFilter = (value: string) => {
    setAdminDoctorId(value ? Number(value) : undefined);
    onPageChange(1);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setDateFilter("");
    setAdminDoctorId(undefined);
    onPageChange(1);
  };

  const hasActiveFilters = statusFilter || dateFilter || adminDoctorId;

  const filterInputClass =
    "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400";

  if (isDoctorScope && currentDoctorQuery.isLoading) {
    return <LoadingState />;
  }

  if (isDoctorScope && !doctorId) {
    return (
      <EmptyState
        title="Không tìm thấy hồ sơ bác sĩ"
        description="Tài khoản hiện tại chưa gắn với hồ sơ bác sĩ nào trong hệ thống."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="mono-label text-[10px] text-slate-500 dark:text-slate-400">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className={filterInputClass}
          >
            <option value="">Tất cả</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="mono-label text-[10px] text-slate-500 dark:text-slate-400">Ngày khám</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => handleDateFilter(e.target.value)}
            className={filterInputClass}
          />
        </div>

        {!isDoctorScope ? (
          <div className="flex flex-col gap-1">
            <label className="mono-label text-[10px] text-slate-500 dark:text-slate-400">Bác sĩ</label>
            <select
              value={adminDoctorId ?? ""}
              onChange={(e) => handleDoctorFilter(e.target.value)}
              className={filterInputClass}
            >
              <option value="">Tất cả bác sĩ</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fullname}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-10"
          >
            <RotateCcw className="mr-1 size-3" />
            Xóa lọc
          </Button>
        ) : null}

        {!isDoctorScope && canCreateAppointment ? (
          <div className="ml-auto">
            <AppointmentCreateDialog
              trigger={
                <Button type="button" size="sm" variant="outline">
                  + Đặt lịch mới
                </Button>
              }
            />
          </div>
        ) : null}
      </div>

      <GenericList
        title="Lịch hẹn"
        rows={filtered}
        total={total}
        page={page}
        limit={limit}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        rowKey={(row) => row.id}
        columns={[
          { key: "id", label: "ID", render: (row) => row.id },
          {
            key: "patient",
            label: "Bệnh nhân",
            render: (row) => row.patient?.fullname ?? "-",
          },
          {
            key: "doctor",
            label: "Bác sĩ",
            render: (row) => row.doctor?.fullname ?? "-",
          },
          {
            key: "appointment_date",
            label: "Ngày khám",
            render: (row) => row.appointment_date,
          },
          {
            key: "appointment_status",
            label: "Trạng thái",
            render: (row) => (
              <Badge variant="outline">{row.appointment_status}</Badge>
            ),
          },
          {
            key: "actions",
            label: "Thao tác",
            render: (row) => {
              const nextStatus = getNextAppointmentStatus(row.appointment_status);
              return (
                <ActionCell>
                  <ViewDetailButton
                    title={`Lịch hẹn #${row.id}`}
                    description={`${row.patient?.fullname ?? ""} → ${row.doctor?.fullname ?? ""}`}
                    rows={[
                      { label: "ID", value: row.id },
                      {
                        label: "Bệnh nhân",
                        value: row.patient?.fullname ?? "-",
                      },
                      {
                        label: "Bác sĩ",
                        value: row.doctor?.fullname ?? "-",
                      },
                      {
                        label: "Ngày khám",
                        value: row.appointment_date,
                      },
                      {
                        label: "Khung giờ",
                        value:
                          row.start_time || row.end_time
                            ? `${row.start_time ?? "?"} - ${row.end_time ?? "?"}`
                            : "-",
                      },
                      {
                        label: "Trạng thái",
                        value: (
                          <Badge variant="outline">
                            {row.appointment_status}
                          </Badge>
                        ),
                      },
                      {
                        label: "Booking mode",
                        value: row.booking_mode ?? "-",
                      },
                      {
                        label: "Người đặt",
                        value: row.booker?.fullname ?? "-",
                      },
                      {
                        label: "Người thân",
                        value: row.relative?.fullname ?? "-",
                      },
                      { label: "Tạo lúc", value: formatDate(row.created_at) },
                      { label: "Cập nhật", value: formatDate(row.updated_at) },
                    ]}
                    footer={
                      row.symptoms || row.notes ? (
                        <div className="space-y-3">
                          {row.symptoms ? (
                            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                              <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                                Triệu chứng
                              </div>
                              <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                                {row.symptoms}
                              </p>
                            </div>
                          ) : null}
                          {row.notes ? (
                            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                              <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                                Ghi chú
                              </div>
                              <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                                {row.notes}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ) : null
                    }
                  />
                  {canUpdateStatus && nextStatus ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isMutating}
                      onClick={() =>
                        updateStatus.mutate({
                          appointmentId: row.id,
                          payload: { status: nextStatus },
                        })
                      }
                    >
                      {nextStatus === "CONFIRMED" ? "Xác nhận" : "Hoàn tất"}
                    </Button>
                  ) : null}
                  {canUpdateStatus &&
                  row.appointment_status === "CONFIRMED" ? (
                    <ConfirmDialog
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Vắng mặt
                        </Button>
                      }
                      title="Đánh dấu vắng mặt"
                      description={`Xác nhận bệnh nhân không đến khám cho lịch hẹn #${row.id}? Chỉ có thể đánh dấu khi đã đến ngày khám và qua giờ bắt đầu.`}
                      isSubmitting={isMutating}
                      onConfirm={() =>
                        updateStatus.mutateAsync({
                          appointmentId: row.id,
                          payload: { status: "ABSENT" },
                        })
                      }
                    />
                  ) : null}
                  {canCancel &&
                  row.appointment_status !== "CANCELLED" &&
                  row.appointment_status !== "COMPLETED" &&
                  row.appointment_status !== "EXPIRED" ? (
                    <ConfirmDialog
                      trigger={
                        <Button type="button" variant="destructive" size="sm">
                          Hủy
                        </Button>
                      }
                      title="Hủy lịch hẹn"
                      description={`Bạn có chắc muốn hủy lịch hẹn #${row.id}?`}
                      destructive
                      isSubmitting={isMutating}
                      onConfirm={() => cancelAppointment.mutateAsync(row.id)}
                    />
                  ) : null}
                  {canCreateExamResult &&
                  row.appointment_status === "COMPLETED" &&
                  !row.examination_result ? (
                    <ExaminationResultFormDialog
                      mode="create"
                      appointmentId={row.id}
                      trigger={
                        <Button type="button" variant="outline" size="sm">
                          + Kết quả khám
                        </Button>
                      }
                    />
                  ) : null}
                  {row.examination_result ? (
                    <DetailDialog
                      title={`Kết quả khám #${row.examination_result.id}`}
                      description={`Lịch hẹn #${row.id}`}
                      rows={[
                        {
                          label: "Triệu chứng",
                          value: row.examination_result.symptoms ?? "-",
                        },
                        {
                          label: "Chẩn đoán",
                          value: row.examination_result.diagnosis ?? "-",
                        },
                        {
                          label: "Phác đồ điều trị",
                          value: row.examination_result.treatment ?? "-",
                        },
                        {
                          label: "Đơn thuốc",
                          value: row.examination_result.prescription ?? "-",
                        },
                      ]}
                      trigger={
                        <Button type="button" variant="outline" size="sm">
                          Xem KQ
                        </Button>
                      }
                    />
                  ) : null}
                </ActionCell>
              );
            },
          },
        ]}
      />
    </div>
  );
}

function AuditLogsModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const { data, isLoading, isError, refetch } = useAuditLogs({
    page,
    limit,
    search: search || undefined,
  });
  const rows = data?.data?.auditLogs ?? [];
  const total = data?.data?.total ?? 0;

  return (
    <GenericList
      title="Audit logs"
      rows={rows}
      total={total}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      rowKey={(row) => row.id}
      columns={[
        { key: "id", label: "ID", render: (row) => row.id },
        { key: "action", label: "Hành động", render: (row) => row.action },
        {
          key: "entity_name",
          label: "Đối tượng",
          render: (row) => row.entity_name,
        },
        {
          key: "user",
          label: "Người thực hiện",
          render: (row) => row.user?.fullname ?? "system",
        },
        {
          key: "endpoint",
          label: "Endpoint",
          render: (row) => `${row.method} ${row.endpoint}`,
        },
        {
          key: "is_success",
          label: "Trạng thái",
          render: (row) =>
            row.is_success ? (
              <Badge variant="success">{row.status_code}</Badge>
            ) : (
              <Badge variant="danger">{row.status_code}</Badge>
            ),
        },
        {
          key: "created_at",
          label: "Thời gian",
          render: (row) => row.created_at,
        },
        {
          key: "actions",
          label: "Thao tác",
          render: (row) => (
            <ActionCell>
              <ViewDetailButton
                title={`Audit log #${row.id}`}
                description={`${row.method} ${row.endpoint}`}
                rows={[
                  { label: "ID", value: row.id },
                  { label: "Hành động", value: row.action },
                  { label: "Đối tượng", value: row.entity_name },
                  {
                    label: "Người thực hiện",
                    value: row.user?.fullname ?? "system",
                  },
                  { label: "Email", value: row.user?.email ?? "-" },
                  { label: "Method", value: row.method },
                  { label: "Endpoint", value: row.endpoint },
                  {
                    label: "Status",
                    value: row.is_success ? (
                      <Badge variant="success">{row.status_code}</Badge>
                    ) : (
                      <Badge variant="danger">{row.status_code}</Badge>
                    ),
                  },
                  {
                    label: "Thời lượng",
                    value: row.duration_ms ? `${row.duration_ms} ms` : "-",
                  },
                  { label: "IP", value: row.ip_address ?? "-" },
                  { label: "User agent", value: row.user_agent ?? "-" },
                  { label: "Thời gian", value: formatDate(row.created_at) },
                ]}
                footer={
                  row.error_message ||
                  row.old_data ||
                  row.new_data ? (
                    <div className="space-y-3">
                      {row.error_message ? (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                          <div className="mono-label text-[10px] text-rose-600 dark:text-rose-400">
                            Error message
                          </div>
                          <p className="mt-2 whitespace-pre-line">
                            {row.error_message}
                          </p>
                        </div>
                      ) : null}
                      {row.old_data ? (
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                          <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                            Old data
                          </div>
                          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-slate-900 dark:text-slate-100">
                            {JSON.stringify(row.old_data, null, 2)}
                          </pre>
                        </div>
                      ) : null}
                      {row.new_data ? (
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                          <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                            New data
                          </div>
                          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-slate-900 dark:text-slate-100">
                            {JSON.stringify(row.new_data, null, 2)}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  ) : null
                }
              />
            </ActionCell>
          ),
        },
      ]}
    />
  );
}

function ComplaintsModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [responseInputs, setResponseInputs] = useState<Record<number, string>>({});
  const { data, isLoading, isError, refetch } = useComplaints({
    page,
    limit,
    search: search || undefined,
    status: (statusFilter as ComplaintStatus) || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });
  const rows = useMemo(
    () => data?.data?.complaints ?? [],
    [data?.data?.complaints],
  );
  const total = data?.data?.total ?? 0;
  const updateComplaint = useUpdateComplaint();
  const deleteComplaint = useDeleteComplaint();
  const isMutating = updateComplaint.isPending || deleteComplaint.isPending;
  const { can } = usePermission();

  const canCreate = can(
    PERMISSIONS.COMPLAINT_CREATE,
    PERMISSIONS.COMPLAINT_MANAGE,
  );
  const canUpdate = can(
    PERMISSIONS.COMPLAINT_UPDATE,
    PERMISSIONS.COMPLAINT_MANAGE,
  );
  const canDelete = can(
    PERMISSIONS.COMPLAINT_DELETE,
    PERMISSIONS.COMPLAINT_MANAGE,
  );

  const hasFilters = statusFilter || fromDate || toDate;

  const statusCounts = useMemo(() => {
    const counts: Record<ComplaintStatus, number> = {
      pending: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
    };
    rows.forEach((row) => {
      const key = row.complaint_status;
      if (key in counts) counts[key] += 1;
    });
    return counts;
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(COMPLAINT_STATUS_META) as ComplaintStatus[]).map(
          (status) => {
            const meta = COMPLAINT_STATUS_META[status];
            const Icon = meta.icon;
            const count = statusCounts[status] ?? 0;
            return (
              <div
                key={status}
                className={`flex items-center justify-between rounded-lg border ${meta.accentClass} px-4 py-3`}
              >
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {meta.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {count}
                  </p>
                </div>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${meta.chipClass}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            );
          },
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <select
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            onPageChange(1);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="in_progress">Đang xử lý</option>
          <option value="resolved">Đã giải quyết</option>
          <option value="rejected">Từ chối</option>
        </select>
        <input
          type="date"
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            onPageChange(1);
          }}
          placeholder="Từ ngày"
        />
        <input
          type="date"
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            onPageChange(1);
          }}
          placeholder="Đến ngày"
        />
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setStatusFilter("");
              setFromDate("");
              setToDate("");
              onPageChange(1);
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Đặt lại
          </Button>
        ) : null}
        <div className="ml-auto">
          {canCreate ? (
            <ComplaintCreateDialog
              trigger={
                <Button size="sm" variant="outline">
                  + Thêm khiếu nại
                </Button>
              }
            />
          ) : null}
        </div>
      </div>
      <GenericList
        title="Khiếu nại"
        rows={rows}
        total={total}
        page={page}
        limit={limit}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        rowKey={(row) => row.id}
        columns={[
          {
            key: "id",
            label: "Mã KN",
            render: (row) => (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                #{row.id}
              </span>
            ),
          },
          {
            key: "title",
            label: "Tiêu đề & nội dung",
            render: (row) => (
              <div className="max-w-md space-y-1">
                <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {row.title}
                </p>
                <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                  {row.description}
                </p>
              </div>
            ),
          },
          {
            key: "user",
            label: "Người gửi",
            render: (row) => (
              <div className="flex items-start gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <UserRound className="h-4 w-4" />
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {row.user?.fullname ?? "Khách"}
                  </p>
                  {row.user?.email ? (
                    <p className="line-clamp-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Mail className="h-3 w-3" />
                      {row.user.email}
                    </p>
                  ) : null}
                </div>
              </div>
            ),
          },
          {
            key: "status",
            label: "Trạng thái",
            render: (row) => (
              <ComplaintStatusBadge status={row.complaint_status} />
            ),
          },
          {
            key: "created_at",
            label: "Gửi lúc",
            render: (row) => (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatDate(row.created_at)}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Thao tác",
            render: (row) => {
              const meta = COMPLAINT_STATUS_META[row.complaint_status];
              return (
                <ActionCell>
                  <ViewDetailButton
                    title={`Khiếu nại #${row.id}`}
                    description={row.title}
                    rows={[
                      { label: "Mã khiếu nại", value: `#${row.id}` },
                      { label: "Tiêu đề", value: row.title },
                      {
                        label: "Trạng thái",
                        value: (
                          <ComplaintStatusBadge
                            status={row.complaint_status}
                          />
                        ),
                      },
                      {
                        label: "Người gửi",
                        value: row.user?.fullname ?? "Khách",
                      },
                      { label: "Email", value: row.user?.email ?? "-" },
                      { label: "Tạo lúc", value: formatDate(row.created_at) },
                      { label: "Cập nhật", value: formatDate(row.updated_at) },
                    ]}
                    footer={
                      <div className="space-y-4">
                        {row.description ? (
                          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                            <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                              Nội dung
                            </div>
                            <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                              {row.description}
                            </p>
                          </div>
                        ) : null}
                        {row.response ? (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                            <div className="mono-label text-[10px] text-emerald-700 dark:text-emerald-400">
                              Phản hồi từ admin
                            </div>
                            <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                              {row.response}
                            </p>
                          </div>
                        ) : null}
                        {canUpdate &&
                        row.complaint_status === "in_progress" ? (
                          <div className="space-y-2 rounded-lg border border-sky-200 bg-sky-50/40 p-4 dark:border-sky-900/60 dark:bg-sky-950/40">
                            <label
                              htmlFor={`response-${row.id}`}
                              className="mono-label text-[10px] text-sky-700 dark:text-sky-400"
                            >
                              Soạn phản hồi
                            </label>
                            <Textarea
                              id={`response-${row.id}`}
                              rows={3}
                              value={responseInputs[row.id] ?? ""}
                              onChange={(e) =>
                                setResponseInputs((prev) => ({
                                  ...prev,
                                  [row.id]: e.target.value,
                                }))
                              }
                              placeholder="Nhập phản hồi cho người gửi..."
                            />
                          </div>
                        ) : null}
                      </div>
                    }
                  />
                  {canUpdate && row.complaint_status !== "resolved" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isMutating}
                      className={`gap-1.5 ${meta?.chipClass ?? ""}`}
                      onClick={() =>
                        updateComplaint.mutate({
                          complaintId: row.id,
                          payload: {
                            status: getNextComplaintStatus(
                              row.complaint_status,
                            ),
                            ...(row.complaint_status === "in_progress" &&
                            responseInputs[row.id]
                              ? { response: responseInputs[row.id] }
                              : {}),
                          },
                        })
                      }
                    >
                      {row.complaint_status === "pending" ? (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Tiếp nhận
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Hoàn tất
                        </>
                      )}
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <ConfirmDialog
                      trigger={
                        <Button type="button" variant="destructive" size="sm">
                          Xóa
                        </Button>
                      }
                      title="Xóa khiếu nại"
                      description={`Bạn có chắc muốn xóa khiếu nại #${row.id}?`}
                      destructive
                      isSubmitting={isMutating}
                      onConfirm={() => deleteComplaint.mutateAsync(row.id)}
                    />
                  ) : null}
                </ActionCell>
              );
            },
          },
        ]}
      />
    </div>
  );
}

function ComplaintCreateDialog({
  trigger,
}: {
  trigger: ReactNode;
}) {
  const create = useCreateComplaint();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userId, setUserId] = useState("");

  return (
    <FormDialog
      trigger={trigger}
      title="Thêm khiếu nại"
      isSubmitting={create.isPending}
      onOpen={() => {
        setTitle("");
        setDescription("");
        setUserId("");
      }}
      onSubmit={() =>
        create.mutateAsync({
          title,
          description,
          userId: userId ? Number(userId) : undefined,
        })
      }
    >
      <FormField label="Tiêu đề" htmlFor="complaint-title" required>
        <Input
          id="complaint-title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormField>
      <FormField label="Nội dung" htmlFor="complaint-desc" required>
        <Textarea
          id="complaint-desc"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormField>
      <FormField label="ID người gửi (tuỳ chọn)" htmlFor="complaint-user">
        <Input
          id="complaint-user"
          type="number"
          min={1}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </FormField>
    </FormDialog>
  );
}

type NotificationAudienceMode = "SINGLE" | "ALL" | "ROLE" | "USERS";

const AUDIENCE_MODE_OPTIONS: { value: NotificationAudienceMode; label: string }[] = [
  { value: "SINGLE", label: "Một người dùng" },
  { value: "ALL", label: "Tất cả người dùng" },
  { value: "ROLE", label: "Theo vai trò" },
  { value: "USERS", label: "Người dùng cụ thể" },
];

function NotificationCreateDialog({
  trigger,
}: {
  trigger: ReactNode;
}) {
  const create = useCreateNotification();
  const sendBroadcast = useSendNotificationBroadcast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [recipientError, setRecipientError] = useState("");
  const [audienceMode, setAudienceMode] =
    useState<NotificationAudienceMode>("SINGLE");
  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(
    new Set(),
  );
  const recipientsQuery = useInfiniteNotificationRecipients({
    limit: 20,
    search: userSearch || undefined,
  });
  const eligibleUsers =
    recipientsQuery.data?.pages.flatMap((page) => page.data.users) ?? [];
  const rolesQuery = useRoles({
    page: 1,
    limit: 100,
    search: "",
    arrange: "asc",
  });
  const roles = rolesQuery.data?.data?.roles ?? [];

  const toggleUserId = (userId: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
    setRecipientError("");
  };

  return (
    <FormDialog
      trigger={trigger}
      title="Thêm thông báo"
      isSubmitting={create.isPending || sendBroadcast.isPending}
      onOpen={() => {
        setTitle("");
        setContent("");
        setActionUrl("");
        setUserSearch("");
        setSelectedUser(null);
        setRecipientError("");
        setAudienceMode("SINGLE");
        setSelectedRoleName("");
        setSelectedUserIds(new Set());
      }}
      onSubmit={() => {
        if (audienceMode === "SINGLE") {
          if (!selectedUser) {
            setRecipientError("Vui lòng chọn người nhận.");
            throw new Error("Missing notification recipient");
          }
          return create.mutateAsync({
            title,
            content,
            userId: selectedUser.id,
            actionUrl: actionUrl || undefined,
          });
        }
        if (audienceMode === "ROLE" && !selectedRoleName) {
          setRecipientError("Vui lòng chọn vai trò.");
          throw new Error("Missing role");
        }
        if (audienceMode === "USERS" && selectedUserIds.size === 0) {
          setRecipientError("Vui lòng chọn ít nhất một người dùng.");
          throw new Error("Missing recipients");
        }
        return sendBroadcast.mutateAsync({
          title,
          content,
          actionUrl: actionUrl || undefined,
          audience: audienceMode,
          ...(audienceMode === "ROLE" ? { roleName: selectedRoleName } : {}),
          ...(audienceMode === "USERS"
            ? { userIds: [...selectedUserIds] }
            : {}),
        });
      }}
    >
      <FormField label="Tiêu đề" htmlFor="notif-title" required>
        <Input
          id="notif-title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormField>
      <FormField label="Nội dung" htmlFor="notif-content" required>
        <Textarea
          id="notif-content"
          required
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </FormField>
      <FormField label="Đối tượng nhận">
        <div className="flex flex-wrap gap-4">
          {AUDIENCE_MODE_OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <input
                type="radio"
                name="notif-audience"
                value={value}
                checked={audienceMode === value}
                onChange={() => {
                  setAudienceMode(value);
                  setRecipientError("");
                }}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </FormField>
      {audienceMode === "SINGLE" ? (
        <FormField
          label="Người nhận"
          htmlFor="notif-user-search"
          required
          hint="Hiển thị tài khoản đang hoạt động thuộc mọi vai trò."
        >
          <Input
            id="notif-user-search"
            type="search"
            placeholder="Tìm theo tên hoặc email"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
          />
          <div
            className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-1.5 dark:border-slate-800"
            onScroll={(event) => {
              const { scrollTop, scrollHeight, clientHeight } =
                event.currentTarget;
              const isNearBottom =
                scrollHeight - scrollTop - clientHeight < 48;
              if (
                isNearBottom &&
                recipientsQuery.hasNextPage &&
                !recipientsQuery.isFetchingNextPage
              ) {
                void recipientsQuery.fetchNextPage();
              }
            }}
          >
            {recipientsQuery.isLoading ? (
              <p className="px-2 py-3 text-xs text-slate-500">
                Đang tìm người dùng...
              </p>
            ) : eligibleUsers.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-500">
                Không tìm thấy người nhận phù hợp.
              </p>
            ) : (
              eligibleUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(user);
                    setRecipientError("");
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    selectedUser?.id === user.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-bold">
                      {user.fullname}
                    </span>
                    <span className="block truncate text-slate-500">
                      {user.email}
                    </span>
                  </span>
                  <Badge variant="outline">
                    {user.roles.map(({ role_name }) => role_name).join(", ")}
                  </Badge>
                </button>
              ))
            )}
            {recipientsQuery.isFetchingNextPage ? (
              <p className="px-2 py-2 text-center text-xs text-slate-500">
                Đang tải thêm...
              </p>
            ) : null}
          </div>
          {selectedUser ? (
            <p className="text-xs font-semibold text-emerald-600">
              Đã chọn: {selectedUser.fullname} ({selectedUser.email})
            </p>
          ) : null}
        </FormField>
      ) : audienceMode === "ALL" ? (
        <FormField label="Đối tượng">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Thông báo sẽ được gửi tới toàn bộ tài khoản đang hoạt động (gồm
            cả patient, doctor và admin).
          </p>
        </FormField>
      ) : audienceMode === "ROLE" ? (
        <FormField label="Vai trò" htmlFor="notif-role" required>
          <select
            id="notif-role"
            value={selectedRoleName}
            onChange={(event) => {
              setSelectedRoleName(event.target.value);
              setRecipientError("");
            }}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">-- Chọn vai trò --</option>
            {roles.map((role) => (
              <option key={role.id} value={role.role_name}>
                {role.role_name}
              </option>
            ))}
          </select>
        </FormField>
      ) : (
        <FormField
          label="Người nhận cụ thể"
          htmlFor="notif-users-search"
          required
          hint="Chọn nhiều người dùng bằng checkbox."
        >
          <Input
            id="notif-users-search"
            type="search"
            placeholder="Tìm theo tên hoặc email"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
          />
          <div
            className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-1.5 dark:border-slate-800"
            onScroll={(event) => {
              const { scrollTop, scrollHeight, clientHeight } =
                event.currentTarget;
              const isNearBottom =
                scrollHeight - scrollTop - clientHeight < 48;
              if (
                isNearBottom &&
                recipientsQuery.hasNextPage &&
                !recipientsQuery.isFetchingNextPage
              ) {
                void recipientsQuery.fetchNextPage();
              }
            }}
          >
            {recipientsQuery.isLoading ? (
              <p className="px-2 py-3 text-xs text-slate-500">
                Đang tìm người dùng...
              </p>
            ) : eligibleUsers.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-500">
                Không tìm thấy người nhận phù hợp.
              </p>
            ) : (
              eligibleUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(user.id)}
                      onChange={() => toggleUserId(user.id)}
                      className="accent-primary size-3.5"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-bold">
                        {user.fullname}
                      </span>
                      <span className="block truncate text-slate-500">
                        {user.email}
                      </span>
                    </span>
                  </span>
                  <Badge variant="outline">
                    {user.roles.map(({ role_name }) => role_name).join(", ")}
                  </Badge>
                </label>
              ))
            )}
            {recipientsQuery.isFetchingNextPage ? (
              <p className="px-2 py-2 text-center text-xs text-slate-500">
                Đang tải thêm...
              </p>
            ) : null}
          </div>
          {selectedUserIds.size > 0 ? (
            <p className="text-xs font-semibold text-emerald-600">
              Đã chọn: {selectedUserIds.size} người
            </p>
          ) : null}
        </FormField>
      )}
      {recipientError ? (
        <p className="text-xs font-semibold text-rose-600">
          {recipientError}
        </p>
      ) : null}
      <FormField
        label="Đường dẫn khi nhấn (tuỳ chọn)"
        htmlFor="notif-action-url"
        hint="Chỉ chấp nhận đường dẫn nội bộ bắt đầu bằng /."
      >
        <Input
          id="notif-action-url"
          placeholder="/admin/appointments"
          pattern="^/(?!/).*"
          value={actionUrl}
          onChange={(event) => setActionUrl(event.target.value)}
        />
      </FormField>
    </FormDialog>
  );
}

function NotificationsModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const { data, isLoading, isError, refetch } = useNotifications({
    page,
    limit,
    search: search || undefined,
  });
  const rows = data?.data?.notifications ?? [];
  const total = data?.data?.total ?? 0;
  const deleteNotification = useDeleteNotification();
  const { can } = usePermission();
  const canCreate = can(
    PERMISSIONS.NOTIFICATION_CREATE,
    PERMISSIONS.NOTIFICATION_SEND,
    PERMISSIONS.NOTIFICATION_MANAGE,
  );
  const canDelete = can(
    PERMISSIONS.NOTIFICATION_DELETE,
    PERMISSIONS.NOTIFICATION_MANAGE,
  );

  return (
    <GenericList
      title="Thông báo"
      rows={rows}
      total={total}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      rowKey={(row) => row.id}
      toolbar={
        canCreate ? (
          <NotificationCreateDialog
            trigger={<Button size="sm">+ Thêm thông báo</Button>}
          />
        ) : null
      }
      columns={[
        { key: "id", label: "ID", render: (row) => row.id },
        { key: "title", label: "Tiêu đề", render: (row) => row.title },
        {
          key: "user",
          label: "Người nhận",
          render: (row) => row.user?.fullname ?? "-",
        },
        {
          key: "isRead",
          label: "Trạng thái đọc",
          render: (row) =>
            row.isRead ? (
              <Badge variant="success">Đã đọc</Badge>
            ) : (
              <Badge variant="warning">Chưa đọc</Badge>
            ),
        },
        {
          key: "actions",
          label: "Thao tác",
          render: (row) => (
            <ActionCell>
              <ViewDetailButton
                title={`Thông báo #${row.id}`}
                description={row.title}
                rows={[
                  { label: "ID", value: row.id },
                  { label: "Tiêu đề", value: row.title },
                  { label: "Người nhận", value: row.user?.fullname ?? "-" },
                  { label: "Email", value: row.user?.email ?? "-" },
                  {
                    label: "Trạng thái đọc",
                    value: row.isRead ? (
                      <Badge variant="success">Đã đọc</Badge>
                    ) : (
                      <Badge variant="warning">Chưa đọc</Badge>
                    ),
                  },
                  { label: "Loại", value: row.type },
                  { label: "Tạo lúc", value: formatDate(row.createdAt) },
                  { label: "Cập nhật", value: formatDate(row.updatedAt) },
                ]}
                footer={
                  row.content ? (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                      <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                        Nội dung
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                        {row.content}
                      </p>
                    </div>
                  ) : null
                }
              />
              {canDelete ? (
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="destructive" size="sm">
                      Xóa
                    </Button>
                  }
                  title="Xóa thông báo"
                  description={`Xóa thông báo #${row.id}?`}
                  destructive
                  isSubmitting={deleteNotification.isPending}
                  onConfirm={() => deleteNotification.mutateAsync(row.id)}
                />
              ) : null}
            </ActionCell>
          ),
        },
      ]}
    />
  );
}

function SatisfactionRatingEditDialog({
  trigger,
  initial,
}: {
  trigger: ReactNode;
  initial: { id: number; rating: number; comment?: string | null };
}) {
  const update = useUpdateSatisfactionRating();
  const [rating, setRating] = useState(String(initial.rating));
  const [comment, setComment] = useState(initial.comment ?? "");

  return (
    <FormDialog
      trigger={trigger}
      title={`Sửa đánh giá #${initial.id}`}
      isSubmitting={update.isPending}
      onOpen={() => {
        setRating(String(initial.rating));
        setComment(initial.comment ?? "");
      }}
      onSubmit={() =>
        update.mutateAsync({
          ratingId: initial.id,
          payload: {
            rating: Number(rating),
            comment: comment || undefined,
          },
        })
      }
    >
      <FormField label="Điểm" htmlFor="rating-value" required>
        <Input
          id="rating-value"
          required
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />
      </FormField>
      <FormField label="Nhận xét" htmlFor="rating-comment">
        <Textarea
          id="rating-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </FormField>
    </FormDialog>
  );
}

function SatisfactionRatingsModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const { data, isLoading, isError, refetch } = useSatisfactionRatings({
    page,
    limit,
    search: search || undefined,
  });
  const rows = data?.data?.satisfactionRatings ?? [];
  const total = data?.data?.total ?? 0;
  const { can } = usePermission();
  const canUpdate = can(
    PERMISSIONS.SATISFACTION_RATING_UPDATE,
    PERMISSIONS.SATISFACTION_RATING_MANAGE,
  );

  return (
    <GenericList
      title="Đánh giá"
      rows={rows}
      total={total}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      rowKey={(row) => row.id}
      columns={[
        { key: "id", label: "ID", render: (row) => row.id },
        { key: "rating", label: "Điểm", render: (row) => row.rating },
        {
          key: "doctor",
          label: "Bác sĩ",
          render: (row) => row.doctor?.fullname ?? "-",
        },
        {
          key: "patient",
          label: "Bệnh nhân",
          render: (row) => row.patient?.fullname ?? "-",
        },
        {
          key: "comment",
          label: "Nhận xét",
          render: (row) => row.comment ?? "-",
        },
        {
          key: "actions",
          label: "Thao tác",
          render: (row) => (
            <ActionCell>
              <ViewDetailButton
                title={`Đánh giá #${row.id}`}
                description={`${row.rating} sao`}
                rows={[
                  { label: "ID", value: row.id },
                  { label: "Điểm", value: row.rating },
                  { label: "Bác sĩ", value: row.doctor?.fullname ?? "-" },
                  { label: "Bệnh nhân", value: row.patient?.fullname ?? "-" },
                  {
                    label: "Lịch hẹn liên quan",
                    value: row.appointment_id ?? "-",
                  },
                  { label: "Tạo lúc", value: formatDate(row.created_at) },
                  { label: "Cập nhật", value: formatDate(row.updated_at) },
                ]}
                footer={
                  row.comment ? (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                      <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                        Nhận xét
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                        {row.comment}
                      </p>
                    </div>
                  ) : null
                }
              />
              {canUpdate ? (
                <SatisfactionRatingEditDialog
                  initial={row}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      Sửa
                    </Button>
                  }
                />
              ) : null}
            </ActionCell>
          ),
        },
      ]}
    />
  );
}

function ExaminationResultFormDialog({
  trigger,
  initial,
  mode,
  appointmentId,
}: {
  trigger: ReactNode;
  initial?: ExaminationResult;
  mode: "create" | "edit";
  appointmentId?: number;
}) {
  const create = useCreateExaminationResult();
  const update = useUpdateExaminationResult();
  const [symptoms, setSymptoms] = useState(initial?.symptoms ?? "");
  const [diagnosis, setDiagnosis] = useState(initial?.diagnosis ?? "");
  const [treatment, setTreatment] = useState(initial?.treatment ?? "");
  const [prescription, setPrescription] = useState(initial?.prescription ?? "");
  const [appointmentIdInput, setAppointmentIdInput] = useState(
    appointmentId ? String(appointmentId) : "",
  );

  return (
    <FormDialog
      trigger={trigger}
      title={mode === "create" ? "Thêm kết quả khám" : `Sửa kết quả #${initial?.id}`}
      isSubmitting={create.isPending || update.isPending}
      onOpen={() => {
        if (mode === "edit") {
          setSymptoms(initial?.symptoms ?? "");
          setDiagnosis(initial?.diagnosis ?? "");
          setTreatment(initial?.treatment ?? "");
          setPrescription(initial?.prescription ?? "");
        } else {
          setSymptoms("");
          setDiagnosis("");
          setTreatment("");
          setPrescription("");
          setAppointmentIdInput(appointmentId ? String(appointmentId) : "");
        }
      }}
      onSubmit={() =>
        mode === "create"
          ? create.mutateAsync({
              appointment_id: Number(appointmentIdInput),
              symptoms,
              diagnosis,
              treatment,
              prescription,
            })
          : update.mutateAsync({
              resultId: initial!.id,
              payload: {
                symptoms,
                diagnosis,
                treatment,
                prescription,
              },
            })
      }
    >
      {mode === "create" && !appointmentId ? (
        <FormField label="Mã lịch hẹn" htmlFor="exam-appointment-id" required>
          <Input
            id="exam-appointment-id"
            type="number"
            min={1}
            required
            value={appointmentIdInput}
            onChange={(e) => setAppointmentIdInput(e.target.value)}
          />
        </FormField>
      ) : null}
      <FormField label="Triệu chứng" htmlFor="exam-symptoms" required>
        <Textarea
          id="exam-symptoms"
          rows={3}
          required
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
        />
      </FormField>
      <FormField label="Chẩn đoán" htmlFor="exam-diagnosis" required>
        <Input
          id="exam-diagnosis"
          required
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
      </FormField>
      <FormField label="Phác đồ điều trị" htmlFor="exam-treatment" required>
        <Textarea
          id="exam-treatment"
          rows={3}
          required
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
        />
      </FormField>
      <FormField label="Đơn thuốc" htmlFor="exam-prescription" required>
        <Textarea
          id="exam-prescription"
          rows={3}
          required
          value={prescription}
          onChange={(e) => setPrescription(e.target.value)}
        />
      </FormField>
    </FormDialog>
  );
}

function ExamResultsModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
  scope,
}: ModuleViewProps & { scope?: "admin" | "doctor" }) {
  const isDoctorScope = scope === "doctor";
  const doctorResults = useDoctorExaminationResults(
    { page, limit },
    { enabled: isDoctorScope },
  );
  const adminResults = useExaminationResults(
    { page, limit, search: search || undefined },
    { enabled: !isDoctorScope },
  );
  const { data, isLoading, isError, refetch } = isDoctorScope
    ? doctorResults
    : adminResults;
  const rows = data?.data?.examinationResults ?? [];
  const total = data?.data?.total ?? 0;
  const deleteResult = useDeleteExaminationResult();
  const { can } = usePermission();
  const canCreate = can(
    PERMISSIONS.EXAMINATION_RESULT_CREATE,
    PERMISSIONS.EXAMINATION_RESULT_MANAGE,
  );
  const canUpdate = can(
    PERMISSIONS.EXAMINATION_RESULT_UPDATE,
    PERMISSIONS.EXAMINATION_RESULT_MANAGE,
  );
  const canDelete = can(
    PERMISSIONS.EXAMINATION_RESULT_DELETE,
    PERMISSIONS.EXAMINATION_RESULT_MANAGE,
  );

  return (
    <GenericList
      title="Kết quả khám"
      rows={rows}
      total={total}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      rowKey={(row) => row.id}
      toolbar={
        canCreate ? (
          <ExaminationResultFormDialog
            mode="create"
            trigger={<Button size="sm">+ Thêm kết quả</Button>}
          />
        ) : null
      }
      columns={[
        { key: "id", label: "ID", render: (row) => row.id },
        {
          key: "patient",
          label: "Bệnh nhân",
          render: (row) => row.patient?.fullname ?? "-",
        },
        {
          key: "doctor",
          label: "Bác sĩ",
          render: (row) => row.doctor?.fullname ?? "-",
        },
        {
          key: "diagnosis",
          label: "Chẩn đoán",
          render: (row) => row.diagnosis ?? "-",
        },
        {
          key: "examined_at",
          label: "Ngày khám",
          render: (row) => row.examined_at ?? row.created_at ?? "-",
        },
        {
          key: "actions",
          label: "Thao tác",
          render: (row) => (
            <ActionCell>
              <ViewDetailButton
                title={`Kết quả khám #${row.id}`}
                description={row.diagnosis ?? ""}
                rows={[
                  { label: "ID", value: row.id },
                  { label: "Bệnh nhân", value: row.patient?.fullname ?? "-" },
                  { label: "Bác sĩ", value: row.doctor?.fullname ?? "-" },
                  { label: "Chẩn đoán", value: row.diagnosis ?? "-" },
                  {
                    label: "Ngày khám",
                    value: formatDate(row.examined_at ?? row.created_at),
                  },
                  { label: "Tạo lúc", value: formatDate(row.created_at) },
                  { label: "Cập nhật", value: formatDate(row.updated_at) },
                ]}
                footer={
                  row.symptoms ||
                  row.treatment ||
                  row.prescription ||
                  row.notes ? (
                    <div className="space-y-3">
                      {row.symptoms ? (
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                          <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                            Triệu chứng
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                            {row.symptoms}
                          </p>
                        </div>
                      ) : null}
                      {row.treatment ? (
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                          <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                            Phác đồ
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                            {row.treatment}
                          </p>
                        </div>
                      ) : null}
                      {row.prescription ? (
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                          <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                            Đơn thuốc
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                            {row.prescription}
                          </p>
                        </div>
                      ) : null}
                      {row.notes ? (
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                          <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                            Ghi chú
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                            {row.notes}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null
                }
              />
              {canUpdate ? (
                <ExaminationResultFormDialog
                  mode="edit"
                  initial={row}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      Sửa
                    </Button>
                  }
                />
              ) : null}
              {canDelete ? (
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="destructive" size="sm">
                      Xóa
                    </Button>
                  }
                  title="Xóa kết quả khám"
                  description={`Xóa kết quả khám #${row.id}?`}
                  destructive
                  isSubmitting={deleteResult.isPending}
                  onConfirm={() => deleteResult.mutateAsync(row.id)}
                />
              ) : null}
            </ActionCell>
          ),
        },
      ]}
    />
  );
}

function AppointmentCreateDialog({
  trigger,
}: {
  trigger: ReactNode;
}) {
  const create = useCreateAppointment();
  const [doctorId, setDoctorId] = useState<number | undefined>();
  const [scheduleId, setScheduleId] = useState<number | undefined>();
  const [appointmentDate, setAppointmentDate] = useState("");
  const [relativeId, setRelativeId] = useState<number | undefined>();

  const PICKER_LIMIT = 10;
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorPage, setDoctorPage] = useState(1);
  const [relativeSearch, setRelativeSearch] = useState("");
  const [relativePage, setRelativePage] = useState(1);

  const doctorsQuery = useDoctors({
    page: doctorPage,
    limit: PICKER_LIMIT,
    search: doctorSearch || undefined,
  });
  const doctors: Doctor[] = useMemo(
    () => doctorsQuery.data?.data?.doctors ?? [],
    [doctorsQuery.data?.data?.doctors],
  );
  const doctorsTotal = doctorsQuery.data?.data?.total ?? 0;
  const doctorsTotalPages = Math.max(1, Math.ceil(doctorsTotal / PICKER_LIMIT));
  const selectedDoctor = useMemo(
    () => doctors.find((doc) => doc.id === doctorId),
    [doctors, doctorId],
  );

  const schedulesQuery = useDoctorSchedulesByDoctorId(doctorId ?? 0);
  const groupedSchedules = useMemo(
    () =>
      (schedulesQuery.data?.data ?? {}) as Record<
        string,
        Array<{
          id: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
        }>
      >,
    [schedulesQuery.data?.data],
  );
  const flatSchedules = useMemo(() => {
    const list: Array<{
      id: number;
      day_of_week: string;
      start_time?: string;
      end_time?: string;
      is_active?: boolean;
    }> = [];
    Object.entries(groupedSchedules).forEach(([day, items]) => {
      (items ?? []).forEach((item) => {
        list.push({ ...item, day_of_week: day });
      });
    });
    return list.filter((item) => item.is_active !== false);
  }, [groupedSchedules]);

  const SCHEDULE_PAGE_SIZE = 10;
  const [schedulePage, setSchedulePage] = useState(1);
  const [scheduleSearch, setScheduleSearch] = useState("");
  const filteredSchedules = useMemo(() => {
    const term = scheduleSearch.trim().toLowerCase();
    if (!term) return flatSchedules;
    return flatSchedules.filter((schedule) =>
      [
        schedule.day_of_week,
        schedule.start_time ?? "",
        schedule.end_time ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [flatSchedules, scheduleSearch]);
  const scheduleTotalPages = Math.max(
    1,
    Math.ceil(filteredSchedules.length / SCHEDULE_PAGE_SIZE),
  );
  const pagedSchedules = useMemo(() => {
    const start = (schedulePage - 1) * SCHEDULE_PAGE_SIZE;
    return filteredSchedules.slice(start, start + SCHEDULE_PAGE_SIZE);
  }, [filteredSchedules, schedulePage]);
  const selectedSchedule = useMemo(
    () => flatSchedules.find((schedule) => schedule.id === scheduleId),
    [flatSchedules, scheduleId],
  );

  const relativesQuery = useAdminRelatives({
    page: relativePage,
    limit: PICKER_LIMIT,
    search: relativeSearch || undefined,
  });
  const relatives: Relative[] = useMemo(
    () => relativesQuery.data?.data?.relatives ?? [],
    [relativesQuery.data?.data?.relatives],
  );
  const relativesTotal = relativesQuery.data?.data?.total ?? 0;
  const relativesTotalPages = Math.max(
    1,
    Math.ceil(relativesTotal / PICKER_LIMIT),
  );
  const selectedRelative = useMemo(
    () => relatives.find((rel) => rel.id === relativeId),
    [relatives, relativeId],
  );

  return (
    <FormDialog
      trigger={trigger}
      title="Đặt lịch khám mới"
      description="Admin có thể đặt lịch khám hộ bệnh nhân từ các bác sĩ và ca khám đang hoạt động."
      isSubmitting={create.isPending}
      submitLabel="Đặt lịch"
      onOpen={() => {
        setDoctorId(undefined);
        setScheduleId(undefined);
        setAppointmentDate("");
        setRelativeId(undefined);
        setDoctorSearch("");
        setDoctorPage(1);
        setRelativeSearch("");
        setRelativePage(1);
        setSchedulePage(1);
        setScheduleSearch("");
      }}
      onSubmit={() => {
        if (!doctorId || !scheduleId || !appointmentDate || !relativeId) {
          throw new Error("Vui lòng điền đầy đủ thông tin");
        }
        return create.mutateAsync({
          appointment_date: appointmentDate,
          doctor_schedule_id: scheduleId,
          relative_id: relativeId,
          booking_mode: "user_select",
        });
      }}
    >
      <FormField label="Bác sĩ" htmlFor="appt-doctor" required>
        <SearchableSelect
          id="appt-doctor"
          placeholder="-- Chọn bác sĩ --"
          searchPlaceholder="Tìm bác sĩ..."
          search={doctorSearch}
          onSearchChange={(value) => {
            setDoctorSearch(value);
            setDoctorPage(1);
          }}
          isLoading={doctorsQuery.isFetching}
          page={doctorPage}
          totalPages={doctorsTotalPages}
          onPageChange={setDoctorPage}
          items={doctors.map((doc) => {
            const specialtyName =
              typeof doc.specialty === "string"
                ? doc.specialty
                : (doc.specialty?.name ?? doc.specialty?.specialty_name ?? "");
            return {
              value: doc.id,
              label: `${doc.fullname}${specialtyName ? ` - ${specialtyName}` : ""}`,
              hint: doc.workplace,
            };
          })}
          selectedValue={doctorId}
          selectedLabel={
            selectedDoctor
              ? `BS. ${selectedDoctor.fullname}${
                  typeof selectedDoctor.specialty === "string"
                    ? ` - ${selectedDoctor.specialty}`
                    : selectedDoctor.specialty?.name
                      ? ` - ${selectedDoctor.specialty.name}`
                      : ""
                }`
              : null
          }
          onSelect={(value) => {
            const next = typeof value === "number" ? value : undefined;
            setDoctorId(next);
            setScheduleId(undefined);
            setSchedulePage(1);
            setScheduleSearch("");
          }}
        />
      </FormField>

      <FormField
        label="Ca khám (theo lịch của bác sĩ)"
        htmlFor="appt-schedule"
        required
        hint={
          doctorId
            ? schedulesQuery.isLoading
              ? "Đang tải ca khám..."
              : flatSchedules.length === 0
                ? "Bác sĩ này chưa có ca khám đang hoạt động."
                : `Tổng ${flatSchedules.length} ca đang hoạt động.`
            : "Hãy chọn bác sĩ trước."
        }
      >
        <SearchableSelect
          id="appt-schedule"
          placeholder="-- Chọn ca khám --"
          searchPlaceholder="Tìm ca khám..."
          search={scheduleSearch}
          onSearchChange={(value) => {
            setScheduleSearch(value);
            setSchedulePage(1);
          }}
          isLoading={schedulesQuery.isLoading}
          page={schedulePage}
          totalPages={scheduleTotalPages}
          onPageChange={setSchedulePage}
          disabled={!doctorId || flatSchedules.length === 0}
          items={pagedSchedules.map((schedule) => ({
            value: schedule.id,
            label: `${schedule.day_of_week} • ${schedule.start_time ?? "?"} - ${schedule.end_time ?? "?"}`,
          }))}
          selectedValue={scheduleId}
          selectedLabel={
            selectedSchedule
              ? `${selectedSchedule.day_of_week} • ${selectedSchedule.start_time ?? "?"} - ${selectedSchedule.end_time ?? "?"}`
              : null
          }
          onSelect={(value) =>
            setScheduleId(typeof value === "number" ? value : undefined)
          }
        />
      </FormField>

      <FormField
        label="Ngày khám"
        htmlFor="appt-date"
        required
        hint="Ngày phải khớp với thứ trong tuần của ca khám đã chọn."
      >
        <Input
          id="appt-date"
          type="date"
          required
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
        />
      </FormField>

      <FormField label="Bệnh nhân (người thân)" htmlFor="appt-relative" required>
        <SearchableSelect
          id="appt-relative"
          placeholder="-- Chọn bệnh nhân --"
          searchPlaceholder="Tìm bệnh nhân..."
          search={relativeSearch}
          onSearchChange={(value) => {
            setRelativeSearch(value);
            setRelativePage(1);
          }}
          isLoading={relativesQuery.isFetching}
          page={relativePage}
          totalPages={relativesTotalPages}
          onPageChange={setRelativePage}
          items={relatives.map((relative) => ({
            value: relative.id,
            label: relative.fullname,
            hint: relative.phone ?? undefined,
          }))}
          selectedValue={relativeId}
          selectedLabel={
            selectedRelative
              ? `${selectedRelative.fullname}${selectedRelative.phone ? ` • ${selectedRelative.phone}` : ""}`
              : null
          }
          onSelect={(value) =>
            setRelativeId(typeof value === "number" ? value : undefined)
          }
        />
      </FormField>
    </FormDialog>
  );
}

type SearchableSelectItem = {
  value: number | string;
  label: string;
  hint?: string;
};

type SearchableSelectProps = {
  id?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  disabled?: boolean;
  items: SearchableSelectItem[];
  selectedValue?: number | string;
  selectedLabel?: string | null;
  onSelect: (value: number | string | undefined) => void;
};

function SearchableSelect({
  id,
  placeholder = "-- Chọn --",
  searchPlaceholder = "Tìm kiếm...",
  search,
  onSearchChange,
  isLoading,
  page,
  totalPages,
  onPageChange,
  disabled,
  items,
  selectedValue,
  selectedLabel,
  onSelect,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  const triggerLabel = selectedLabel ?? placeholder;
  const showPagination = totalPages > 1;

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 ${open ? "border-primary ring-2 ring-primary/20" : ""}`}
      >
        <span
          className={`truncate text-left ${selectedLabel ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}
        >
          {triggerLabel}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 dark:text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
            <Search className="size-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:outline-none focus-visible:outline-none focus-visible:ring-0 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {isLoading ? (
              <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                Đang tải...
              </div>
            ) : items.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                Không có kết quả.
              </div>
            ) : (
              items.map((item) => {
                const isSelected = item.value === selectedValue;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      onSelect(item.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${isSelected ? "bg-primary/10 text-primary font-bold dark:bg-primary/20 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"}`}
                  >
                    <span className="flex flex-col">
                      <span className="truncate">{item.label}</span>
                      {item.hint ? (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.hint}
                        </span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <Check className="size-4 shrink-0 text-primary dark:text-emerald-400" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {showPagination ? (
            <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => onPageChange(Math.max(1, page - 1))}
              >
                Trước
              </Button>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Trang {page}/{totalPages}
                {isLoading ? " • đang tải..." : ""}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() =>
                  onPageChange(Math.min(totalPages, page + 1))
                }
              >
                Sau
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RelativeFormDialog({
  trigger,
  initial,
  mode,
}: {
  trigger: ReactNode;
  initial?: Relative;
  mode: "create" | "edit";
}) {
  const create = useCreateRelative();
  const update = useUpdateRelative();
  const [fullname, setFullname] = useState(initial?.fullname ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(initial?.date_of_birth ?? "");
  const [gender, setGender] = useState<string>(
    initial?.gender === undefined ? "" : initial.gender ? "male" : "female",
  );

  return (
    <FormDialog
      trigger={trigger}
      title={mode === "create" ? "Thêm người thân" : `Sửa người thân #${initial?.id}`}
      isSubmitting={create.isPending || update.isPending}
      onOpen={() => {
        if (mode === "edit") {
          setFullname(initial?.fullname ?? "");
          setPhone(initial?.phone ?? "");
          setDateOfBirth(initial?.date_of_birth ?? "");
          setGender(
            initial?.gender === undefined ? "" : initial.gender ? "male" : "female",
          );
        }
      }}
      onSubmit={() =>
        mode === "create"
          ? create.mutateAsync({
              fullname,
              phone: phone || undefined,
              date_of_birth: dateOfBirth || undefined,
              gender: gender === "" ? undefined : gender === "male",
              relationship_code: "",
            })
          : update.mutateAsync({
              relativeId: initial!.id,
              payload: {
                fullname: fullname || undefined,
                phone: phone || undefined,
                date_of_birth: dateOfBirth || undefined,
                gender: gender === "" ? undefined : gender === "male",
              },
            })
      }
    >
      <FormField label="Họ tên" htmlFor="rel-fullname" required>
        <Input
          id="rel-fullname"
          required
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
        />
      </FormField>
      <FormField label="Số điện thoại" htmlFor="rel-phone">
        <Input
          id="rel-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </FormField>
      <FormField label="Ngày sinh" htmlFor="rel-dob">
        <Input
          id="rel-dob"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
      </FormField>
      <FormField label="Giới tính" htmlFor="rel-gender">
        <select
          id="rel-gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">Chưa chọn</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </select>
      </FormField>
    </FormDialog>
  );
}

function RelativesModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const { data, isLoading, isError, refetch } = useAdminRelatives({
    page,
    limit,
    search: search || undefined,
  });
  const rows = data?.data?.relatives ?? [];
  const total = data?.data?.total ?? 0;
  const deleteRelative = useDeleteRelative();
  const { can } = usePermission();
  const canCreate = can(
    PERMISSIONS.RELATIVE_CREATE,
    PERMISSIONS.RELATIVE_MANAGE,
  );
  const canUpdate = can(
    PERMISSIONS.RELATIVE_UPDATE,
    PERMISSIONS.RELATIVE_MANAGE,
  );
  const canDelete = can(
    PERMISSIONS.RELATIVE_DELETE,
    PERMISSIONS.RELATIVE_MANAGE,
  );

  return (
    <GenericList
      title="Người thân"
      rows={rows}
      total={total}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      rowKey={(row) => row.id}
      toolbar={
        canCreate ? (
          <RelativeFormDialog
            mode="create"
            trigger={<Button size="sm">+ Thêm người thân</Button>}
          />
        ) : null
      }
      columns={[
        { key: "id", label: "ID", render: (row) => row.id },
        { key: "fullname", label: "Họ tên", render: (row) => row.fullname },
        { key: "phone", label: "SĐT", render: (row) => row.phone ?? "-" },
        {
          key: "relationship",
          label: "Quan hệ",
          render: (row) =>
            row.relationship?.name ??
            row.relationship?.relationship_code ??
            "-",
        },
        {
          key: "actions",
          label: "Thao tác",
          render: (row) => (
            <ActionCell>
              <ViewDetailButton
                title={`Người thân #${row.id}`}
                description={row.fullname}
                rows={[
                  { label: "ID", value: row.id },
                  { label: "Họ tên", value: row.fullname },
                  { label: "Số điện thoại", value: row.phone ?? "-" },
                  {
                    label: "Quan hệ",
                    value:
                      row.relationship?.name ??
                      row.relationship?.relationship_code ??
                      "-",
                  },
                  {
                    label: "Mã quan hệ",
                    value: row.relationship?.relationship_code ?? "-",
                  },
                  {
                    label: "Giới tính",
                    value:
                      row.gender === undefined ? "-" : row.gender ? "Nam" : "Nữ",
                  },
                  { label: "Ngày sinh", value: formatDate(row.date_of_birth) },
                  { label: "Tạo lúc", value: formatDate(row.created_at) },
                  { label: "Cập nhật", value: formatDate(row.updated_at) },
                ]}
              />
              {canUpdate ? (
                <RelativeFormDialog
                  mode="edit"
                  initial={row}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      Sửa
                    </Button>
                  }
                />
              ) : null}
              {canDelete ? (
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="destructive" size="sm">
                      Xóa
                    </Button>
                  }
                  title="Xóa người thân"
                  description={`Xóa người thân #${row.id} (${row.fullname})?`}
                  destructive
                  isSubmitting={deleteRelative.isPending}
                  onConfirm={() => deleteRelative.mutateAsync(row.id)}
                />
              ) : null}
            </ActionCell>
          ),
        },
      ]}
    />
  );
}

function HealthProfilesModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const { data, isLoading, isError, refetch } = useAdminHealthProfiles({
    page,
    limit,
    search: search || undefined,
  });
  const rows = data?.data?.healthProfiles ?? [];
  const total = data?.data?.total ?? 0;

  return (
    <GenericList
      title="Hồ sơ sức khỏe"
      rows={rows}
      total={total}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      rowKey={(row) => row.id}
      columns={[
        { key: "id", label: "ID", render: (row) => row.id },
        {
          key: "patient",
          label: "Người dùng",
          render: (row) => row.patient?.fullname ?? "-",
        },
        {
          key: "blood_type",
          label: "Nhóm máu",
          render: (row) => row.blood_type ?? "-",
        },
        {
          key: "height",
          label: "Chiều cao",
          render: (row) => (row.height ? `${row.height} cm` : "-"),
        },
        {
          key: "weight",
          label: "Cân nặng",
          render: (row) => (row.weight ? `${row.weight} kg` : "-"),
        },
        {
          key: "actions",
          label: "Thao tác",
          render: (row) => (
            <ActionCell>
              <ViewDetailButton
                title={`Hồ sơ sức khỏe #${row.id}`}
                description={row.patient?.fullname ?? ""}
                rows={[
                  { label: "ID", value: row.id },
                  { label: "Người dùng", value: row.patient?.fullname ?? "-" },
                  {
                    label: "Quan hệ",
                    value:
                      row.patient?.relationship?.name ??
                      row.patient?.relationship?.relationship_code ??
                      "-",
                  },
                  { label: "Nhóm máu", value: row.blood_type ?? "-" },
                  {
                    label: "Chiều cao",
                    value: row.height ? `${row.height} cm` : "-",
                  },
                  {
                    label: "Cân nặng",
                    value: row.weight ? `${row.weight} kg` : "-",
                  },
                  { label: "Tạo lúc", value: formatDate(row.created_at) },
                  { label: "Cập nhật", value: formatDate(row.updated_at) },
                ]}
                footer={
                  row.allergies || row.medical_history ? (
                    <div className="space-y-3">
                      {row.allergies ? (
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                          <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                            Dị ứng
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                            {row.allergies}
                          </p>
                        </div>
                      ) : null}
                      {row.medical_history ? (
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                          <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                            Tiền sử bệnh
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                            {row.medical_history}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null
                }
              />
            </ActionCell>
          ),
        },
      ]}
    />
  );
}

type RelationshipFormState = {
  relationship_code: string;
  relationship_name: string;
  description: string;
};

function RelationshipFormDialog({
  trigger,
  initial,
  mode,
}: {
  trigger: ReactNode;
  initial?: Relationship;
  mode: "create" | "edit";
}) {
  const create = useCreateRelationship();
  const update = useUpdateRelationship();
  const [form, setForm] = useState<RelationshipFormState>({
    relationship_code: initial?.relationship_code ?? "",
    relationship_name: initial?.relationship_name ?? initial?.name ?? "",
    description: initial?.description ?? "",
  });

  return (
    <FormDialog
      trigger={trigger}
      title={
        mode === "create"
          ? "Thêm mối quan hệ"
          : `Sửa "${initial?.relationship_name || initial?.name || initial?.relationship_code}"`
      }
      isSubmitting={create.isPending || update.isPending}
      onOpen={() =>
        setForm({
          relationship_code: initial?.relationship_code ?? "",
          relationship_name: initial?.relationship_name ?? initial?.name ?? "",
          description: initial?.description ?? "",
        })
      }
      onSubmit={() =>
        mode === "create"
          ? create.mutateAsync({
              relationship_code: form.relationship_code,
              relationship_name: form.relationship_name,
              description: form.description || undefined,
            })
          : update.mutateAsync({
              relationshipCode: initial!.relationship_code,
              payload: {
                relationship_name: form.relationship_name || undefined,
                description: form.description || undefined,
              },
            })
      }
    >
      {mode === "create" ? (
        <FormField label="Mã quan hệ" htmlFor="relationship-code" required>
          <Input
            id="relationship-code"
            required
            value={form.relationship_code}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                relationship_code: event.target.value,
              }))
            }
          />
        </FormField>
      ) : null}
      <FormField label="Tên hiển thị" htmlFor="relationship-name">
        <Input
          id="relationship-name"
          value={form.relationship_name}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, relationship_name: event.target.value }))
          }
        />
      </FormField>
      <FormField label="Mô tả" htmlFor="relationship-description">
        <Textarea
          id="relationship-description"
          value={form.description}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, description: event.target.value }))
          }
        />
      </FormField>
    </FormDialog>
  );
}

function RelationshipsModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const { data, isLoading, isError, refetch } = useRelationships({
    page,
    limit,
    search: search || undefined,
  });
  const rows = data?.data?.relationships ?? [];
  const total = data?.data?.total ?? 0;
  const deleteRelationship = useDeleteRelationship();
  const { can } = usePermission();

  const canCreate = can(
    PERMISSIONS.RELATIONSHIP_CREATE,
    PERMISSIONS.RELATIONSHIP_MANAGE,
  );
  const canUpdate = can(
    PERMISSIONS.RELATIONSHIP_UPDATE,
    PERMISSIONS.RELATIONSHIP_MANAGE,
  );
  const canDelete = can(
    PERMISSIONS.RELATIONSHIP_DELETE,
    PERMISSIONS.RELATIONSHIP_MANAGE,
  );

  return (
    <GenericList
      title="Quan hệ"
      rows={rows}
      total={total}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      rowKey={(row) => row.relationship_code}
      toolbar={
        canCreate ? (
          <RelationshipFormDialog
            mode="create"
            trigger={<Button size="sm">+ Thêm quan hệ</Button>}
          />
        ) : null
      }
      columns={[
        {
          key: "relationship_name",
          label: "Tên hiển thị",
          render: (row) => (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {row.relationship_name || row.name || row.relationship_code}
              </span>
              {row.relationship_name || row.name ? (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mã: {row.relationship_code}
                </span>
              ) : null}
            </div>
          ),
        },
        {
          key: "description",
          label: "Mô tả",
          render: (row) => row.description ?? "-",
        },
        {
          key: "actions",
          label: "Thao tác",
          render: (row) => (
            <ActionCell>
              <ViewDetailButton
                title={`Quan hệ "${row.relationship_name || row.name || row.relationship_code}"`}
                rows={[
                  { label: "Mã quan hệ", value: row.relationship_code },
                  { label: "Tên hiển thị", value: row.relationship_name || row.name || "-" },
                  { label: "Mô tả", value: row.description ?? "-" },
                ]}
              />
              {canUpdate ? (
                <RelationshipFormDialog
                  mode="edit"
                  initial={row}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      Sửa
                    </Button>
                  }
                />
              ) : null}
              {canDelete ? (
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="destructive" size="sm">
                      Xóa
                    </Button>
                  }
                  title="Xóa quan hệ"
                  description={`Xóa quan hệ "${row.name || row.relationship_code}"?`}
                  destructive
                  isSubmitting={deleteRelationship.isPending}
                  onConfirm={() =>
                    deleteRelationship.mutateAsync(row.relationship_code)
                  }
                />
              ) : null}
            </ActionCell>
          ),
        },
      ]}
    />
  );
}

type SpecialtyFormState = {
  name: string;
  description: string;
  file: File | null;
};

function SpecialtyCreateDialog({ trigger }: { trigger: ReactNode }) {
  const create = useCreateSpecialty();
  const [form, setForm] = useState<SpecialtyFormState>({
    name: "",
    description: "",
    file: null,
  });

  return (
    <FormDialog
      trigger={trigger}
      title="Thêm chuyên khoa"
      isSubmitting={create.isPending}
      onOpen={() => setForm({ name: "", description: "", file: null })}
      onSubmit={() => {
        if (!form.file) {
          throw new Error("missing file");
        }
        return create.mutateAsync({
          name: form.name,
          description: form.description,
          file: form.file,
        });
      }}
    >
      <FormField label="Tên chuyên khoa" htmlFor="specialty-name" required>
        <Input
          id="specialty-name"
          required
          value={form.name}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, name: event.target.value }))
          }
        />
      </FormField>
      <FormField label="Mô tả" htmlFor="specialty-description" required>
        <Textarea
          id="specialty-description"
          required
          value={form.description}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, description: event.target.value }))
          }
        />
      </FormField>
      <FormField label="Ảnh đại diện" htmlFor="specialty-file" required>
        <input
          id="specialty-file"
          type="file"
          accept="image/*"
          required
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              file: event.target.files?.[0] ?? null,
            }))
          }
          className="text-xs text-slate-900 dark:text-slate-200"
        />
      </FormField>
    </FormDialog>
  );
}

function SpecialtyEditDialog({
  specialty,
  trigger,
}: {
  specialty: Specialty;
  trigger: ReactNode;
}) {
  const update = useUpdateSpecialty();
  const [form, setForm] = useState({
    name: specialty.name ?? "",
    description: specialty.description ?? "",
  });

  return (
    <FormDialog
      trigger={trigger}
      title={`Sửa chuyên khoa #${specialty.id}`}
      isSubmitting={update.isPending}
      onOpen={() =>
        setForm({
          name: specialty.name ?? "",
          description: specialty.description ?? "",
        })
      }
      onSubmit={() =>
        update.mutateAsync({
          specialtyId: specialty.id,
          payload: {
            name: form.name || undefined,
            description: form.description || undefined,
          },
        })
      }
    >
      <FormField label="Tên chuyên khoa" htmlFor="specialty-edit-name" required>
        <Input
          id="specialty-edit-name"
          required
          value={form.name}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, name: event.target.value }))
          }
        />
      </FormField>
      <FormField label="Mô tả" htmlFor="specialty-edit-description">
        <Textarea
          id="specialty-edit-description"
          value={form.description}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, description: event.target.value }))
          }
        />
      </FormField>
    </FormDialog>
  );
}

function SpecialtiesModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const { data, isLoading, isError, refetch } = useSpecialties({
    page,
    limit,
    search: search || undefined,
  });
  const rows = data?.data?.specialties ?? [];
  const total = data?.data?.total ?? 0;
  const deleteSpecialty = useDeleteSpecialty();
  const { can } = usePermission();
  const canCreate = can(
    PERMISSIONS.SPECIALTY_CREATE,
    PERMISSIONS.SPECIALTY_MANAGE,
  );
  const canUpdate = can(
    PERMISSIONS.SPECIALTY_UPDATE,
    PERMISSIONS.SPECIALTY_MANAGE,
  );
  const canDelete = can(
    PERMISSIONS.SPECIALTY_DELETE,
    PERMISSIONS.SPECIALTY_MANAGE,
  );

  return (
    <GenericList
      title="Chuyên khoa"
      rows={rows}
      total={total}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      rowKey={(row) => row.id}
      toolbar={
        canCreate ? (
          <SpecialtyCreateDialog
            trigger={<Button size="sm">+ Thêm chuyên khoa</Button>}
          />
        ) : null
      }
      columns={[
        { key: "id", label: "ID", render: (row) => row.id },
        { key: "name", label: "Tên", render: (row) => row.name },
        {
          key: "description",
          label: "Mô tả",
          render: (row) => row.description,
        },
        {
          key: "actions",
          label: "Thao tác",
          render: (row) => (
            <ActionCell>
              <ViewDetailButton
                title={`Chuyên khoa #${row.id}`}
                description={row.name}
                rows={[
                  { label: "ID", value: row.id },
                  { label: "Tên", value: row.name },
                  { label: "Slug", value: row.slug ?? "-" },
                  { label: "Mô tả", value: row.description ?? "-" },
                  { label: "Ảnh", value: row.img_url ?? "-" },
                  { label: "Tạo lúc", value: formatDate(row.created_at) },
                  { label: "Cập nhật", value: formatDate(row.updated_at) },
                ]}
                footer={
                  row.img_url ? (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                      <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                        Ảnh đại diện
                      </div>
                      <img
                        src={row.img_url}
                        alt={row.name}
                        className="mt-2 max-h-48 w-full rounded-md object-cover"
                      />
                    </div>
                  ) : null
                }
              />
              {canUpdate ? (
                <SpecialtyEditDialog
                  specialty={row}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      Sửa
                    </Button>
                  }
                />
              ) : null}
              {canDelete ? (
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="destructive" size="sm">
                      Xóa
                    </Button>
                  }
                  title="Xóa chuyên khoa"
                  description={`Xóa chuyên khoa #${row.id}?`}
                  destructive
                  isSubmitting={deleteSpecialty.isPending}
                  onConfirm={() => deleteSpecialty.mutateAsync(row.id)}
                />
              ) : null}
            </ActionCell>
          ),
        },
      ]}
    />
  );
}

function TagFormDialog({
  trigger,
  initial,
  mode,
}: {
  trigger: ReactNode;
  initial?: Tag;
  mode: "create" | "edit";
}) {
  const create = useCreateTag();
  const update = useUpdateTag();
  const [name, setName] = useState(initial?.name ?? "");

  return (
    <FormDialog
      trigger={trigger}
      title={mode === "create" ? "Thêm tag" : `Sửa tag #${initial?.id}`}
      isSubmitting={create.isPending || update.isPending}
      onOpen={() => setName(initial?.name ?? "")}
      onSubmit={() =>
        mode === "create"
          ? create.mutateAsync({ name })
          : update.mutateAsync({
              tagId: initial!.id,
              payload: { name },
            })
      }
    >
      <FormField label="Tên tag" htmlFor="tag-name" required>
        <Input
          id="tag-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </FormField>
    </FormDialog>
  );
}

function TagsModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const { data, isLoading, isError, refetch } = useTags({
    page,
    limit,
    search: search || undefined,
  });
  const rows = data?.data?.tags ?? [];
  const total = data?.data?.total ?? 0;
  const deleteTag = useDeleteTag();
  const { can } = usePermission();
  const canCreate = can(PERMISSIONS.TAG_CREATE, PERMISSIONS.TAG_MANAGE);
  const canUpdate = can(PERMISSIONS.TAG_UPDATE, PERMISSIONS.TAG_MANAGE);
  const canDelete = can(PERMISSIONS.TAG_DELETE, PERMISSIONS.TAG_MANAGE);

  return (
    <GenericList
      title="Tags"
      rows={rows}
      total={total}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      rowKey={(row) => row.id}
      toolbar={
        canCreate ? (
          <TagFormDialog
            mode="create"
            trigger={<Button size="sm">+ Thêm tag</Button>}
          />
        ) : null
      }
      columns={[
        { key: "id", label: "ID", render: (row) => row.id },
        { key: "name", label: "Tên tag", render: (row) => row.name },
        {
          key: "actions",
          label: "Thao tác",
          render: (row) => (
            <ActionCell>
              <ViewDetailButton
                title={`Tag #${row.id}`}
                description={row.name}
                rows={[
                  { label: "ID", value: row.id },
                  { label: "Tên", value: row.name },
                  { label: "Slug", value: row.slug ?? "-" },
                  { label: "Tạo lúc", value: formatDate(row.created_at) },
                  { label: "Cập nhật", value: formatDate(row.updated_at) },
                ]}
              />
              {canUpdate ? (
                <TagFormDialog
                  mode="edit"
                  initial={row}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      Sửa
                    </Button>
                  }
                />
              ) : null}
              {canDelete ? (
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="destructive" size="sm">
                      Xóa
                    </Button>
                  }
                  title="Xóa tag"
                  description={`Xóa tag #${row.id}?`}
                  destructive
                  isSubmitting={deleteTag.isPending}
                  onConfirm={() => deleteTag.mutateAsync(row.id)}
                />
              ) : null}
            </ActionCell>
          ),
        },
      ]}
    />
  );
}

function TopicFormDialog({
  trigger,
  initial,
  mode,
}: {
  trigger: ReactNode;
  initial?: Topic;
  mode: "create" | "edit";
}) {
  const create = useCreateTopic();
  const update = useUpdateTopic();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
  });

  return (
    <FormDialog
      trigger={trigger}
      title={mode === "create" ? "Thêm chủ đề" : `Sửa chủ đề #${initial?.id}`}
      isSubmitting={create.isPending || update.isPending}
      onOpen={() =>
        setForm({
          name: initial?.name ?? "",
          description: initial?.description ?? "",
        })
      }
      onSubmit={() =>
        mode === "create"
          ? create.mutateAsync({
              name: form.name,
              description: form.description,
            })
          : update.mutateAsync({
              topicId: initial!.id,
              payload: {
                name: form.name || undefined,
                description: form.description || undefined,
              },
            })
      }
    >
      <FormField label="Tên chủ đề" htmlFor="topic-name" required>
        <Input
          id="topic-name"
          required
          value={form.name}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, name: event.target.value }))
          }
        />
      </FormField>
      <FormField label="Mô tả" htmlFor="topic-description">
        <Textarea
          id="topic-description"
          value={form.description}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, description: event.target.value }))
          }
        />
      </FormField>
    </FormDialog>
  );
}

function TopicsModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const { data, isLoading, isError, refetch } = useTopics({
    page,
    limit,
    search: search || undefined,
  });
  const rows = data?.data?.topics ?? [];
  const total = data?.data?.total ?? 0;
  const deleteTopic = useDeleteTopic();
  const { can } = usePermission();
  const canCreate = can(PERMISSIONS.TOPIC_CREATE, PERMISSIONS.TOPIC_MANAGE);
  const canUpdate = can(PERMISSIONS.TOPIC_UPDATE, PERMISSIONS.TOPIC_MANAGE);
  const canDelete = can(PERMISSIONS.TOPIC_DELETE, PERMISSIONS.TOPIC_MANAGE);

  return (
    <GenericList
      title="Topics"
      rows={rows}
      total={total}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      rowKey={(row) => row.id}
      toolbar={
        canCreate ? (
          <TopicFormDialog
            mode="create"
            trigger={<Button size="sm">+ Thêm chủ đề</Button>}
          />
        ) : null
      }
      columns={[
        { key: "id", label: "ID", render: (row) => row.id },
        { key: "name", label: "Chủ đề", render: (row) => row.name },
        {
          key: "description",
          label: "Mô tả",
          render: (row) => row.description,
        },
        {
          key: "actions",
          label: "Thao tác",
          render: (row) => (
            <ActionCell>
              <ViewDetailButton
                title={`Chủ đề #${row.id}`}
                description={row.name}
                rows={[
                  { label: "ID", value: row.id },
                  { label: "Tên", value: row.name },
                  { label: "Slug", value: row.slug ?? "-" },
                  { label: "Tạo lúc", value: formatDate(row.created_at) },
                  { label: "Cập nhật", value: formatDate(row.updated_at) },
                ]}
                footer={
                  row.description ? (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                      <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                        Mô tả
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                        {row.description}
                      </p>
                    </div>
                  ) : null
                }
              />
              {canUpdate ? (
                <TopicFormDialog
                  mode="edit"
                  initial={row}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      Sửa
                    </Button>
                  }
                />
              ) : null}
              {canDelete ? (
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="destructive" size="sm">
                      Xóa
                    </Button>
                  }
                  title="Xóa chủ đề"
                  description={`Xóa chủ đề #${row.id}?`}
                  destructive
                  isSubmitting={deleteTopic.isPending}
                  onConfirm={() => deleteTopic.mutateAsync(row.id)}
                />
              ) : null}
            </ActionCell>
          ),
        },
      ]}
    />
  );
}

type ArticleFormState = {
  title: string;
  summary: string;
  content: string;
  topicId: number | undefined;
  tagIds: number[];
  files: File[];
};

function ArticleFormDialog({
  trigger,
  initial,
  mode,
}: {
  trigger: ReactNode;
  initial?: Article;
  mode: "create" | "edit";
}) {
  const create = useCreateArticle();
  const update = useUpdateArticle();
  const { data: topicsData } = useTopics({ page: 1, limit: 100 });
  const { data: tagsData } = useTags({ page: 1, limit: 100 });
  const topics = topicsData?.data?.topics ?? [];
  const tags = tagsData?.data?.tags ?? [];

  const buildInitialForm = (): ArticleFormState => ({
    title: initial?.title ?? "",
    summary: initial?.summary ?? "",
    content: initial?.content ?? "",
    topicId: initial?.topic?.id,
    tagIds: initial?.tags?.map((tag) => tag.id) ?? [],
    files: [],
  });

  const [form, setForm] = useState<ArticleFormState>(buildInitialForm);

  const toggleTag = (tagId: number) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  return (
    <FormDialog
      trigger={trigger}
      title={mode === "create" ? "Tạo bài viết" : `Sửa bài viết #${initial?.id}`}
      isSubmitting={create.isPending || update.isPending}
      onOpen={() => setForm(buildInitialForm())}
      onSubmit={() => {
        if (!form.topicId) {
          throw new Error("Vui lòng chọn chủ đề");
        }
        return mode === "create"
          ? create.mutateAsync({
              title: form.title,
              content: form.content,
              summary: form.summary,
              topic_id: form.topicId,
              tag_ids: form.tagIds,
              files: form.files,
            })
          : update.mutateAsync({
              articleId: initial!.id,
              payload: {
                title: form.title,
                content: form.content,
                summary: form.summary,
                topic_id: form.topicId,
                tag_ids: form.tagIds,
              },
            });
      }}
    >
      <FormField label="Tiêu đề" htmlFor="article-title" required>
        <Input
          id="article-title"
          required
          value={form.title}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, title: event.target.value }))
          }
        />
      </FormField>
      <FormField label="Tóm tắt" htmlFor="article-summary" required>
        <Textarea
          id="article-summary"
          required
          rows={2}
          value={form.summary}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, summary: event.target.value }))
          }
        />
      </FormField>
      <FormField label="Nội dung" htmlFor="article-content" required>
        <Textarea
          id="article-content"
          required
          rows={8}
          value={form.content}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, content: event.target.value }))
          }
        />
      </FormField>
      <FormField label="Chủ đề" htmlFor="article-topic" required>
        <select
          id="article-topic"
          required
          value={form.topicId ?? ""}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              topicId: event.target.value
                ? Number(event.target.value)
                : undefined,
            }))
          }
          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="" disabled>
            -- Chọn chủ đề --
          </option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Tags" htmlFor="article-tags">
        <div
          id="article-tags"
          className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-800"
        >
          {tags.length === 0 ? (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Chưa có tag nào.
            </span>
          ) : (
            tags.map((tag) => {
              const active = form.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                    (active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800")
                  }
                >
                  {tag.name}
                </button>
              );
            })
          )}
        </div>
      </FormField>
      {mode === "create" ? (
        <FormField label="Tệp đính kèm" htmlFor="article-files">
          <input
            id="article-files"
            type="file"
            multiple
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                files: event.target.files
                  ? Array.from(event.target.files)
                  : [],
              }))
            }
            className="text-xs text-slate-900 dark:text-slate-200"
          />
        </FormField>
      ) : null}
    </FormDialog>
  );
}

function ArticlesModule({
  search,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ModuleViewProps) {
  const [approvalFilter, setApprovalFilter] = useState<
    "all" | "true" | "false"
  >("all");
  const { data, isLoading, isError, refetch } = useArticles({
    page,
    limit,
    search: search || undefined,
    is_approve: approvalFilter,
  });
  const rows = data?.data?.articles ?? [];
  const total = data?.data?.total ?? 0;
  const approveArticle = useApproveArticle();
  const deleteArticle = useDeleteArticle();
  const isMutating = approveArticle.isPending || deleteArticle.isPending;
  const { can } = usePermission();
  const canCreate = can(
    PERMISSIONS.ARTICLE_CREATE,
    PERMISSIONS.ARTICLE_MANAGE,
  );
  const canEdit = can(
    PERMISSIONS.ARTICLE_UPDATE,
    PERMISSIONS.ARTICLE_MANAGE,
  );
  const canApprove = can(
    PERMISSIONS.ARTICLE_APPROVE,
    PERMISSIONS.ARTICLE_MANAGE,
  );
  const canDelete = can(
    PERMISSIONS.ARTICLE_DELETE,
    PERMISSIONS.ARTICLE_MANAGE,
  );

  const approvalTabs: Array<{
    key: "all" | "true" | "false";
    label: string;
  }> = [
    { key: "all", label: "Tất cả" },
    { key: "true", label: "Đã duyệt" },
    { key: "false", label: "Chờ duyệt" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {approvalTabs.map((tab) => (
          <Button
            key={tab.key}
            type="button"
            variant={approvalFilter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setApprovalFilter(tab.key);
              onPageChange(1);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <GenericList
        title="Bài viết"
        rows={rows}
        total={total}
        page={page}
        limit={limit}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        rowKey={(row) => row.id}
        toolbar={
          canCreate ? (
            <ArticleFormDialog
              mode="create"
              trigger={<Button size="sm">+ Tạo bài viết</Button>}
            />
          ) : null
        }
        columns={[
          { key: "id", label: "ID", render: (row) => row.id },
          { key: "title", label: "Tiêu đề", render: (row) => row.title },
          {
            key: "topic",
            label: "Chủ đề",
            render: (row) => row.topic?.name ?? "-",
          },
          {
            key: "author",
            label: "Tác giả",
            render: (row) => row.author?.fullname ?? "-",
          },
          {
            key: "is_approved",
            label: "Duyệt",
            render: (row) =>
              row.is_approved ? (
                <Badge variant="success">Đã duyệt</Badge>
              ) : (
                <Badge variant="outline">Chờ duyệt</Badge>
              ),
          },
          {
            key: "actions",
            label: "Thao tác",
            render: (row) => (
              <ActionCell>
                <ViewDetailButton
                  title={`Bài viết #${row.id}`}
                  description={row.title}
                  rows={[
                    { label: "ID", value: row.id },
                    { label: "Tiêu đề", value: row.title },
                    { label: "Slug", value: row.slug ?? "-" },
                    { label: "Chủ đề", value: row.topic?.name ?? "-" },
                    { label: "Tác giả", value: row.author?.fullname ?? "-" },
                    {
                      label: "Trạng thái duyệt",
                      value: row.is_approved ? (
                        <Badge variant="success">Đã duyệt</Badge>
                      ) : (
                        <Badge variant="outline">Chờ duyệt</Badge>
                      ),
                    },
                    { label: "Lượt xem", value: row.view_count ?? 0 },
                    {
                      label: "Tags",
                      value:
                        row.tags && row.tags.length
                          ? row.tags.map((tag) => tag.name).join(", ")
                          : "-",
                    },
                    { label: "Tạo lúc", value: formatDate(row.created_at) },
                    { label: "Cập nhật", value: formatDate(row.updated_at) },
                  ]}
                  footer={
                    row.summary || row.content || (row.files && row.files.length) ? (
                      <div className="space-y-3">
                        {row.summary ? (
                          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                            <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                              Tóm tắt
                            </div>
                            <p className="mt-2 whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                              {row.summary}
                            </p>
                          </div>
                        ) : null}
                        {row.content ? (
                          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                            <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                              Nội dung
                            </div>
                            <p className="mt-2 max-h-72 overflow-auto whitespace-pre-line text-sm text-slate-900 dark:text-slate-100">
                              {row.content}
                            </p>
                          </div>
                        ) : null}
                        {row.files && row.files.length ? (
                          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80 p-4">
                            <div className="mono-label text-[10px] text-slate-500 dark:text-slate-400">
                              Tệp đính kèm
                            </div>
                            <ul className="mt-2 space-y-1 text-sm text-slate-900 dark:text-slate-100">
                              {row.files.map((file) => (
                                <li key={file.id}>
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline hover:text-primary/80 dark:text-teal-400 dark:hover:text-teal-300"
                                  >
                                    {file.url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null
                  }
                />
                {canEdit ? (
                  <ArticleFormDialog
                    mode="edit"
                    initial={row}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        Sửa
                      </Button>
                    }
                  />
                ) : null}
                {canApprove && !row.is_approved ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => approveArticle.mutate(row.id)}
                  >
                    Duyệt
                  </Button>
                ) : null}
                {canDelete ? (
                  <ConfirmDialog
                    trigger={
                      <Button type="button" variant="destructive" size="sm">
                        Xóa
                      </Button>
                    }
                    title="Xóa bài viết"
                    description={`Xóa bài viết #${row.id}?`}
                    destructive
                    isSubmitting={isMutating}
                    onConfirm={() => deleteArticle.mutateAsync(row.id)}
                  />
                ) : null}
              </ActionCell>
            ),
          },
        ]}
      />
    </div>
  );
}

const DAYS_OF_WEEK: Array<{ value: string; label: string }> = [
  { value: "Monday", label: "Thứ 2" },
  { value: "Tuesday", label: "Thứ 3" },
  { value: "Wednesday", label: "Thứ 4" },
  { value: "Thursday", label: "Thứ 5" },
  { value: "Friday", label: "Thứ 6" },
  { value: "Saturday", label: "Thứ 7" },
  { value: "Sunday", label: "Chủ nhật" },
];

function DoctorScheduleFormDialog({
  trigger,
  initial,
  mode,
}: {
  trigger: ReactNode;
  initial?: Partial<DoctorSchedule>;
  mode: "create" | "edit";
}) {
  const create = useCreateDoctorSchedule();
  const update = useUpdateDoctorSchedule();
  const [dayOfWeek, setDayOfWeek] = useState(
    initial?.day_of_week ?? DAYS_OF_WEEK[0].value,
  );
  const [startTime, setStartTime] = useState(initial?.start_time ?? "");
  const [endTime, setEndTime] = useState(initial?.end_time ?? "");

  return (
    <FormDialog
      trigger={trigger}
      title={mode === "create" ? "Thêm ca khám" : `Sửa ca khám #${initial?.id}`}
      isSubmitting={create.isPending || update.isPending}
      onOpen={() => {
        if (mode === "edit") {
          setDayOfWeek(initial?.day_of_week ?? DAYS_OF_WEEK[0].value);
          setStartTime(initial?.start_time ?? "");
          setEndTime(initial?.end_time ?? "");
        }
      }}
      onSubmit={() =>
        mode === "create"
          ? create.mutateAsync({
              day_of_week: dayOfWeek,
              start_time: startTime,
              end_time: endTime,
            })
          : update.mutateAsync({
              scheduleId: initial!.id!,
              payload: {
                day_of_week: dayOfWeek || undefined,
                start_time: startTime || undefined,
                end_time: endTime || undefined,
              },
            })
      }
    >
      <FormField label="Thứ trong tuần" htmlFor="schedule-day" required>
        <select
          id="schedule-day"
          required
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          {DAYS_OF_WEEK.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Giờ bắt đầu" htmlFor="start-time" required>
        <Input
          id="start-time"
          required
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </FormField>
      <FormField label="Giờ kết thúc" htmlFor="end-time" required>
        <Input
          id="end-time"
          required
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </FormField>
    </FormDialog>
  );
}

function DoctorSchedulesModule() {
  const { data, isLoading, isError, refetch } = usePersonalSchedules();
  const createSchedule = useCreateDoctorSchedule();
  const updateStatus = useUpdateDoctorScheduleStatus();
  const deleteSchedule = useDeleteDoctorSchedule();
  const { can } = usePermission();
  const canCreate = can(
    PERMISSIONS.DOCTOR_SCHEDULE_CREATE,
    PERMISSIONS.DOCTOR_SCHEDULE_MANAGE,
  );
  const canUpdateStatus = can(
    PERMISSIONS.DOCTOR_SCHEDULE_UPDATE_STATUS,
    PERMISSIONS.DOCTOR_SCHEDULE_MANAGE,
  );
  const canDelete = can(
    PERMISSIONS.DOCTOR_SCHEDULE_DELETE,
    PERMISSIONS.DOCTOR_SCHEDULE_MANAGE,
  );
  const canEdit = can(
    PERMISSIONS.DOCTOR_SCHEDULE_UPDATE,
    PERMISSIONS.DOCTOR_SCHEDULE_MANAGE,
  );

  const groups = useMemo(() => data?.data ?? {}, [data?.data]);
  const availableDays = useMemo(() => {
    const set = new Set<string>(Object.keys(groups));
    DAYS_OF_WEEK.forEach((day) => set.add(day.value));
    return Array.from(set);
  }, [groups]);

  const orderedDays = useMemo(
    () =>
      DAYS_OF_WEEK.filter((day) => availableDays.includes(day.value)).concat(
        availableDays
          .filter(
            (day) => !DAYS_OF_WEEK.some((known) => known.value === day),
          )
          .map((day) => ({ value: day, label: day })),
      ),
    [availableDays],
  );

  // null = no filter applied, show every day's shifts in one table.
  const [dayFilter, setDayFilter] = useState<string | null>(null);

  const isMutating =
    createSchedule.isPending ||
    updateStatus.isPending ||
    deleteSchedule.isPending;

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const allRows = orderedDays.flatMap((day) =>
    (groups[day.value] ?? []).map((schedule) => ({
      ...schedule,
      day_of_week: day.value,
      day_label: day.label,
    })),
  );
  const rows = dayFilter
    ? allRows.filter((row) => row.day_of_week === dayFilter)
    : allRows;

  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
      <CardHeader className="space-y-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Lịch khám cá nhân</CardTitle>
          {canCreate ? (
            <DoctorScheduleFormDialog
              mode="create"
              trigger={
                <Button size="sm" variant="outline">
                  <Plus className="mr-1 size-3" />
                  Thêm ca
                </Button>
              }
            />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setDayFilter(null)}
            className={
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
              (dayFilter === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800")
            }
          >
            <span>Tất cả</span>
            <span
              className={
                "rounded-full px-1.5 text-[10px] " +
                (dayFilter === null
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400")
              }
            >
              {allRows.length}
            </span>
          </button>
          {orderedDays.map((day) => {
            const count = groups[day.value]?.length ?? 0;
            const active = day.value === dayFilter;
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => setDayFilter(active ? null : day.value)}
                className={
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                  (active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800")
                }
              >
                <span>{day.label}</span>
                <span
                  className={
                    "rounded-full px-1.5 text-[10px] " +
                    (active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400")
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 overflow-x-auto pb-6">
        {rows.length === 0 ? (
          <EmptyState
            title="Chưa có ca khám"
            description={
              dayFilter
                ? `Không có ca khám nào cho ${
                    orderedDays.find((day) => day.value === dayFilter)
                      ?.label ?? dayFilter
                  }.`
                : "Chưa có ca khám nào trong tuần."
            }
          />
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-left dark:divide-slate-800">
            <thead>
              <tr>
                <th className="mono-label px-3 py-3 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  ID
                </th>
                <th className="mono-label px-3 py-3 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Ngày
                </th>
                <th className="mono-label px-3 py-3 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Giờ
                </th>
                <th className="mono-label px-3 py-3 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Trạng thái
                </th>
                <th className="mono-label px-3 py-3 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="px-3 py-4 text-sm text-slate-800 dark:text-slate-200">{row.id}</td>
                  <td className="px-3 py-4 text-sm text-slate-800 dark:text-slate-200">{row.day_label}</td>
                  <td className="px-3 py-4 text-sm text-slate-800 dark:text-slate-200">
                    {row.start_time ?? "-"} - {row.end_time ?? "-"}
                  </td>
                  <td className="px-3 py-4 text-sm">
                    {row.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm">
                    <ActionCell>
                      {canEdit ? (
                        <DoctorScheduleFormDialog
                          mode="edit"
                          initial={row}
                          trigger={
                            <Button type="button" variant="outline" size="sm">
                              Sửa
                            </Button>
                          }
                        />
                      ) : null}
                      <ViewDetailButton
                        title={`Ca khám #${row.id}`}
                        description={`${row.day_label} · ${row.start_time ?? "-"} - ${row.end_time ?? "-"}`}
                        rows={[
                          { label: "ID", value: row.id },
                          { label: "Ngày", value: row.day_label },
                          {
                            label: "Khung giờ",
                            value: `${row.start_time ?? "-"} - ${row.end_time ?? "-"}`,
                          },
                          {
                            label: "Trạng thái",
                            value: row.is_active ? (
                              <Badge variant="success">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            ),
                          },
                        ]}
                      />
                      {canUpdateStatus ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isMutating}
                          onClick={() =>
                            updateStatus.mutate({
                              scheduleId: row.id,
                              isActive: !row.is_active,
                            })
                          }
                        >
                          {row.is_active ? "Tạm ngưng" : "Kích hoạt"}
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <ConfirmDialog
                          trigger={
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                            >
                              Xóa
                            </Button>
                          }
                          title="Xóa ca khám"
                          description={`Xóa ca khám #${row.id} (${row.start_time} - ${row.end_time})?`}
                          destructive
                          isSubmitting={deleteSchedule.isPending}
                          onConfirm={() => deleteSchedule.mutateAsync(row.id)}
                        />
                      ) : null}
                    </ActionCell>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

const moduleMeta: Record<
  string,
  {
    eyebrow: string;
    title: string;
    description: string;
    permissionLevel: string;
  }
> = {
  users: {
    eyebrow: "Admin operations",
    title: "Quản lý người dùng",
    description:
      "Danh sách tài khoản trong hệ thống cùng vai trò và trạng thái hoạt động.",
    permissionLevel: permissions.users,
  },
  patients: {
    eyebrow: "Clinical comms",
    title: "Quản lý bệnh nhân",
    description:
      "Danh sách bệnh nhân do hệ thống quản lý kèm trạng thái tài khoản.",
    permissionLevel: permissions.patients,
  },
  "admin-patients": {
    eyebrow: "Clinical data",
    title: "Quản lý bệnh nhân (admin)",
    description: "Danh sách bệnh nhân ở góc nhìn admin.",
    permissionLevel: permissions.adminPatients,
  },
  doctors: {
    eyebrow: "Admin operations",
    title: "Quản lý bác sĩ",
    description:
      "Danh sách bác sĩ kèm chuyên khoa, kinh nghiệm và đánh giá trung bình.",
    permissionLevel: permissions.doctors,
  },
  appointments: {
    eyebrow: "Admin operations",
    title: "Quản lý lịch hẹn",
    description: "Lịch hẹn trên toàn hệ thống.",
    permissionLevel: permissions.appointments,
  },
  "doctor-appointments": {
    eyebrow: "Doctor workspace",
    title: "Lịch hẹn của tôi",
    description: "Danh sách lịch hẹn của bác sĩ.",
    permissionLevel: permissions.doctorAppointments,
  },
  "doctor-schedules": {
    eyebrow: "Doctor workspace",
    title: "Lịch khám cá nhân",
    description: "Khung giờ khám đang được cấu hình của bác sĩ.",
    permissionLevel: permissions.doctorSchedules,
  },
  "audit-logs": {
    eyebrow: "Governance",
    title: "Audit logs",
    description: "Toàn bộ hoạt động đã được hệ thống ghi nhận.",
    permissionLevel: permissions.auditLogs,
  },
  complaints: {
    eyebrow: "Governance",
    title: "Khiếu nại",
    description: "Phản hồi từ người dùng cần xử lý.",
    permissionLevel: permissions.complaints,
  },
  notifications: {
    eyebrow: "Governance",
    title: "Thông báo",
    description: "Lịch sử thông báo đã gửi tới người dùng.",
    permissionLevel: permissions.notifications,
  },
  ratings: {
    eyebrow: "Governance",
    title: "Đánh giá hài lòng",
    description: "Đánh giá của bệnh nhân sau lượt khám.",
    permissionLevel: permissions.ratings,
  },
  "exam-results": {
    eyebrow: "Clinical data",
    title: "Kết quả khám",
    description: "Kết quả khám của bệnh nhân do bác sĩ tạo lập.",
    permissionLevel: permissions.examResults,
  },
  relatives: {
    eyebrow: "Clinical data",
    title: "Người thân",
    description: "Danh sách người thân của bệnh nhân.",
    permissionLevel: permissions.relatives,
  },
  "health-profiles": {
    eyebrow: "Clinical data",
    title: "Hồ sơ sức khỏe",
    description: "Hồ sơ sức khỏe gắn với từng người thân.",
    permissionLevel: permissions.healthProfiles,
  },
  relationships: {
    eyebrow: "Clinical data",
    title: "Mối quan hệ",
    description: "Danh mục quan hệ gia đình dùng cho hồ sơ.",
    permissionLevel: permissions.relationships,
  },
  specialties: {
    eyebrow: "Clinical data",
    title: "Chuyên khoa",
    description: "Danh sách chuyên khoa hiện có.",
    permissionLevel: permissions.specialties,
  },
  tags: {
    eyebrow: "Content",
    title: "Tags",
    description: "Tag dùng cho bài viết và phân loại nội dung.",
    permissionLevel: permissions.tags,
  },
  topics: {
    eyebrow: "Content",
    title: "Chủ đề",
    description: "Chủ đề bài viết.",
    permissionLevel: permissions.topics,
  },
  articles: {
    eyebrow: "Content",
    title: "Bài viết",
    description: "Bài viết chuyên môn của bác sĩ.",
    permissionLevel: permissions.articles,
  },
};

export function GenericModulePage({ moduleId }: { moduleId: string }) {
  const meta = moduleMeta[moduleId];
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const headerProps = meta ?? {
    eyebrow: "Module",
    title: moduleId,
    description: "Module này chưa được cấu hình.",
    permissionLevel: "",
  };

  const handleLimitChange = (next: number) => {
    setLimit(next);
    setPage(1);
  };

  const renderModule = () => {
    const props: ModuleViewProps = {
      search,
      page,
      limit,
      onPageChange: setPage,
      onLimitChange: handleLimitChange,
    };
    switch (moduleId) {
      case "users":
        return <UsersModule {...props} />;
      case "patients":
      case "admin-patients":
        return <PatientsModule {...props} />;
      case "doctors":
        return <DoctorsModule {...props} />;
      case "appointments":
        return <AppointmentsModule {...props} />;
      case "doctor-appointments":
        return <AppointmentsModule {...props} scope="doctor" />;
      case "doctor-schedules":
        return <DoctorSchedulesModule />;
      case "audit-logs":
        return <AuditLogsModule {...props} />;
      case "complaints":
        return <ComplaintsModule {...props} />;
      case "notifications":
        return <NotificationsModule {...props} />;
      case "ratings":
        return <SatisfactionRatingsModule {...props} />;
      case "doctor-exam-results":
        return <ExamResultsModule {...props} scope="doctor" />;
      case "exam-results":
        return <ExamResultsModule {...props} />;
      case "relatives":
        return <RelativesModule {...props} />;
      case "health-profiles":
        return <HealthProfilesModule {...props} />;
      case "relationships":
        return <RelationshipsModule {...props} />;
      case "specialties":
        return <SpecialtiesModule {...props} />;
      case "tags":
        return <TagsModule {...props} />;
      case "topics":
        return <TopicsModule {...props} />;
      case "articles":
        return <ArticlesModule {...props} />;
      default:
        return (
          <EmptyState
            title="Module chưa hỗ trợ"
            description={`Chưa có hook tích hợp cho module "${moduleId}".`}
          />
        );
    }
  };

  const supportsSearch = moduleId !== "doctor-schedules";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={headerProps.eyebrow}
        title={headerProps.title}
        description={headerProps.description}
      />

      {supportsSearch ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={`Tìm kiếm trong ${headerProps.title.toLowerCase()}...`}
              className="pl-10 h-10 rounded-xl"
            />
            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                Xóa
              </button>
            ) : null}
          </div>
          {headerProps.permissionLevel ? (
            <ToolbarCreateButton>
              <Badge variant="outline" className="text-xs font-bold self-start sm:self-center">
                🔒 Quyền: {headerProps.permissionLevel}
              </Badge>
            </ToolbarCreateButton>
          ) : null}
        </div>
      ) : null}

      {renderModule()}
    </div>
  );
}
