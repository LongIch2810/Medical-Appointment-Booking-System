import type { LucideIcon } from "lucide-react";

export type EnterpriseReportQuickStat = {
  label: string;
  value: string;
};

export type EnterpriseReportItem = {
  id: string;
  title: string;
  description: string;
  quickStat: EnterpriseReportQuickStat;
};

export type EnterpriseReportGroup = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  items: EnterpriseReportItem[];
};
