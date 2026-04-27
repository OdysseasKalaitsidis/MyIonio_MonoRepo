import type { QuestionsDto, RecommendationDto, UserAnswerDto } from "./models";
import { AxiosError } from "axios";
import { api } from "../../lib/axios";

export async function getAllQuestions(): Promise<QuestionsDto[]> {
  const response = await api.get<QuestionsDto[]>("/questions");
  return response.data;
}

export async function submitAnonymousTest(
  submission: UserAnswerDto[]
): Promise<RecommendationDto> {

  console.log(
    "API: Full URL will be:",
    `${api.defaults.baseURL}/submit-anonymous`
  );

  try {
    const response = await api.post<RecommendationDto>(
      "submit-anonymous",
      submission
    );

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("API: Error details:", {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
      url: axiosError.config?.url,
      baseURL: axiosError.config?.baseURL,
      fullURL: `${axiosError.config?.baseURL ?? ""}${
        axiosError.config?.url ?? ""
      }`,
    });
    throw axiosError;
  }
}

export async function submitUserTest(
  submission: UserAnswerDto[]
): Promise<RecommendationDto> {
  try {
    const response = await api.post<RecommendationDto>("submit", submission);

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("API: Error details:", {
      message: axiosError.message,
      response: axiosError.response?.data,
      status: axiosError.response?.status,
      url: axiosError.config?.url,
      baseURL: axiosError.config?.baseURL,
      fullURL: `${axiosError.config?.baseURL ?? ""}${
        axiosError.config?.url ?? ""
      }`,
    });
    throw axiosError;
  }
}

export async function getUserRecommendation(
  userId: string
): Promise<RecommendationDto> {
  if (!userId) throw new Error("User ID is required");

  try {
    const response = await api.get<RecommendationDto>(`/results/${userId}`);
    return response.data;
  } catch (err) {
    const axiosError = err as AxiosError;
    console.error("[getUserRecommendation] API error:", {
      message: axiosError.message,
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      url: `${axiosError.config?.baseURL}${axiosError.config?.url}`,
    });
    const responseData = axiosError.response?.data as
      | { message?: string }
      | undefined;
    throw new Error(
      responseData?.message || "Failed to fetch user recommendation"
    );
  }
}
