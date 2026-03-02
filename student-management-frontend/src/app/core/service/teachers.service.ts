import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Teacher} from '../../shared/models/teacher.model';
import {environment} from '../../environments/environment';

@Injectable({providedIn: 'root'})
export class TeachersService {
  private api = `${environment.apiUrl}/teachers`;

  constructor(private http: HttpClient) {
  }

  getAll(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${this.api}/getAll.php`);
  }

  create(teacher: Omit<Teacher, 'id'>): Observable<Teacher> {
    return this.http.post<Teacher>(`${this.api}/create.php`, teacher);
  }

  update(teacher: Teacher): Observable<any> {
    return this.http.post<any>(`${this.api}/update.php`, teacher);
  }

  delete(id: number): Observable<any> {
    return this.http.post<any>(`${this.api}/delete.php`, {id});
  }

  importExcel(teachers: Omit<Teacher, 'id'>[], updateDuplicates: boolean = false): Observable<any> {
    return this.http.post<any>(`${this.api}/importExcel.php`, {teachers, updateDuplicates});
  }
}
