import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { AxiosError } from "axios";
import { login, googleLogin, googleRegister, logoutSession, refreshSession } from "./api";
import type { LoginRequest, GoogleLoginRequest, AuthResponse, GoogleRegisterRequest } from "./models";
import { clearAuthProfile, clearLegacyAuthStorage, getLegacyRefreshToken, loadAuthProfile, saveAuthProfile } from "./authStorage";

const storedProfile = loadAuthProfile();

const initialState = {
  user: storedProfile as AuthResponse | null,
  token: null as string | null,
  isAuthenticated: false,
  sessionChecked: false,
  loading: false,
  error: null as string | null,
};

export const restoreSession = createAsyncThunk<AuthResponse, void, { rejectValue: string }>(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    try {
      const legacyRefreshToken = getLegacyRefreshToken();
      const response = await refreshSession(legacyRefreshToken);
      clearLegacyAuthStorage(true);
      return response;
    } catch {
      clearAuthProfile();
      return rejectWithValue("No active session");
    }
  },
);

export const signOut = createAsyncThunk("auth/signOut", async () => {
  try {
    await logoutSession();
  } catch {
    // Local sign-out must still complete when the API is temporarily unavailable.
  } finally {
    clearAuthProfile();
  }
});

const applyAuthenticated = (state: typeof initialState, response: AuthResponse) => {
  const profile = saveAuthProfile(response);
  state.user = profile as AuthResponse;
  state.token = null;
  state.isAuthenticated = true;
  state.sessionChecked = true;
  state.error = null;
  state.loading = false;
};

export const signIn = createAsyncThunk<
  AuthResponse,
  LoginRequest,
  { rejectValue: string }
>("auth/signIn", async (credentials, { rejectWithValue }) => {
  try {
    const response = await login(credentials);

    return response;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message =
      axiosError.response?.data?.message ??
      axiosError.message ??
      "Login failed";
    return rejectWithValue(message);
  }
});

export const loginWithGoogle = createAsyncThunk<
  AuthResponse,
  GoogleLoginRequest,
  { rejectValue: string }
>("auth/loginWithGoogle", async (data, { rejectWithValue }) => {
  try {
    const response = await googleLogin(data);
    return response;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message =
      axiosError.response?.data?.message ??
      axiosError.message ??
      "Google login failed";
    return rejectWithValue(message);
  }
});

export const registerWithGoogle = createAsyncThunk<
  AuthResponse,
  GoogleRegisterRequest,
  { rejectValue: string }
>("auth/registerWithGoogle", async (data, { rejectWithValue }) => {
  try {
    const response = await googleRegister(data);
    return response;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message =
      axiosError.response?.data?.message ??
      axiosError.message ??
      "Google registration failed";
    return rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {


        const payload = {
          ...action.payload,
          recommendation: action.payload.recommendation ?? null, // keep recommendation optional
          // DO NOT overwrite userId
        };

        applyAuthenticated(state, payload);


      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Login failed";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        clearAuthProfile();
      })
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        const payload = {
          ...action.payload,
          recommendation: action.payload.recommendation ?? null,
        };
        applyAuthenticated(state, payload);
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Google login failed";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        clearAuthProfile();
      })
      .addCase(registerWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerWithGoogle.fulfilled, (state, action) => {
        const payload = {
          ...action.payload,
          recommendation: action.payload.recommendation ?? null,
        };
        applyAuthenticated(state, payload);
      })
      .addCase(registerWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Google registration failed";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        clearAuthProfile();
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        applyAuthenticated(state, action.payload);
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.sessionChecked = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.sessionChecked = true;
      });
  },
});

export default authSlice.reducer;
