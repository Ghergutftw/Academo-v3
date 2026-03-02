import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

export interface Session {
  id: number;
  course_id: number;
  laboratory_number: number;
  study_group_id: number;
  session_date: string;
  topic?: string;
  course_name?: string;
  study_group_name?: string;
}

export interface SessionCreateRequest {
  course_id: number;
  study_group_id: number;
  laboratory_number: number;
  session_date: string;
  topic?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = `${environment.apiUrl}/sessions`;

  constructor(private http: HttpClient) {
  }

  getByCourse(courseId: number): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.apiUrl}/getByCourse.php?course_id=${courseId}`);
  }

  create(session: SessionCreateRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiUrl}/create.php`, session);
  }

  update(session: Session): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/update.php`, session);
  }

  delete(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete.php`, {id});
  }
}
