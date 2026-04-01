import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExamScheduleService {
  private apiUrl = `${environment.apiUrl}/exam-schedule/exam-schedule.php`;

  constructor(private http: HttpClient) { }

  /**
   * Upload an Excel file with exam schedule
   */
  uploadScheduleFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(this.apiUrl, formData);
  }

  /**
   * Download the exam schedule Excel file as blob
   */
  downloadScheduleFile(): Observable<Blob> {
    return this.http.get(this.apiUrl, { responseType: 'blob' });
  }

  /**
   * Check if exam schedule file exists in database
   * Calls API with ?info=1 to get schedule info without downloading
   */
  checkScheduleExists(): Observable<{ exists: boolean }> {
    return this.http.get<any>(`${this.apiUrl}?info=1`).pipe(
      map((response) => ({
        exists: response.exists === true
      })),
      catchError(() => {
        return of({ exists: false });
      })
    );
  }
}

