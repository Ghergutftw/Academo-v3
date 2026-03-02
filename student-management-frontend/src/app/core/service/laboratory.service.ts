import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {Laboratory} from '../../shared/models/laboratory.model';

@Injectable({
  providedIn: 'root'
})
export class LaboratoryService {
  private apiUrl = `${environment.apiUrl}/laboratories`;

  constructor(private http: HttpClient) {
  }

  getByCourse(courseId: number): Observable<Laboratory[]> {
    return this.http.get<Laboratory[]>(`${this.apiUrl}/getByCourse.php?course_id=${courseId}`);
  }

  updateTopic(id: number, topic: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/updateTopic.php`, {id, topic});
  }
}

