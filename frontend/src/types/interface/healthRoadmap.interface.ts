export interface HealthRoadmapResult {
  id: number;
  createdAt: string;
  title?: string;
  pdfUrl: string | null;
  fileName?: string | null;
  raw?: unknown;
}

export interface HealthRoadmapHistoryItem {
  id: number;
  createdAt: string;
  title: string;
  relative: { id: number; fullname: string | null } | null;
  pdfUrl: string;
  fileName?: string | null;
}
