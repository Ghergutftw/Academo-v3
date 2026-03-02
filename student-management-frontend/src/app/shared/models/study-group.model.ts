export interface StudyGroup {
  id: number;
  name: string;
  course_id: number;
  course_name?: string;
  is_optional?: boolean;
  teacher_name?: string;
  student_count?: number;
}

export interface StudyGroupMember {
  id: number;
  study_group_id: number;
  student_id: number;
  student_name?: string;
  email?: string;
  group_id?: number;
  group_name?: string;
}
