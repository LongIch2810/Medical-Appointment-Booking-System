import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handlers: new Map<string, (payload: unknown) => unknown>(),
  disconnect: vi.fn(),
  connect: vi.fn(),
  removeAllListeners: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn(),
  io: vi.fn(),
}));

vi.mock("socket.io-client", () => ({
  io: mocks.io,
}));

vi.mock("@/configs/axios", () => ({
  backendOrigin: "http://localhost:3000",
  refreshInstance: { post: mocks.refresh },
}));

vi.mock("react-toastify", () => ({
  toast: { error: mocks.toastError },
}));

import { connectSocket, disconnectSocket } from "@/utils/socket";

describe("admin websocket rate-limit handling", () => {
  beforeEach(() => {
    mocks.handlers.clear();
    mocks.disconnect.mockClear();
    mocks.connect.mockClear();
    mocks.removeAllListeners.mockClear();
    mocks.refresh.mockClear();
    mocks.toastError.mockClear();
    mocks.io.mockReturnValue({
      connected: true,
      on: vi.fn((event: string, handler: (payload: unknown) => unknown) => {
        mocks.handlers.set(event, handler);
      }),
      disconnect: mocks.disconnect,
      connect: mocks.connect,
      removeAllListeners: mocks.removeAllListeners,
    });
  });

  afterEach(() => {
    disconnectSocket();
  });

  it("shows a deduplicated toast for 429 without refreshing or reconnecting", async () => {
    connectSocket();
    const onWsError = mocks.handlers.get("ws-error");

    await onWsError?.({ code: 429, retryAfter: 294 });

    expect(mocks.toastError).toHaveBeenCalledWith(
      "Bạn đang thao tác quá nhanh. Vui lòng thử lại sau 294 giây.",
      { toastId: "websocket-rate-limit" }
    );
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(mocks.disconnect).not.toHaveBeenCalled();
    expect(mocks.connect).not.toHaveBeenCalled();
  });
});
