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
        description="Mock configuration for notification defaults, admin copy, and alert thresholds. This UI is prepared for a future configuration API."
        actions={["Save changes", "View history"]}
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
            <Input defaultValue="Editorial Medical" />
            <Input defaultValue="Primary: #17171c" />
            <Input defaultValue="Surface radius: 8px" />
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
              No dedicated backend settings module is available yet. This UI is
              a placeholder for a future configuration API or feature-flag service.
            </div>
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button>Save mock config</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
