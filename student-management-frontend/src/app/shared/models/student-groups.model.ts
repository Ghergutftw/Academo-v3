import {StudyCycle} from './study-cycle.enum';

export interface StudentGroup {
  id: number;
  name: string;
  year?: number;
  academic_year?: string;
  study_cycle?: StudyCycle;
}
