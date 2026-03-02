import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {StudyGroup, StudyGroupMember} from '../models/study-group.model';

@Injectable({
  providedIn: 'root'
})
export class StudyGroupService {
  private apiUrl = `${environment.apiUrl}/study_groups`;

  constructor(private http: HttpClient) {
  }

  getAll(): Observable<{ success: boolean; data: StudyGroup[] }> {
    return this.http.get<{ success: boolean; data: StudyGroup[] }>(`${this.apiUrl}/getAll.php`);
  }

  getByCourse(courseId: number): Observable<StudyGroup[]> {
    return this.http.get<StudyGroup[]>(
      `${this.apiUrl}/getByCourse.php?course_id=${courseId}`
    );
  }

  getMembers(studyGroupId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/getMembers.php?study_group_id=${studyGroupId}`
    );
  }

  getStudents(studyGroupId: number): Observable<{ success: boolean; data: StudyGroupMember[] }> {
    return this.http.get<{ success: boolean; data: StudyGroupMember[] }>(
      `${this.apiUrl}/getStudents.php?id=${studyGroupId}`
    );
  }

  create(studyGroup: { name: string; course_id: number; student_ids?: number[] }): Observable<{
    success: boolean;
    message: string;
    id?: number
  }> {
    return this.http.post<{ success: boolean; message: string; id?: number }>(
      `${this.apiUrl}/create.php`,
      studyGroup
    );
  }

  update(studyGroup: { id: number; name: string; course_id: number }): Observable<{
    success: boolean;
    message: string
  }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/update.php`,
      studyGroup
    );
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/delete.php`,
      {id}
    );
  }

  updateMembers(studyGroupId: number, studentIds: number[]): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/updateMembers.php`,
      {study_group_id: studyGroupId, student_ids: studentIds}
    );
  }

  createFromGroup(courseId: number, groupId: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/createFromGroup.php`,
      {course_id: courseId, group_id: groupId}
    );
  }
}
