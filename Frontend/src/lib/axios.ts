import axios from "axios";
import { clearAuthProfile, clearLegacyAuthStorage, getLegacyRefreshToken } from "../features/auth/authStorage";

const API_URL = import.meta.env.VITE_API_URL || "https://api.myionio.site/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason: unknown) => void }> = [];

const processQueue = (error?: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor to handle unauthorized errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const requestUrl = String(originalRequest?.url ?? "");
    const isSessionEndpoint = [
      "/auth/login",
      "/auth/google-login",
      "/auth/google-nonce",
      "/auth/google-register",
      "/auth/register",
      "/auth/register-with-test",
      "/auth/refresh-token",
      "/auth/logout",
    ].some((path) => requestUrl.includes(path));

    // Auth endpoints report their own failures; only protected API calls may refresh.
    if (error.response?.status === 401 && !originalRequest._retry && !isSessionEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use standard axios to avoid interceptors on the refresh call
        const legacyRefreshToken = getLegacyRefreshToken();
        await axios.post(`${API_URL}/auth/refresh-token`, legacyRefreshToken
          ? { refreshToken: legacyRefreshToken }
          : {}, { withCredentials: true });
        clearLegacyAuthStorage(true);
        processQueue();
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function handleLogout() {
  clearAuthProfile();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
