import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: string[];
  extra?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions = [],
  extra,
}: PageHeaderProps) {
  return (
    <section className="border-b border-slate-200/80 pb-6 dark:border-slate-800">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl space-y-2.5">
          {eyebrow ? (
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs font-bold uppercase tracking-wider">
              {eyebrow}
            </Badge>
          ) : null}
          <div>
            <h1 className="break-words font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          {actions.map((action) => (
            <Button key={action} variant="outline" size="sm" className="rounded-xl font-semibold">
              {action}
            </Button>
          ))}
          {extra}
        </div>
      </div>
    </section>
  );
}
