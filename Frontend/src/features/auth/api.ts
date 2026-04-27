import type {
  LoginRequest,
  AuthResponse,
  RegisterRequest,
  RegisterResponse,
  RegisterRequestWithTest,
  RegisterResponseWithTest,
  GoogleLoginRequest,
  GoogleRegisterRequest,
} from "./models";
import { api } from "../../lib/axios";

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", data);
  return response.data;
};

export const googleLogin = async (
  data: GoogleLoginRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/google-login", data);
  return response.data;
};

export const registerUser = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>("/auth/register", data);

  return response.data;
};

export const registerUserWithTest = async (
  data: RegisterRequestWithTest
): Promise<RegisterResponseWithTest> => {


  const response = await api.post<RegisterResponseWithTest>(
    "/auth/register-with-test",
    data
  );



  return response.data;
};

export const googleRegister = async (
  data: GoogleRegisterRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/google-register", data);
  return response.data;
};
