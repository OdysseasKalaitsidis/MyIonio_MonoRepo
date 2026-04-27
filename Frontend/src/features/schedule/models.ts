export interface schedule {
  id: number;
  department: string;
  semester: string;
  courses: string;
}

export interface CourseEntry {
  day: string;
  room: string;
  building: string;
  time_start: string;
  time_end: string;
  professor: string;
  course_name: string;
  type: string;
}
