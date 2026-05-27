import { useEffect, useMemo, useState } from "react";
import { Camera, KeyRound, Loader2, UserRound } from "lucide-react";

import { ErrorState } from "@/components/app/ErrorState";
import { LoadingState } from "@/components/app/LoadingState";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useChangePassword,
  useCurrentUser,
  useUpdateCurrentUser,
} from "@/hooks/useUsers";

type ProfileForm = {
  fullname: string;
  phone: string;
  address: string;
  gender: boolean;
  dateOfBirth: string;
};

type PasswordForm = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function DoctorSettingsPage() {
  const profileQuery = useCurrentUser();
  const updateProfile = useUpdateCurrentUser();
  const changePassword = useChangePassword();

  const initialProfile = useMemo<ProfileForm>(() => {
    const user = profileQuery.data?.data;
    return {
      fullname: user?.fullname ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? "",
      gender: Boolean(user?.gender),
      dateOfBirth: user?.date_of_birth ?? "",
    };
  }, [profileQuery.data]);

  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setProfile(initialProfile);
    setAvatarFile(null);
  }, [initialProfile]);

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Doctor workspace"
          title="Settings"
          description="Đang tải hồ sơ cá nhân."
        />
        <LoadingState />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data?.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Doctor workspace"
          title="Settings"
          description="Không thể tải hồ sơ cá nhân."
        />
        <ErrorState onRetry={() => profileQuery.refetch()} />
      </div>
    );
  }

  const currentUser = profileQuery.data.data;

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile.mutate({
      payload: {
        fullname: profile.fullname,
        phone: profile.phone,
        address: profile.address,
        gender: profile.gender,
        date_of_birth: profile.dateOfBirth || undefined,
      },
      file: avatarFile ?? undefined,
    });
  };

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return;
    }
    changePassword.mutate({
      old_password: passwordForm.oldPassword,
      new_password: passwordForm.newPassword,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Doctor workspace"
        title="Settings"
        description="Cập nhật hồ sơ cá nhân và mật khẩu thông qua API users của hệ thống."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" />
              Hồ sơ cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleProfileSubmit}>
              <div className="flex items-center gap-4">
                <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border border-[#d9d9dd] bg-[#f7f6f2]">
                  {currentUser.picture ? (
                    <img
                      src={currentUser.picture}
                      alt={currentUser.fullname}
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserRound className="size-8 text-[#75758a]" />
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d9d9dd] px-4 py-2 text-sm">
                  <Camera className="size-4" />
                  Đổi avatar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      setAvatarFile(event.target.files?.[0] ?? null)
                    }
                  />
                </label>
                {avatarFile ? (
                  <span className="text-xs text-[#75758a]">
                    {avatarFile.name}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Họ tên"
                  value={profile.fullname}
                  onChange={(value) =>
                    setProfile((prev) => ({ ...prev, fullname: value }))
                  }
                />
                <Field
                  label="Số điện thoại"
                  value={profile.phone}
                  onChange={(value) =>
                    setProfile((prev) => ({ ...prev, phone: value }))
                  }
                />
                <Field
                  label="Địa chỉ"
                  value={profile.address}
                  onChange={(value) =>
                    setProfile((prev) => ({ ...prev, address: value }))
                  }
                />
                <Field
                  label="Ngày sinh"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(value) =>
                    setProfile((prev) => ({ ...prev, dateOfBirth: value }))
                  }
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#212121]">
                    Giới tính
                  </label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={profile.gender ? "true" : "false"}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        gender: event.target.value === "true",
                      }))
                    }
                  >
                    <option value="true">Nam</option>
                    <option value="false">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Đang lưu
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" />
              Đổi mật khẩu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              <Field
                label="Mật khẩu hiện tại"
                type="password"
                value={passwordForm.oldPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({ ...prev, oldPassword: value }))
                }
              />
              <Field
                label="Mật khẩu mới"
                type="password"
                value={passwordForm.newPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: value }))
                }
              />
              <Field
                label="Xác nhận mật khẩu mới"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: value,
                  }))
                }
              />

              {passwordForm.newPassword &&
              passwordForm.newPassword !== passwordForm.confirmPassword ? (
                <p className="text-sm text-rose-600">
                  Mật khẩu xác nhận không khớp.
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Đang đổi
                    </>
                  ) : (
                    "Đổi mật khẩu"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#212121]">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
