import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

export interface CourseLabInstructor {
  id: number;
  course_id: number;
  teacher_id: number;
  teacher_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseLabInstructorService {
  private apiUrl = `${environment.apiUrl}/course_lab_instructors`;

  constructor(private http: HttpClient) {
  }

  getByCourse(courseId: number): Observable<CourseLabInstructor[]> {
    return this.http.get<CourseLabInstructor[]>(`${this.apiUrl}/getByCourse.php?course_id=${courseId}`);
  }

  update(courseId: number, teacherIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/update.php`, {course_id: courseId, teacher_ids: teacherIds});
  }
}
