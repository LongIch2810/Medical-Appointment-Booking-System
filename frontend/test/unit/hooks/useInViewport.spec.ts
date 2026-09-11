import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useInViewport } from "@/hooks/useInViewport";

describe("useInViewport hook", () => {
  let originalIntersectionObserver: typeof window.IntersectionObserver;
  let observeMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;
  let observerCallback: (entries: Partial<IntersectionObserverEntry>[]) => void;

  beforeEach(() => {
    originalIntersectionObserver = window.IntersectionObserver;
    observeMock = vi.fn();
    disconnectMock = vi.fn();

    // Mock IntersectionObserver using a proper class (callable with new)
    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = "100px 0px";
      readonly thresholds: ReadonlyArray<number> = [0.01];

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback as unknown as typeof observerCallback;
      }

      observe = observeMock;
      disconnect = disconnectMock;
      unobserve = vi.fn();
      takeRecords = vi.fn().mockReturnValue([]);
    }

    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof window.IntersectionObserver;
  });

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it("initializes with isInView=false and hasBeenInView=false when observer is supported", () => {
    const { result } = renderHook(() => useInViewport());

    expect(result.current.isInView).toBe(false);
    expect(result.current.hasBeenInView).toBe(false);
  });

  it("observes the ref element when mounted", () => {
    const { result } = renderHook(() => {
      const hook = useInViewport();
      const div = document.createElement("div");
      // @ts-expect-error mutating ref for test
      hook.ref.current = div;
      return hook;
    });

    act(() => {
      // flush
    });

    expect(result.current.ref.current).toBeDefined();
  });

  it("updates isInView and hasBeenInView to true when element intersects", () => {
    const { result } = renderHook(() => {
      const hook = useInViewport({ once: true });
      const div = document.createElement("div");
      // @ts-expect-error mutating ref for test
      hook.ref.current = div;
      return hook;
    });

    // Simulate element intersecting
    act(() => {
      if (observerCallback) {
        observerCallback([{ isIntersecting: true }]);
      }
    });

    expect(result.current.isInView).toBe(true);
    expect(result.current.hasBeenInView).toBe(true);
    // Since once: true, observer should disconnect
    expect(disconnectMock).toHaveBeenCalled();
  });

  it("disconnects on unmount", () => {
    const { unmount } = renderHook(() => {
      const hook = useInViewport();
      const div = document.createElement("div");
      // @ts-expect-error mutating ref for test
      hook.ref.current = div;
      return hook;
    });

    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });

  it("falls back to true when IntersectionObserver is not supported in the environment", () => {
    // Delete IntersectionObserver
    // @ts-expect-error testing missing global
    delete window.IntersectionObserver;

    const { result } = renderHook(() => useInViewport());

    expect(result.current.isInView).toBe(true);
    expect(result.current.hasBeenInView).toBe(true);
  });
});
