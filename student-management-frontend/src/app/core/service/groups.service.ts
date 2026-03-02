import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Group} from '../../shared/models/group.model';
import {environment} from '../../environments/environment';

@Injectable({providedIn: 'root'})
export class GroupsService {
  private api = `${environment.apiUrl}/student_groups`;

  constructor(private http: HttpClient) {
  }

  getAll(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.api}/getAll.php`);
  }

  create(group: Omit<Group, 'id'>): Observable<Group> {
    return this.http.post<Group>(`${this.api}/create.php`, group);
  }

  update(group: Group): Observable<any> {
    return this.http.post<any>(`${this.api}/update.php`, group);
  }

  delete(id: number): Observable<any> {
    return this.http.post<any>(`${this.api}/delete.php`, {id});
  }
}
