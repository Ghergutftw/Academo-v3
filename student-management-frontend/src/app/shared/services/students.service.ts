import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {Student} from '../models/student.model';

@Injectable({providedIn: 'root'})
export class StudentsService {
  private api = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) {
  }

  getAll(year?: number): Observable<Student[]> {
    const url = year ? `${this.api}/getAll.php?year=${year}` : `${this.api}/getAll.php`;
    return this.http.get<Student[]>(url);
  }

  getByGroup(groupId: number): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.api}/getByGroup.php?group_id=${groupId}`);
  }

  getByStudyGroup(studyGroupId: number): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.api}/getByGroup.php?study_group_id=${studyGroupId}`);
  }

  delete(id: number): Observable<any> {
    return this.http.post<any>(`${this.api}/delete.php`, {id});
  }

  create(student: Student): Observable<Student> {
    return this.http.post<Student>(`${this.api}/create.php`, student);
  }

  update(student: Student): Observable<Student> {
    return this.http.post<Student>(`${this.api}/update.php`, student);
  }

  importExcel(students: Student[], updateDuplicates: boolean = false): Observable<any> {
    return this.http.post<any>(`${this.api}/importExcel.php`, {students, updateDuplicates});
  }

  getMyGroupmates(studentId: number): Observable<any> {
    return this.http.get<any>(`${this.api}/getMyGroupmates.php?student_id=${studentId}`);
  }

  getPreviousActivities(studentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/getPreviousActivities.php?student_id=${studentId}`);
  }

  getStudentGroups(studentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/getStudentGroups.php?student_id=${studentId}`);
  }
}
