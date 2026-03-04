export interface TeacherActivity {
  id: number;
  course_name: string;
  course_id: number;
  group_name: string;
  group_id: number;
  lab_number: number;
  topic: string;
  session_date: string;
  semester: number;
  year: number;
}

export interface Activity {
  id: number;
  course_name: string;
  course_id: number;
  group_name: string;
  group_id: number;
  lab_number: number;
  topic: string;
  activity_date: string;
  attendance_status: 'present' | 'absent';
  semester: number;
  year: number;
}

