import { AxiosError } from "axios";
import { api } from "../../lib/axios";

export interface ScheduleRequestDto {
  department?: string;
  departmentId?: number;
  semesterId?: number;
  semester?: string;
}

export interface CourseRole {
  pathway: string;
  audience: "MAJOR" | "MINOR";
  requirement: "REQUIRED" | "ELECTIVE";
}

export interface ScheduleResponseDto {
  id: string;
  course_id?: string;
  day: string;
  room: string;
  building: string;
  time_start: string;
  time_end: string;
  professor: string;
  course_name: string;
  type: string;
  delivery_type?: string;
  schedule_track?: string;
  roles?: CourseRole[];
  toolboxes?: string[];
}

export interface CourseOption {
  courseId: string;
  courseName: string;
  semester: string;
  ects: number;
  roles: CourseRole[];
  toolboxes: string[];
  effectiveCategory?: "REQUIRED" | "ELECTIVE" | "NOT_ELIGIBLE";
  reasonCode?: string;
  requirementGroup?: string | null;
}

export interface CourseOptionsResponse {
  academicYear: string | null;
  semesterId: number;
  semester: string;
  availableMajors: string[];
  availableMinors: string[];
  common: CourseOption[];
  requiredMajor: CourseOption[];
  requiredMinor: CourseOption[];
  majorElectives: CourseOption[];
  toolboxElectives: CourseOption[];
  constraints: {
    selectionMode: "NONE" | "EXACTLY" | "AT_LEAST";
    minimumElectives: number;
    maximumElectives: number | null;
  };
}

export const getSchedule = async (params: ScheduleRequestDto): Promise<ScheduleResponseDto[]> => {
  try {
    return (await api.get<ScheduleResponseDto[]>("/schedule", { params })).data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("API Error fetching schedule:", axiosError.message);
    throw axiosError;
  }
};

export const getUserSchedule = async (params: ScheduleRequestDto): Promise<ScheduleResponseDto[]> => {
  try {
    return (await api.get<ScheduleResponseDto[]>("/user/courses/schedule", { params })).data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("API Error fetching user schedule:", axiosError.message);
    throw axiosError;
  }
};

export const getCourseOptions = async (
  params: ScheduleRequestDto & { major?: string; minor?: string }
): Promise<CourseOptionsResponse> => {
  return (await api.get<CourseOptionsResponse>("/course-options", { params })).data;
};

export interface ExamItem {
  course_id?: string;
  date: string;
  room: string;
  time_start: string;
  time_end: string;
  course_name: string;
  professors: string[];
}

export interface ExaminationSchedule {
  id: number;
  department: string;
  departmentId: number;
  semesterId: number;
  semester: string | number;
  exams: ExamItem[];
}

export const getExaminationSchedule = async (): Promise<ExaminationSchedule[]> => {
  try {
    return (await api.get<ExaminationSchedule[]>("/ExaminationSchedule")).data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("API Error fetching examination schedule:", axiosError.message);
    throw axiosError;
  }
};
