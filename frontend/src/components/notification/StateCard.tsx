import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StateCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  iconClassName?: string;
}

export default function StateCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  iconClassName = "bg-muted text-muted-foreground",
}: StateCardProps) {
  return (
    <div className="flex justify-center items-center w-full py-10">
      <Card className="w-full max-w-md border border-gray-200 shadow-sm rounded-xl">
        <CardContent className="flex flex-col items-center p-6 text-center space-y-4">
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-full ${iconClassName}`}
          >
            {icon}
          </div>

          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>

          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}

          {onAction && actionLabel && (
            <Button variant="outline" onClick={onAction} className="mt-4 rounded-lg">
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
