import { BellRing, LockKeyhole, Palette } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Thiết lập mock cho hệ thống thông báo, copy quản trị và ngưỡng cảnh báo. Đây là cấu trúc UI sẵn sàng để nối API cấu hình sau."
        actions={["Lưu thay đổi", "Xem history"]}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-4" />
              Design tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input defaultValue="Ocean Medical" />
            <Input defaultValue="Primary: oklch(0.52 0.14 202)" />
            <Input defaultValue="Surface radius: 1rem" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="size-4" />
              Notification defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input defaultValue="Appointment reminder: 24h" />
            <Input defaultValue="Health profile nudge: 48h" />
            <Input defaultValue="Complaint escalation: 2h" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="size-4" />
              Governance defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input defaultValue="Audit severity threshold: high" />
            <Input defaultValue="Admin session timeout: 30m" />
            <Input defaultValue="Role review cadence: quarterly" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              Pending integration
            </div>
            <div className="mt-2 text-sm text-slate-500">
              Chưa thấy backend settings module riêng. UI này đang giữ chỗ cho
              configuration API hoặc feature-flag service sau này.
            </div>
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button>Lưu mock config</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
