// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearDevicePreferences, DEVICE_PREFERENCES_KEY, loadDevicePreferences, saveDevicePreferences } from "./devicePreferences";

describe("devicePreferences", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, String(value)),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    });
  });

  it("persists course selections separately for every semester", () => {
    saveDevicePreferences({
      version: 1,
      department: "Department of Informatics",
      departmentId: 1,
      semester: "Ζ",
      semesterId: 7,
      major: "ΒΥΝ",
      minor: "ΚΔΕ",
      toolbox: ["TB1"],
      hiddenCourses: [],
      selectedCoursesBySemester: {
        "3": ["Course Γ"],
        "7": ["Course Ζ"],
      },
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    });

    const restored = loadDevicePreferences();

    expect(restored.major).toBe("ΒΥΝ");
    expect(restored.minor).toBe("ΚΔΕ");
    expect(restored.selectedCoursesBySemester["3"]).toEqual(["Course Γ"]);
    expect(restored.selectedCoursesBySemester["7"]).toEqual(["Course Ζ"]);
  });

  it("migrates the legacy device keys without losing checked courses", () => {
    localStorage.setItem("hud_department", "Department of Informatics");
    localStorage.setItem("hud_departmentId", "1");
    localStorage.setItem("hud_semester", "Ε");
    localStorage.setItem("hud_semesterId", "5");
    localStorage.setItem("hud_major", "ΨΜΑΔ");
    localStorage.setItem("hud_selectedCourses", JSON.stringify(["Legacy course"]));
    localStorage.setItem("hud_selectedCoursesSemesterId", "5");

    const restored = loadDevicePreferences();

    expect(restored.onboardingCompleted).toBe(true);
    expect(restored.major).toBe("ΨΜΑΔ");
    expect(restored.selectedCoursesBySemester["5"]).toEqual(["Legacy course"]);
    expect(localStorage.getItem(DEVICE_PREFERENCES_KEY)).not.toBeNull();
  });

  it("recovers safely from malformed local data", () => {
    localStorage.setItem(DEVICE_PREFERENCES_KEY, "{broken");
    localStorage.setItem("hud_toolbox", "not-json");

    expect(() => loadDevicePreferences()).not.toThrow();
    expect(loadDevicePreferences().toolbox).toEqual([]);
  });
  it("clears versioned and legacy preferences", () => {
    localStorage.setItem(DEVICE_PREFERENCES_KEY, JSON.stringify({ version: 1 }));
    localStorage.setItem("hud_semester", "Α");
    localStorage.setItem("hud_selectedCourses", JSON.stringify(["course-a"]));

    clearDevicePreferences();

    expect(localStorage.getItem(DEVICE_PREFERENCES_KEY)).toBeNull();
    expect(localStorage.getItem("hud_semester")).toBeNull();
    expect(localStorage.getItem("hud_selectedCourses")).toBeNull();
  });

});
