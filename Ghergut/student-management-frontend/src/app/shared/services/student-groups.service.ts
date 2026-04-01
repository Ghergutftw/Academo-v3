import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {StudentGroup} from '../models/student-groups.model';
import {environment} from '../../environments/environment';

@Injectable({providedIn: 'root'})
export class StudentGroupsService {
  private api = `${environment.apiUrl}/student_groups`;

  constructor(private http: HttpClient) {
  }

  getAll(): Observable<StudentGroup[]> {
    return this.http.get<StudentGroup[]>(`${this.api}/getAll.php`);
  }

  create(group: Omit<StudentGroup, 'id'> & { student_ids?: number[] }): Observable<StudentGroup> {
    return this.http.post<StudentGroup>(`${this.api}/create.php`, group);
  }

  update(group: Partial<StudentGroup> & { id: number; student_ids?: number[] }): Observable<any> {
    return this.http.post<any>(`${this.api}/update.php`, group);
  }

  delete(id: number): Observable<any> {
    return this.http.post<any>(`${this.api}/delete.php`, {id});
  }
}
