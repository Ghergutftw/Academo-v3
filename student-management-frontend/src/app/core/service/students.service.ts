import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {Student} from '../../shared/models/student.model';

@Injectable({providedIn: 'root'})
export class StudentsService {
  private api = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) {
  }

  getAll(): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.api}/getAll.php`);
  }

  getByGroup(groupId: number): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.api}/getByGroup.php?group_id=${groupId}`);
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
}
