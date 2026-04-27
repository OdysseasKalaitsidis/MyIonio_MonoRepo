import type { RecommendationDto, UserAnswerDto } from "../quiz/models";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  IdToken: string;
  semester?: string;
  major?: string;
  minor?: string;
  department?: string;
  enrolledCourses?: string[];
}

export interface GoogleRegisterRequest {
  idToken: string;
  department: string;
  semester: string;
  recommendation: RecommendationDto | null;
}

export interface AuthResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  refreshToken: string | null;
  userId: string;
  recommendation?: RecommendationDto | null;
  semester?: string;
  department?: string;
  major?: string;
  minor?: string;
}

export interface RegisterRequest {
  name: string;
  surname: string;
  email: string;
  department: string;
  semester: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  message: string;
  userId?: string;
}

export interface AuthState {
  user: AuthResponse | null;
  loading: boolean;
  error: string | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface RegisterRequestWithTest {
  UserData: RegisterRequest;
  Recommendation: RecommendationDto;
  UserAnswers: UserAnswerDto[];
}

export interface RegisterResponseWithTest {
  userid: string;
  token: string;
  RecommendationDto?: RecommendationDto[];
}
