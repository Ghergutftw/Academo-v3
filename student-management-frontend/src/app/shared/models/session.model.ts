export interface Session {
  id: number;
  course_id: number;
  laboratory_number: number;
  group_id: number;
  session_date: string;
  topic?: string;
  created_at?: string;
  course_name?: string;
  group_name?: string;
}
