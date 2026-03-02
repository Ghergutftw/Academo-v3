import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

export interface Course {
  id?: number;
  name: string;
  description?: string;
  teacher_id: number;
  teacher_name?: string;
  created_at?: string;
}

@Injectable({providedIn: 'root'})
export class CoursesService {
  private api = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) {
  }

  getAll(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.api}/getAll.php`);
  }

  getByTeacher(teacherId: number): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.api}/getByTeacher.php?teacher_id=${teacherId}`);
  }

  getByStudent(studentId: number): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.api}/getByStudent.php?student_id=${studentId}`);
  }

  create(course: Course): Observable<Course> {
    return this.http.post<Course>(`${this.api}/create.php`, course);
  }

  update(course: Course): Observable<any> {
    return this.http.post<any>(`${this.api}/update.php`, course);
  }

  delete(id: number): Observable<any> {
    return this.http.post<any>(`${this.api}/delete.php`, {id});
  }

  importExcel(courses: Course[], updateDuplicates: boolean = false): Observable<any> {
    return this.http.post<any>(`${this.api}/importExcel.php`, {courses, updateDuplicates});
  }
}

