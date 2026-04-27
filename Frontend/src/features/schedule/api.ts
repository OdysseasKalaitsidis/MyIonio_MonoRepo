import { AxiosError } from "axios";
import { api } from "../../lib/axios";

// Models matching backend DTOs
export interface ScheduleRequestDto {
    department: string;
    semester: string;
}

export interface ScheduleResponseDto {
    id: string;
    day: string;
    room: string;
    building: string;
    time_start: string;
    time_end: string;
    professor: string;
    course_name: string;
    type: string;
}

// Helper to map response to our UI model if needed
export interface CourseEntry {
    name: string;
    day: string;
    time_start: string;
    time_end: string;
    room: string;
    type: string; // Updated to string to support "Υ-ΚΔΕ", etc.
}

export const getSchedule = async (params: ScheduleRequestDto): Promise<ScheduleResponseDto[]> => {
  try {
    const response = await api.get<ScheduleResponseDto[]>("/schedule", {
      params,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    // Log error but respect caller handling
    console.error("API Error fetching schedule:", axiosError.message);
    throw axiosError;
  }
};

export const getUserSchedule = async (params: ScheduleRequestDto): Promise<ScheduleResponseDto[]> => {
  try {
    const response = await api.get<ScheduleResponseDto[]>("/user/courses/schedule", {
      params,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    // Log error but respect caller handling
    console.error("API Error fetching user schedule:", axiosError.message);
    throw axiosError;
  }
};

// Examination Schedule Types (DTOs)
export interface ExamItem {
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
  semester: string | number;
  exams: ExamItem[];
}

export const getExaminationSchedule = async (): Promise<ExaminationSchedule[]> => {
  try {
    const response = await api.get<ExaminationSchedule[]>("/ExaminationSchedule");
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("API Error fetching examination schedule:", axiosError.message);
    throw axiosError;
  }
};
