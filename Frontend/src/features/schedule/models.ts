import type { CourseRole } from "./api";

export interface schedule {
  id: number;
  department: string;
  semester: string;
  semesterId?: number;
  courses: string;
}

export interface CourseEntry {
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
