import { useMemo, useState } from "react";
import { Camera, KeyRound, ShieldCheck, UserRound } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/useAuthStore";

type DoctorSettings = {
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminderNotifications: boolean;
  shareClinicalData: boolean;
  twoFactorAuth: boolean;
};

type DoctorProfileForm = {
  displayName: string;
  email: string;
  phone: string;
  department: string;
  title: string;
  clinicAddress: string;
  bio: string;
};

const settingGroups: Array<{
  key: keyof DoctorSettings;
  label: string;
  description: string;
}> = [
  {
    key: "emailNotifications",
    label: "Email notifications",
    description: "Receive schedule, clinical record, and operations updates.",
  },
  {
    key: "smsNotifications",
    label: "SMS notifications",
    description: "Receive appointment reminders and urgent response alerts.",
  },
  {
    key: "reminderNotifications",
    label: "Automatic appointment reminders",
    description: "Receive reminders for visits scheduled in the next 24 hours.",
  },
  {
    key: "shareClinicalData",
    label: "Share clinical data inside the system",
    description: "Allow internal modules to access records for care support.",
  },
  {
    key: "twoFactorAuth",
    label: "Enable two-factor authentication",
    description: "Increase security when accessing the doctor dashboard.",
  },
];

export function DoctorSettingsPage() {
  const currentUser = useAuthStore((state) => state.currentUser);

  const initialProfile = useMemo<DoctorProfileForm>(
    () => ({
      displayName: currentUser?.displayName ?? "",
      email: currentUser?.email ?? "",
      phone: "0909 888 112",
      department: currentUser?.department ?? "",
      title: currentUser?.title ?? "",
      clinicAddress: "LifeHealth Clinic - District 1, Ho Chi Minh City",
      bio: "General physician focused on digestive care and post-treatment follow-up.",
    }),
    [currentUser]
  );

  const [profile, setProfile] = useState<DoctorProfileForm>(initialProfile);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [settings, setSettings] = useState<DoctorSettings>({
    emailNotifications: true,
    smsNotifications: false,
    reminderNotifications: true,
    shareClinicalData: true,
    twoFactorAuth: true,
  });

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Doctor workspace"
        title="Settings"
        description="Doctor settings for profile details, password changes, notification preferences, and account security."
        actions={["Save changes", "Download data", "View access history"]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" />
              Profile details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border border-[#d9d9dd] bg-[#f7f6f2]">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  className="size-full object-cover"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Camera className="size-4" />
                Change avatar
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Full name"
                value={profile.displayName}
                onChange={(value) =>
                  setProfile((prev) => ({ ...prev, displayName: value }))
                }
              />
              <InputField
                label="Email"
                value={profile.email}
                onChange={(value) =>
                  setProfile((prev) => ({ ...prev, email: value }))
                }
              />
              <InputField
                label="Phone number"
                value={profile.phone}
                onChange={(value) =>
                  setProfile((prev) => ({ ...prev, phone: value }))
                }
              />
              <InputField
                label="Department"
                value={profile.department}
                onChange={(value) =>
                  setProfile((prev) => ({ ...prev, department: value }))
                }
              />
              <InputField
                label="Display role"
                value={profile.title}
                onChange={(value) =>
                  setProfile((prev) => ({ ...prev, title: value }))
                }
              />
              <InputField
                label="Clinic location"
                value={profile.clinicAddress}
                onChange={(value) =>
                  setProfile((prev) => ({ ...prev, clinicAddress: value }))
                }
              />
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-[#212121]">Bio</label>
                <Textarea
                  value={profile.bio}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, bio: event.target.value }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-5 text-primary" />
                Change password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputField
                label="Current password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: value }))
                }
              />
              <InputField
                label="New password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: value }))
                }
              />
              <InputField
                label="Confirm new password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))
                }
              />
              <div className="rounded-lg border border-[#d9d9dd] bg-[#f7f6f2] p-4 text-sm text-[#75758a]">
                This UI is prepared for the backend `users/change-password` flow.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Account settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settingGroups.map((setting, index) => (
                <div key={setting.key}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#212121]">
                        {setting.label}
                      </p>
                      <p className="text-sm text-[#75758a]">
                        {setting.description}
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={settings[setting.key]}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            [setting.key]: event.currentTarget.checked,
                          }))
                        }
                      />
                      <span className="h-6 w-11 rounded-full bg-[#d9d9dd] transition-colors peer-checked:bg-primary" />
                      <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                    </label>
                  </div>
                  {index < settingGroups.length - 1 ? (
                    <Separator className="mt-4" />
                  ) : null}
                </div>
              ))}

              <div className="rounded-lg border border-[#d9d9dd] bg-[#f7f6f2] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#212121]">
                      Security status
                    </p>
                    <p className="text-sm text-[#75758a]">
                      This doctor has 2FA enabled and receives critical schedule reminders.
                    </p>
                  </div>
                  <Badge variant="success">Secure</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InputField({
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
      <Input value={value} type={type} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
