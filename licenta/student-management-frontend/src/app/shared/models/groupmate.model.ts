export interface Groupmate {
  id: number;
  name: string;
  email: string;
  group_id: number;
  group_name: string;
}

export interface GroupmatesResponse {
  group_id: number;
  group_name: string;
  students: Groupmate[];
}

