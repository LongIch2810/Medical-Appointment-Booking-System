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
    <section className="border-b border-[#d9d9dd] pb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl space-y-4">
          {eyebrow ? <Badge variant="info">{eyebrow}</Badge> : null}
          <div>
            <h1 className="break-words font-display text-4xl font-medium leading-none text-[#212121] md:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#75758a]">
              {description}
            </p>
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
    </section>
  );
}
