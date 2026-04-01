export interface AttendanceStats {
  course_id: number;
  course_name: string;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
}

export interface AttendanceRecord {
  id: number;
  status: string;
  recorded_at: string;
  session_id: number;
  session_date: string;
  topic: string;
  course_id: number;
  course_name: string;
  teacher_name: string;
}

