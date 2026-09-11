import { Command, Search, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getWorkspaceMenu } from "@/lib/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUiStore } from "@/store/useUiStore";

export function CommandPaletteDialog() {
  const isOpen = useUiStore((state) => state.isCommandPaletteOpen);
  const setOpen = useUiStore((state) => state.setCommandPaletteOpen);
  const permissions = useAuthStore((state) => state.permissions);
  const currentRole = useAuthStore((state) => state.currentRole);

  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const workspaceMenu = useMemo(
    () => getWorkspaceMenu(currentRole, permissions),
    [currentRole, permissions]
  );

  const filteredItems = useMemo(() => {
    if (!search.trim()) return workspaceMenu;
    const query = search.toLowerCase().trim();
    return workspaceMenu.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.section.toLowerCase().includes(query)
    );
  }, [workspaceMenu, search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleSelect = (path: string) => {
    setOpen(false);
    setSearch("");
    navigate(path);
  };

  const handleKeyDownInMenu = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? (filteredItems.length || 1) - 1 : prev - 1
      );
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex].path);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl border-slate-200 p-0 overflow-hidden dark:border-slate-800 dark:bg-slate-950 rounded-2xl shadow-lg">
        <DialogTitle className="sr-only">Command Palette Search</DialogTitle>
        <DialogDescription className="sr-only">
          Tìm kiếm nhanh các trang quản lý và lối tắt hệ thống
        </DialogDescription>
        <div className="flex items-center border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <Search className="size-5 shrink-0 text-slate-400 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Gõ tên trang hoặc module để tìm kiếm... (Vd: Quản lý người dùng, Dashboard)"
            className="flex-1 bg-transparent px-3 text-sm outline-none text-slate-900 placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDownInMenu}
            autoFocus
          />
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
            <Command className="size-3" /> K
          </div>
        </div>

        <div className="scrollbar-soft flex-1 min-h-0 max-h-[50dvh] overflow-y-auto overscroll-contain p-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Không tìm thấy trang phù hợp với từ khóa &quot;{search}&quot;.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.path)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white shadow-xs font-semibold dark:bg-primary dark:text-white"
                        : "text-slate-700 hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`p-1.5 rounded-lg ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-primary/10 text-primary dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <div className="font-semibold">{item.label}</div>
                        <div
                          className={`text-[11px] ${
                            isSelected
                              ? "text-white/80"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {item.section}
                        </div>
                      </div>
                    </div>
                    <ArrowRight
                      className={`size-4 transition-transform ${
                        isSelected
                          ? "translate-x-0 opacity-100"
                          : "-translate-x-2 opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Dùng <kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-bold text-[10px]">↑</kbd> <kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-bold text-[10px]">↓</kbd> để di chuyển</span>
            <span>·</span>
            <span><kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-bold text-[10px]">Enter</kbd> chọn</span>
          </div>
          <div><kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-bold text-[10px]">Esc</kbd> đóng</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
