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
