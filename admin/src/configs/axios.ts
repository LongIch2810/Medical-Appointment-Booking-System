import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/store/useAuthStore";

function getBackendBaseURL() {
  const configuredURL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  if (typeof window === "undefined") {
    return configuredURL;
  }

  const backendURL = new URL(configuredURL);
  const localHosts = new Set(["localhost", "127.0.0.1"]);
  if (
    localHosts.has(backendURL.hostname) &&
    localHosts.has(window.location.hostname)
  ) {
    backendURL.hostname = window.location.hostname;
  }

  return backendURL.toString().replace(/\/$/, "");
}

const backendBaseURL = `${getBackendBaseURL()}/api/v1`;

const axiosInstance = axios.create({
  baseURL: backendBaseURL,
  withCredentials: true,
});

// `refreshInstance` không có interceptor, dùng cho các call auth (login/refresh/
// logout/...) để tránh đệ quy refresh khi chính các endpoint này trả 401.
export const refreshInstance = axios.create({
  baseURL: backendBaseURL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

const AUTH_BYPASS_PATHS = [
  "/auth/login",
  "/auth/admin/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/logout-all",
  "/auth/set-new-password",
];

function shouldBypassRefresh(url: string) {
  return AUTH_BYPASS_PATHS.some((path) => url.includes(path));
}

function isUnauthorizedError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const status = (error as AxiosError).response?.status;
  return status === 401 || status === 403;
}

/**
 * Promise refresh dùng chung. Mọi request bị 401 đồng thời sẽ chờ chung
 * promise này thay vì gọi `/auth/refresh` nhiều lần. Sau khi promise settle
 * thì reset, các 401 tiếp theo (vd access token tiếp tục hết hạn sau một thời
 * gian) sẽ trigger refresh mới.
 */
let refreshPromise: Promise<void> | null = null;

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = refreshInstance
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

let isHandlingExpired = false;

function handleSessionExpired() {
  // Đồng bộ qua state của store: nếu store đã rỗng nghĩa là đã được xử lý.
  // Cho phép logic hoạt động lại sau khi user login lại trên cùng SPA tab.
  const store = useAuthStore.getState();
  if (!store.currentUser && isHandlingExpired) {
    return;
  }
  isHandlingExpired = true;
  try {
    store.logout();
  } catch {
    // ignore store errors
  }
  // best-effort logout về backend, không chặn UX nếu fail
  refreshInstance.post("/auth/logout").catch(() => undefined);

  if (
    typeof window !== "undefined" &&
    window.location.pathname !== "/login"
  ) {
    window.location.href = "/login";
  }
}

// Khi store có user lại (user login mới trên cùng tab) → cho phép xử lý expire
// kế tiếp bình thường.
useAuthStore.subscribe((state, prevState) => {
  if (state.currentUser && !prevState.currentUser) {
    isHandlingExpired = false;
  }
});

type RetryableConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const url = originalRequest.url ?? "";
    if (shouldBypassRefresh(url)) {
      return Promise.reject(error);
    }

    const retryCount = originalRequest._retryCount ?? 0;
    if (retryCount >= 1) {
      // Đã refresh + retry một lần mà vẫn 401 → session thực sự hết hạn.
      handleSessionExpired();
      return Promise.reject(error);
    }
    originalRequest._retryCount = retryCount + 1;

    try {
      await refreshSession();
    } catch (refreshErr) {
      // Refresh token không còn hiệu lực → đá user về login.
      // Lỗi tạm thời (network, 5xx) → giữ nguyên session, để caller xử lý.
      if (isUnauthorizedError(refreshErr)) {
        handleSessionExpired();
      }
      return Promise.reject(refreshErr);
    }

    return axiosInstance(originalRequest);
  },
);

export default axiosInstance;
