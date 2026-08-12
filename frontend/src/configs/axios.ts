import { useUserStore } from "@/store/useUserStore";
import axios from "axios";

export function getBackendBaseURL() {
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

export const backendOrigin = getBackendBaseURL();
export const backendBaseURL = `${backendOrigin}/api/v1`;

const axiosInstance = axios.create({
  baseURL: backendBaseURL,
  withCredentials: true,
});

const refreshInstance = axios.create({
  baseURL: backendBaseURL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

function processorQueue(error: any = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";
    if (
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(axiosInstance(originalRequest)),
          reject: () => reject(error),
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await refreshInstance.post("/auth/refresh");
      processorQueue();
      return axiosInstance(originalRequest);
    } catch (refreshErr) {
      processorQueue(refreshErr);
      try {
        await refreshInstance.post("/auth/logout");
      } catch {
        // Ignore logout failures here; refresh failure is the auth source of truth.
      }
      useUserStore.getState().resetState();
      window.location.href = "/sign-in";
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
