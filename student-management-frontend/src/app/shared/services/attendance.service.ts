import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

export interface AttendanceRecord {
  id?: number;
  student_id: number;
  session_id: number;
  status: string;
  recorded_at?: string;
  student_name?: string;
  student_email?: string;
}

export interface AttendanceSaveRequest {
  session_id: number;
  records: {
    student_id: number;
    status: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {
  }

  getByStudent(studentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getByStudent.php?student_id=${studentId}`);
  }

  getBySessions(sessionIds: number[]): Observable<AttendanceRecord[]> {
    const idsString = sessionIds.join(',');
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/getBySessions.php?session_ids=${idsString}`);
  }

  getStatsByStudent(studentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getStatsByStudent.php?student_id=${studentId}`);
  }

  save(data: AttendanceSaveRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save.php`, data);
  }

  update(id: number, status: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/update.php`, {id, status});
  }

  delete(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete.php`, {id});
  }

  exportToExcel(exportData: {
    course_id: number;
    course_name: string;
    group_id: number;
    group_name: string;
    is_mandatory_course: boolean;
    students: any[];
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/exportExcel.php`, exportData, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json'
      },
      observe: 'response'
    });
  }
}
