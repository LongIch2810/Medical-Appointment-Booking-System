import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount rendered components after every test so DOM state doesn't leak
// between test cases (standard React Testing Library + Vitest setup).
afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia; several real components (e.g.
// ThemeToggle) call it directly in an effect on mount.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}

if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:test';
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;
