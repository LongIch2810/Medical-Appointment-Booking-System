import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import LazyViewport from "@/components/lazy/LazyViewport";

describe("LazyViewport component", () => {
  let originalIntersectionObserver: typeof window.IntersectionObserver;
  let observerCallback: (entries: Partial<IntersectionObserverEntry>[]) => void;
  let observeMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalIntersectionObserver = window.IntersectionObserver;
    observeMock = vi.fn();
    disconnectMock = vi.fn();

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

  it("renders the fallback skeleton initially before intersecting", () => {
    render(
      <LazyViewport
        minHeight={350}
        fallback={<div data-testid="custom-skeleton">Skeleton Loading...</div>}
      >
        <div data-testid="real-content">Real Content</div>
      </LazyViewport>
    );

    expect(screen.getByTestId("custom-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("real-content")).not.toBeInTheDocument();
  });

  it("renders the real content when entering viewport", () => {
    render(
      <LazyViewport
        minHeight={350}
        fallback={<div data-testid="custom-skeleton">Skeleton Loading...</div>}
      >
        <div data-testid="real-content">Real Content</div>
      </LazyViewport>
    );

    // Trigger viewport intersection
    act(() => {
      if (observerCallback) {
        observerCallback([{ isIntersecting: true }]);
      }
    });

    expect(screen.getByTestId("real-content")).toBeInTheDocument();
    expect(screen.queryByTestId("custom-skeleton")).not.toBeInTheDocument();
  });

  it("keeps children mounted even if user scrolls out of view", () => {
    render(
      <LazyViewport minHeight={350}>
        <div data-testid="persistent-content">Persistent Content</div>
      </LazyViewport>
    );

    // Enter viewport
    act(() => {
      if (observerCallback) {
        observerCallback([{ isIntersecting: true }]);
      }
    });

    expect(screen.getByTestId("persistent-content")).toBeInTheDocument();

    // Leave viewport
    act(() => {
      if (observerCallback) {
        observerCallback([{ isIntersecting: false }]);
      }
    });

    // Remains mounted
    expect(screen.getByTestId("persistent-content")).toBeInTheDocument();
  });

  it("renders error boundary fallback with retry button when chunk error occurs", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    let shouldThrow = true;
    const BuggyComponent = () => {
      if (shouldThrow) {
        throw new Error("Failed to load chunk");
      }
      return <div data-testid="recovered-content">Recovered Content</div>;
    };

    render(
      <LazyViewport minHeight={300}>
        <BuggyComponent />
      </LazyViewport>
    );

    // Enter viewport to trigger rendering buggy component
    act(() => {
      if (observerCallback) {
        observerCallback([{ isIntersecting: true }]);
      }
    });

    expect(
      screen.getByText("Không thể tải nội dung phần này")
    ).toBeInTheDocument();
    expect(screen.getByText("Thử tải lại")).toBeInTheDocument();

    // Now simulate fix and click retry
    shouldThrow = false;
    fireEvent.click(screen.getByText("Thử tải lại"));

    expect(screen.getByTestId("recovered-content")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
