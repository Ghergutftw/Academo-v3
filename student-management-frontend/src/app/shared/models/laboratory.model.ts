export interface Laboratory {
  id: number;
  course_id: number;
  lab_number: number;
  topic: string;
  updated_at?: string;
  files?: string[];
  expanded?: boolean;
  uploadSuccess?: boolean;
}
