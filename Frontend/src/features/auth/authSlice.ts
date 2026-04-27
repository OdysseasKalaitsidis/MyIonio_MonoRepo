import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { AxiosError } from "axios";
import { login, googleLogin, googleRegister } from "./api";
import type { LoginRequest, GoogleLoginRequest, AuthResponse, GoogleRegisterRequest } from "./models";

let parsedUser: AuthResponse | null = null;
try {
  const storedUser = localStorage.getItem("user");
  parsedUser = storedUser ? (JSON.parse(storedUser) as AuthResponse) : null;
} catch {
  parsedUser = null;
  localStorage.removeItem("user");
}

const initialState = {
  user: parsedUser,
  token: parsedUser?.token ?? null,
  isAuthenticated: !!parsedUser?.token && !!parsedUser?.userId,
  loading: false,
  error: null as string | null,
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
      "Google login failed"; // Corrected the missing default string
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
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
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

        state.user = payload;
        state.token = payload.token;
        state.isAuthenticated = !!payload.token && !!payload.userId;
        state.error = null;

        localStorage.setItem("user", JSON.stringify(payload));
        localStorage.setItem("token", payload.token);


      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Login failed";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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
        state.user = payload;
        state.token = payload.token;
        state.isAuthenticated = !!payload.token && !!payload.userId;
        state.error = null;
        localStorage.setItem("user", JSON.stringify(payload));
        localStorage.setItem("token", payload.token);
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Google login failed";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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
        state.user = payload;
        state.token = payload.token;
        state.isAuthenticated = !!payload.token && !!payload.userId;
        state.error = null;
        localStorage.setItem("user", JSON.stringify(payload));
        localStorage.setItem("token", payload.token);
      })
      .addCase(registerWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Google registration failed";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
