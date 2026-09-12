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
  iconClassName = "bg-slate-100 text-slate-600 dark:bg-[#1E293B] dark:text-teal-300",
}: StateCardProps) {
  return (
    <div className="flex justify-center items-center w-full py-8 sm:py-12 px-4">
      <Card className="w-full max-w-md border border-slate-200/80 dark:border-[#293548] bg-white dark:bg-[#172033] shadow-xs rounded-2xl">
        <CardContent className="flex flex-col items-center p-6 sm:p-8 text-center space-y-4">
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-2xl ${iconClassName}`}
          >
            {icon}
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9] font-heading">
              {title}
            </h2>
            {description && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] max-w-sm leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {onAction && actionLabel && (
            <Button
              variant="outline"
              onClick={onAction}
              className="mt-2 rounded-xl border-slate-200 dark:border-[#293548] dark:bg-[#1E293B] dark:text-[#F1F5F9] dark:hover:bg-[#253347] font-semibold"
            >
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
