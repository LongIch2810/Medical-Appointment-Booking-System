import React from "react";

const RouteLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-label="Đang tải trang..."
    className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 p-8"
  >
    <div className="w-9 h-9 border-3 border-slate-200 dark:border-slate-800 border-t-[#159a98] dark:border-t-[#2cd4d1] rounded-full animate-spin" />
    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
      Đang tải dữ liệu trang...
    </span>
  </div>
);

export default RouteLoadingFallback;
