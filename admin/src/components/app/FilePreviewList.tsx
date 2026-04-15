import { FileImage, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { RecordAttachment } from "@/types/app";

export function FilePreviewList({
  attachments,
}: {
  attachments?: RecordAttachment[];
}) {
  if (!attachments?.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {attachments.map((attachment) => (
        <Card key={attachment.id} className="overflow-hidden">
          {attachment.type === "image" ? (
            <img
              src={attachment.url}
              alt={attachment.name}
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="flex h-40 items-center justify-center bg-slate-100 text-slate-400">
              <FileText className="size-12" />
            </div>
          )}
          <CardContent className="space-y-2 pt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-slate-800">
                {attachment.name}
              </p>
              <Badge variant={attachment.type === "image" ? "info" : "outline"}>
                {attachment.type.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {attachment.type === "image" ? (
                <FileImage className="size-3.5" />
              ) : (
                <FileText className="size-3.5" />
              )}
              Preview mock attachment
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
