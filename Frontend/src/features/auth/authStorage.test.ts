// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAuthProfile, loadAuthProfile, saveAuthProfile } from "./authStorage";

describe("authStorage", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, String(value)),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    });
  });

  it("persists only the non-secret user profile", () => {
    saveAuthProfile({
      token: "access-secret",
      refreshToken: "refresh-secret",
      userId: "user-id",
      email: "student@example.com",
      firstName: "Student",
      lastName: "User",
    });

    const stored = localStorage.getItem("myionio.authProfile.v1") || "";
    expect(stored).not.toContain("access-secret");
    expect(stored).not.toContain("refresh-secret");
    expect(loadAuthProfile()?.email).toBe("student@example.com");
  });

  it("clears legacy token storage without touching device preferences", () => {
    localStorage.setItem("token", "legacy-access");
    localStorage.setItem("refreshToken", "legacy-refresh");
    localStorage.setItem("myionio.devicePreferences.v1", "saved-preferences");

    clearAuthProfile();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("myionio.devicePreferences.v1")).toBe("saved-preferences");
  });
});
