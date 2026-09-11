import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useAuthStore } from "@/store/useAuthStore";
import { usePermission } from "@/hooks/usePermission";

describe("usePermission", () => {
  afterEach(() => {
    useAuthStore.setState({
      currentUser: null,
      currentRole: null,
      permissions: [],
    });
  });

  it("can() returns true when the user holds at least one of the candidate permissions (OR match)", () => {
    useAuthStore.setState({ permissions: ["user:read"] });
    const { result } = renderHook(() => usePermission());

    expect(result.current.can("user:read", "user:manage")).toBe(true);
    expect(result.current.can("user:create")).toBe(false);
  });

  it("can() also matches when the user only has the coarser *:manage permission", () => {
    useAuthStore.setState({ permissions: ["user:manage"] });
    const { result } = renderHook(() => usePermission());

    expect(result.current.can("user:update", "user:manage")).toBe(true);
  });

  it("canAll() requires every listed permission (AND match)", () => {
    useAuthStore.setState({ permissions: ["role:read", "role:update"] });
    const { result } = renderHook(() => usePermission());

    expect(result.current.canAll("role:read", "role:update")).toBe(true);
    expect(result.current.canAll("role:read", "role:delete")).toBe(false);
  });

  it("returns false for both can() and canAll() when the user has no permissions", () => {
    useAuthStore.setState({ permissions: [] });
    const { result } = renderHook(() => usePermission());

    expect(result.current.can("user:read")).toBe(false);
    expect(result.current.canAll("user:read")).toBe(false);
  });

  it("re-derives permissions reactively when the auth store permissions change", () => {
    useAuthStore.setState({ permissions: ["user:read"] });
    const { result, rerender } = renderHook(() => usePermission());
    expect(result.current.can("appointment:read")).toBe(false);

    useAuthStore.setState({ permissions: ["user:read", "appointment:read"] });
    rerender();

    expect(result.current.can("appointment:read")).toBe(true);
  });
});
