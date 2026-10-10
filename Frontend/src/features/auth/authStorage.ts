import type { AuthResponse } from "./models";

const AUTH_PROFILE_KEY = "myionio.authProfile.v1";

export type StoredAuthProfile = Omit<AuthResponse, "token" | "refreshToken">;

const asProfile = (value: Partial<AuthResponse> | null): StoredAuthProfile | null => {
  if (!value?.userId || !value.email) return null;
  const profile = { ...value };
  delete profile.token;
  delete profile.refreshToken;
  return profile as StoredAuthProfile;
};

export const loadAuthProfile = (): StoredAuthProfile | null => {
  if (typeof localStorage === "undefined") return null;
  for (const key of [AUTH_PROFILE_KEY, "user"]) {
    try {
      const raw = localStorage.getItem(key);
      const profile = raw ? asProfile(JSON.parse(raw) as Partial<AuthResponse>) : null;
      if (profile) {
        if (key !== AUTH_PROFILE_KEY) localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
        return profile;
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
  return null;
};

export const saveAuthProfile = (response: AuthResponse): StoredAuthProfile => {
  const profile = asProfile(response);
  if (!profile) throw new Error("Authentication response is missing the user profile.");
  localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
  clearLegacyAuthStorage(true);
  return profile;
};

export const clearAuthProfile = (): void => {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(AUTH_PROFILE_KEY);
  clearLegacyAuthStorage(true);
};

export const getLegacyRefreshToken = (): string | null =>
  typeof localStorage === "undefined" ? null : localStorage.getItem("refreshToken");

export const clearLegacyAuthStorage = (includeRefreshToken: boolean): void => {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  if (includeRefreshToken) localStorage.removeItem("refreshToken");
};
