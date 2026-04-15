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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl space-y-2">
        {eyebrow ? <Badge variant="info">{eyebrow}</Badge> : null}
        <div>
          <h1 className="font-display text-3xl text-slate-900">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <Button key={action} variant="outline">
            {action}
          </Button>
        ))}
        {extra}
      </div>
    </div>
  );
}
