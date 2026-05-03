import { api } from "../../lib/axios";
import type { ScheduleResponseDto } from "../schedule/api";

export interface ProfessorSchedule {
    name: string;
    courses: ScheduleResponseDto[];
}

export const getProfessors = async (): Promise<string[]> => {
    const response = await api.get<string[]>("/professor");
    return response.data;
};

export const getAllProfessorsWithSchedules = async (): Promise<ProfessorSchedule[]> => {
    const response = await api.get<ProfessorSchedule[]>("/professor/all");
    return response.data;
};

export const getProfessorSchedule = async (name: string): Promise<ScheduleResponseDto[]> => {
    const response = await api.get<ScheduleResponseDto[]>(`/professor/${encodeURIComponent(name)}/schedule`);
    return response.data;
};
