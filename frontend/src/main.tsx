import { createRoot } from "react-dom/client";
import "./index.css";
import "@/i18n";
import App from "./App.tsx";
import InstantBrowserRouter from "@/components/router/InstantBrowserRouter";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { applyStoredTheme } from "@/utils/theme";

// Áp dụng theme lưu trữ của người dùng (mặc định LIGHT/SYSTEM)
applyStoredTheme();

// Sau mỗi lần deploy, tab đang mở từ bản build cũ có thể request 1 chunk
// route-lazy (React.lazy) đã bị xoá khỏi CDN — server trả về index.html
// (200, text/html) thay vì 404 thật, khiến trình duyệt báo lỗi MIME type
// khi cố chạy nó như module JS. Vite tự phát sự kiện "vite:preloadError"
// trong trường hợp này; reload 1 lần để tải lại index.html + chunk mới
// nhất, chặn vòng lặp reload vô hạn nếu lỗi không phải do stale build.
const CHUNK_RELOAD_ONCE_KEY = "lifehealth_chunk_reload_once";
window.addEventListener("vite:preloadError", () => {
  if (sessionStorage.getItem(CHUNK_RELOAD_ONCE_KEY)) return;
  sessionStorage.setItem(CHUNK_RELOAD_ONCE_KEY, "1");
  window.location.reload();
});
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 30_000,
    },
  },
});
createRoot(document.getElementById("root")!).render(
  <InstantBrowserRouter>
    <QueryClientProvider client={queryClient}>
      <App />
      <ToastContainer />
    </QueryClientProvider>
  </InstantBrowserRouter>
);
