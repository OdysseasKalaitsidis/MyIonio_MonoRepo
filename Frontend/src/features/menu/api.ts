import { AxiosError } from "axios";

import { api } from "../../lib/axios";
import type { WeeklyMenuResponse } from "./models";

export const getMenu = async (): Promise<WeeklyMenuResponse[]> => {
  try {
    const response = await api.get<WeeklyMenuResponse[]>("/menu");

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
};
