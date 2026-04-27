import { api } from "../../lib/axios";

export interface SaveCoursesRequest {
  semester: string | number;
  courses: string[];
  major?: string;
  minor?: string;
}

export const saveUserCourses = async (data: SaveCoursesRequest): Promise<void> => {
  console.log("[DEBUG] saveUserCourses called with:", JSON.stringify(data));
  try {
    const response = await api.post("/user/courses", data);
    console.log("[DEBUG] saveUserCourses success:", response.status);
  } catch (error) {
    console.error("[DEBUG] saveUserCourses failed:", error);
    throw error;
  }
};
