import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance, { refreshInstance } from "@/configs/axios";
import { useAuthStore } from "@/store/useAuthStore";

type RetryableConfig = InternalAxiosRequestConfig & { _retryCount?: number };

function getResponseRejectedHandler() {
  // axios stores interceptors internally as { fulfilled, rejected } entries;
  // reaching into it lets us unit test the interceptor's decision logic
  // directly, without mocking the network layer or adding a new dependency.
  const handlers = (
    axiosInstance.interceptors.response as unknown as {
      handlers: Array<{ rejected: (error: AxiosError) => unknown } | null>;
    }
  ).handlers;
  const last = handlers[handlers.length - 1];
  if (!last) throw new Error("No response interceptor registered.");
  return last.rejected;
}

function make401Error(url: string, retryCount?: number): AxiosError {
  const config = { url, _retryCount: retryCount } as RetryableConfig;
  return {
    config,
    response: { status: 401, data: {}, statusText: "Unauthorized", headers: {}, config },
    isAxiosError: true,
    toJSON: () => ({}),
    name: "AxiosError",
    message: "Unauthorized",
  } as unknown as AxiosError;
}

function makeNon401Error(status: number): AxiosError {
  const config = { url: "/appointments/1" } as RetryableConfig;
  return {
    config,
    response: { status, data: {}, statusText: "", headers: {}, config },
    isAxiosError: true,
    toJSON: () => ({}),
    name: "AxiosError",
    message: "error",
  } as unknown as AxiosError;
}

describe("axiosInstance response interceptor", () => {
  let locationHrefSpy: { value: string };

  beforeEach(() => {
    // Force isHandlingExpired (module-private) back to its initial `false`
    // state via the store subscription side-effect (falsy -> truthy ->
    // falsy currentUser transition), so tests don't leak state into
    // each other via that closure variable.
    useAuthStore.setState({ currentUser: null, currentRole: null, permissions: [] });
    useAuthStore.setState({ currentUser: { id: 1 } as never });
    useAuthStore.setState({ currentUser: null, currentRole: null, permissions: [] });

    locationHrefSpy = { value: "" };
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/admin/dashboard",
        get href() {
          return locationHrefSpy.value;
        },
        set href(value: string) {
          locationHrefSpy.value = value;
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes through a non-401 error untouched", async () => {
    const error = makeNon401Error(500);
    const rejected = getResponseRejectedHandler();

    await expect(rejected(error)).rejects.toBe(error);
  });

  it("does not attempt a refresh for AUTH_BYPASS_PATHS (e.g. /auth/login)", async () => {
    const postSpy = vi.spyOn(refreshInstance, "post");
    const error = make401Error("/auth/login");
    const rejected = getResponseRejectedHandler();

    await expect(rejected(error)).rejects.toBe(error);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it("deduplicates concurrent 401s into a single /auth/refresh call", async () => {
    const postSpy = vi
      .spyOn(refreshInstance, "post")
      .mockResolvedValue({ data: {} } as never);
    // Retrying axiosInstance(originalRequest) after a successful refresh
    // would otherwise hit the real network; the retry itself is out of
    // scope for this test — asserting the refresh call is deduplicated is
    // the behavior under test.
    const requestSpy = vi
      .spyOn(axiosInstance, "request")
      .mockResolvedValue({ data: {} } as never);
    const rejected = getResponseRejectedHandler();

    const errorA = make401Error("/appointments/1");
    const errorB = make401Error("/appointments/2");

    await Promise.all([
      rejected(errorA).catch(() => undefined),
      rejected(errorB).catch(() => undefined),
    ]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith("/auth/refresh");
    requestSpy.mockRestore();
  });

  it("logs the session out and redirects once a request has already been retried and still gets 401", async () => {
    // Note: asserting on resulting store STATE rather than spying on
    // useAuthStore.getState().logout directly — Zustand's set() copies
    // action functions by reference into each new state object, so a spy
    // placed on one state snapshot leaks forward into every later snapshot
    // (and survives vi.restoreAllMocks(), since restore only reverts the
    // exact object instance that was spied on) — that made the logout spy
    // double-counted by the time later tests in this file ran.
    useAuthStore.setState({ currentUser: { id: 1 } as never });
    const postSpy = vi
      .spyOn(refreshInstance, "post")
      .mockResolvedValue({ data: {} } as never);
    const error = make401Error("/appointments/1", 1);
    const rejected = getResponseRejectedHandler();

    await expect(rejected(error)).rejects.toBe(error);

    // Refresh is never attempted a second time once already retried once.
    expect(postSpy).not.toHaveBeenCalledWith("/auth/refresh");
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(locationHrefSpy.value).toBe("/login");
  });

  it("logs the session out when the refresh call itself comes back unauthorized", async () => {
    useAuthStore.setState({ currentUser: { id: 1 } as never });
    vi.spyOn(refreshInstance, "post").mockImplementation((url: string) => {
      if (url === "/auth/refresh") {
        return Promise.reject(makeNon401Error(401));
      }
      return Promise.resolve({ data: {} } as never);
    });
    const error = make401Error("/appointments/1");
    const rejected = getResponseRejectedHandler();

    await expect(rejected(error)).rejects.toBeDefined();

    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(locationHrefSpy.value).toBe("/login");
  });

  it("keeps the session alive when the refresh call fails for a transient (non-auth) reason", async () => {
    useAuthStore.setState({ currentUser: { id: 1 } as never });
    vi.spyOn(refreshInstance, "post").mockImplementation((url: string) => {
      if (url === "/auth/refresh") {
        return Promise.reject(new Error("network error"));
      }
      return Promise.resolve({ data: {} } as never);
    });
    const error = make401Error("/appointments/1");
    const rejected = getResponseRejectedHandler();

    await expect(rejected(error)).rejects.toBeDefined();

    expect(useAuthStore.getState().currentUser).not.toBeNull();
    expect(locationHrefSpy.value).toBe("");
  });
});
