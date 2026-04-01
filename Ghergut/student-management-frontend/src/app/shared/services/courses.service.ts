import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {Course} from '../models/course.model';

export interface CourseWithTeacher extends Course {
  teacher_name?: string;
}

@Injectable({providedIn: 'root'})
export class CoursesService {
  private api = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) {
  }

  getAll(year?: number, semester?: number): Observable<Course[]> {
    let url = `${this.api}/getAll.php`;
    const params = [];

    if (year) params.push(`year=${year}`);
    if (semester) params.push(`semester=${semester}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<Course[]>(url);
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


  updateLabInstructors(courseId: number, teacherIds: number[]): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/course_lab_instructors/update.php`, {
      course_id: courseId,
      teacher_ids: teacherIds
    });
  }

  getLabInstructors(courseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/course_lab_instructors/getByCourse.php?course_id=${courseId}`);
  }

  // File management methods
  uploadCourseFile(courseId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('course_id', courseId.toString());
    formData.append('course_file', file);

    return this.http.post<any>(`${this.api}/uploadFile.php`, formData);
  }

  downloadCourseFile(courseId: number): Observable<Blob> {
    return this.http.get(`${this.api}/downloadFile.php?course_id=${courseId}`, {
      responseType: 'blob'
    });
  }

  deleteCourseFile(courseId: number): Observable<any> {
    return this.http.request<any>('DELETE', `${this.api}/deleteFile.php`, {
      body: {course_id: courseId}
    });
  }
}

