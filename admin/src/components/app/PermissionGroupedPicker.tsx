import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const DOMAIN_LABELS: Record<string, string> = {
  "auth": "Xác thực",
  "user": "Người dùng",
  "patient": "Bệnh nhân",
  "doctor": "Bác sĩ",
  "appointment": "Lịch hẹn",
  "doctor-schedule": "Lịch bác sĩ",
  "role": "Vai trò",
  "permission": "Quyền",
  "role-permission": "Phân quyền",
  "specialty": "Chuyên khoa",
  "topic": "Chủ đề",
  "tag": "Thẻ",
  "article": "Bài viết",
  "message": "Tin nhắn",
  "channel": "Kênh",
  "relative": "Người thân",
  "relationship": "Mối quan hệ",
  "health-profile": "Hồ sơ sức khỏe",
  "examination-result": "Kết quả khám",
  "satisfaction-rating": "Đánh giá",
  "audit-log": "Nhật ký",
  "complaint": "Khiếu nại",
  "notification": "Thông báo",
  "dashboard": "Bảng điều khiển",
  "setting": "Cài đặt",
  "patient-record": "Hồ sơ bệnh nhân",
  "chatbot": "Chatbot",
};

type PermissionItem = { id: number; name: string };

type Props = {
  permissions: PermissionItem[];
  value: Set<number>;
  onChange: (next: Set<number>) => void;
  excludeIds?: Set<number>;
  restrictToIds?: Set<number>;
};

export function PermissionGroupedPicker({
  permissions,
  value,
  onChange,
  excludeIds,
  restrictToIds,
}: Props) {
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return permissions.filter((p) => {
      if (excludeIds && excludeIds.has(p.id)) return false;
      if (restrictToIds && !restrictToIds.has(p.id)) return false;
      if (!term) return true;
      return p.name.toLowerCase().includes(term);
    });
  }, [permissions, excludeIds, restrictToIds, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    for (const p of visible) {
      const domain = p.name.includes(":")
        ? p.name.slice(0, p.name.indexOf(":"))
        : "other";
      const list = map.get(domain);
      if (list) list.push(p);
      else map.set(domain, [p]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visible]);

  const togglePermission = (id: number) => {
    const next = new Set(value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const toggleDomain = (ids: number[], selected: boolean) => {
    const next = new Set(value);
    for (const id of ids) {
      if (selected) next.add(id);
      else next.delete(id);
    }
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Tìm quyền theo tên..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-10 rounded-xl"
      />

      {grouped.length === 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic p-2">Không có quyền nào khớp với từ khóa tìm kiếm.</p>
      )}

      {grouped.map(([domain, items]) => {
        const allSelected = items.every((p) => value.has(p.id));
        const someSelected = items.some((p) => value.has(p.id));
        const domainLabel = DOMAIN_LABELS[domain] ?? domain;

        return (
          <details key={domain} open className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <summary className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 cursor-pointer bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70">
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={() => toggleDomain(items.map((p) => p.id), !allSelected)}
                  onClick={(e) => e.stopPropagation()}
                  className="accent-primary size-4 rounded cursor-pointer"
                />
                <span>{domainLabel}</span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">({domain})</span>
              </span>
              <Badge variant="outline" className="text-[10px] font-bold">
                {items.filter((p) => value.has(p.id)).length}/{items.length}
              </Badge>
            </summary>
            <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
              <div className="grid gap-1.5 sm:grid-cols-2">
                {items.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <input
                      type="checkbox"
                      checked={value.has(p.id)}
                      onChange={() => togglePermission(p.id)}
                      className="accent-primary size-3.5 rounded cursor-pointer"
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}

