export interface LabInstructor {
  id: number;
  course_id: number;
  teacher_id: number;
  teacher_name: string;
  teacher_email: string;
}

export interface Course {
  id: number;
  name: string;
  teacher_id: number;
  year: number;
  semester: number;
  is_optional?: boolean;
  course_file?: string;
  teacher_name?: string;
  teacher_email?: string;
  lab_instructors?: LabInstructor[];
}

