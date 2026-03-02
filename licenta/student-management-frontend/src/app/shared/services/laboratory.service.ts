import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {Laboratory} from '../models/laboratory.model';

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

  create(laboratory: Partial<Laboratory>): Observable<Laboratory> {
    return this.http.post<Laboratory>(`${this.apiUrl}/create.php`, laboratory);
  }

  update(laboratory: Partial<Laboratory>): Observable<Laboratory> {
    return this.http.post<Laboratory>(`${this.apiUrl}/update.php`, laboratory);
  }

  delete(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete.php`, { id });
  }

  updateTopic(id: number, topic: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/updateTopic.php`, { id, topic });
  }

  uploadFile(labId: number, file: File) {
    const formData = new FormData();
    formData.append('lab_id', labId.toString());
    formData.append('lab_file', file);
    return this.http.post<any>(`${this.apiUrl}/uploadFile.php`, formData);
  }

  listFiles(labId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/listFiles.php?lab_id=${labId}`);
  }

  downloadFile(path: string) {
    return this.http.get(`${this.apiUrl}/downloadFile.php?filename=${encodeURIComponent(path)}`, { responseType: 'blob' });
  }

  deleteFile(file: any) {
    const filename = typeof file === 'string' ? file : file.path;
    return this.http.post<any>(`${this.apiUrl}/deleteFile.php`, { filename });
  }

  downloadAllFiles(labId: number) {
    return this.http.get(`${this.apiUrl}/downloadAllFiles.php?lab_id=${labId}`, { responseType: 'blob' });
  }
}
