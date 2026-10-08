import { api } from "../../lib/axios";

export interface SaveCoursesRequest {
  semester: string | number;
  courses: string[];
  courseIds?: string[];
  major?: string;
  minor?: string;
}

export const saveUserCourses = async (data: SaveCoursesRequest): Promise<void> => {
  await api.post("/user/courses", data);
};
