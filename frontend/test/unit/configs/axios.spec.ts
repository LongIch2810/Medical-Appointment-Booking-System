import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMocks = vi.hoisted(() => {
  type RejectedHandler = (error: AxiosError) => Promise<unknown>;
  type MockInstance = ReturnType<typeof vi.fn> & {
    post: ReturnType<typeof vi.fn>;
    interceptors: {
      request: { use: ReturnType<typeof vi.fn> };
      response: { use: ReturnType<typeof vi.fn> };
    };
    responseRejected?: RejectedHandler;
  };

  const instances: MockInstance[] = [];
  const create = vi.fn(() => {
    const instance = vi.fn() as MockInstance;
    instance.post = vi.fn();
    instance.interceptors = {
      request: { use: vi.fn() },
      response: {
        use: vi.fn(
          (_fulfilled: (response: unknown) => unknown, rejected: RejectedHandler) => {
            instance.responseRejected = rejected;
          },
        ),
      },
    };
    instances.push(instance);
    return instance;
  });

  return { create, instances };
});

vi.mock("axios", () => ({
  default: { create: axiosMocks.create },
}));

import { useUserStore } from "@/store/useUserStore";
import axiosInstance from "@/configs/axios";

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function makeError(status: number, url = "/appointments/1"): AxiosError {
  const config = { url } as RetryableConfig;
  return {
    config,
    response: { status, data: {}, statusText: "", headers: {}, config },
    isAxiosError: true,
    toJSON: () => ({}),
    name: "AxiosError",
    message: "request failed",
  } as unknown as AxiosError;
}

function rejectedHandler() {
  const handler = axiosMocks.instances[0]?.responseRejected;
  if (!handler) throw new Error("Response interceptor was not registered");
  return handler;
}

describe("patient axios response interceptor", () => {
  const apiInstance = axiosInstance as unknown as (typeof axiosMocks.instances)[number];
  const refreshInstance = axiosMocks.instances[1];

  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({ userInfo: null });
    Object.defineProperty(window, "location", {
      value: { hostname: "localhost", href: "http://localhost/" },
      writable: true,
      configurable: true,
    });
  });

  it("passes through non-401 errors and bypasses auth requests", async () => {
    const handler = rejectedHandler();
    const serverError = makeError(500);
    const loginError = makeError(401, "/auth/login");

    await expect(handler(serverError)).rejects.toBe(serverError);
    await expect(handler(loginError)).rejects.toBe(loginError);
    expect(refreshInstance.post).not.toHaveBeenCalled();
  });

  it("refreshes once and retries the original request", async () => {
    refreshInstance.post.mockResolvedValue({ data: {} });
    apiInstance.mockResolvedValue({ data: { ok: true } });
    const error = makeError(401);

    await expect(rejectedHandler()(error)).resolves.toEqual({
      data: { ok: true },
    });

    expect(refreshInstance.post).toHaveBeenCalledOnce();
    expect(refreshInstance.post).toHaveBeenCalledWith("/auth/refresh");
    expect(apiInstance).toHaveBeenCalledWith(error.config);
    expect((error.config as RetryableConfig)._retry).toBe(true);
  });

  it("queues concurrent 401 responses behind one refresh", async () => {
    let finishRefresh: (() => void) | undefined;
    refreshInstance.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishRefresh = () => resolve({ data: {} });
        }),
    );
    apiInstance.mockResolvedValue({ data: { retried: true } });

    const first = rejectedHandler()(makeError(401, "/appointments/1"));
    const second = rejectedHandler()(makeError(401, "/appointments/2"));
    finishRefresh?.();

    await expect(Promise.all([first, second])).resolves.toEqual([
      { data: { retried: true } },
      { data: { retried: true } },
    ]);
    expect(refreshInstance.post).toHaveBeenCalledTimes(1);
    expect(apiInstance).toHaveBeenCalledTimes(2);
  });

  it("logs out and resets patient state when refresh fails", async () => {
    useUserStore.setState({ userInfo: { id: 7 } as never });
    const refreshError = new Error("refresh failed");
    refreshInstance.post
      .mockRejectedValueOnce(refreshError)
      .mockResolvedValueOnce({ data: {} });
    const resetState = vi.spyOn(useUserStore.getState(), "resetState");

    await expect(rejectedHandler()(makeError(401))).rejects.toBe(refreshError);

    expect(refreshInstance.post).toHaveBeenNthCalledWith(1, "/auth/refresh");
    expect(refreshInstance.post).toHaveBeenNthCalledWith(2, "/auth/logout");
    expect(resetState).toHaveBeenCalledOnce();
    expect(useUserStore.getState().userInfo).toBeNull();
  });
});
