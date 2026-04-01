import {StudyCycle} from './study-cycle.enum';

export interface Student {
  id: number;
  name?: string;
  email?: string;
  password?: string; // Optional, only for create/update
  group_id?: number;
  group_name?: string;
  start_year?: number;
  study_cycle?: StudyCycle;
  study_year?: number;
  financing_type?: 'Buget' | 'Taxa';
  student_status?: 'Activ' | 'Suspendat' | 'Exmatriculat';
  optional_courses?: number[]; // Array of course IDs
}
