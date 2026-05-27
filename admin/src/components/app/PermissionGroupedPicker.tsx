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
        placeholder="Tìm quyền..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {grouped.length === 0 && (
        <p className="text-sm text-[#75758a]">Không có quyền nào khớp.</p>
      )}

      {grouped.map(([domain, items]) => {
        const allSelected = items.every((p) => value.has(p.id));
        const someSelected = items.some((p) => value.has(p.id));
        const domainLabel = DOMAIN_LABELS[domain] ?? domain;

        return (
          <details key={domain} open className="rounded-sm border border-[#d9d9dd]">
            <summary className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-[#212121] cursor-pointer hover:bg-[#f7f6f2]">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={() => toggleDomain(items.map((p) => p.id), !allSelected)}
                  onClick={(e) => e.stopPropagation()}
                  className="accent-[#9b60aa]"
                />
                {domainLabel}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {items.filter((p) => value.has(p.id)).length}/{items.length}
              </Badge>
            </summary>
            <div className="border-t border-[#d9d9dd] px-3 py-2">
              <div className="grid gap-1 sm:grid-cols-2">
                {items.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 text-sm cursor-pointer py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={value.has(p.id)}
                      onChange={() => togglePermission(p.id)}
                      className="accent-[#9b60aa]"
                    />
                    {p.name}
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
