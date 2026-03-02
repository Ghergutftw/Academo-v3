import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {AuthService} from '../../core/service/auth.service';
import {Course} from '../../shared/models/course.model';
import {Group} from '../../shared/models/group.model';
import {Session} from '../../shared/models/session.model';
import {UserRole} from '../../shared/models/user-role.enum';

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-courses.component.html',
  styleUrls: ['./teacher-courses.component.css']
})
export class TeacherCoursesComponent implements OnInit {
  currentUser: any;
  courses: Course[] = [];
  groups: Group[] = [];
  sessions: Session[] = [];
  loading: boolean = false;
  error: string = '';

  private api = `${environment.apiUrl}`;

  constructor(
    public authService: AuthService,
    private http: HttpClient
  ) {
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser?.role === UserRole.TEACHER) {
      this.loadTeacherData();
    }
  }

  loadTeacherData(): void {
    this.loading = true;

    // Load courses for this teacher
    this.http.get<Course[]>(`${this.api}/courses/getByTeacher.php?teacher_id=${this.currentUser.user_type_id}`).subscribe({
      next: (courses) => {
        this.courses = courses;
        if (courses.length > 0) {
          this.loadGroupsAndSessions();
        } else {
          this.error = 'No courses assigned to you yet.';
          this.loading = false;
        }
      },
      error: (error) => {
        this.error = 'Failed to load courses';
        console.error(error);
        this.loading = false;
      }
    });
  }

  loadGroupsAndSessions(): void {
    // Load all groups
    this.http.get<Group[]>(`${this.api}/student_groups/getAll.php`).subscribe({
      next: (groups) => {
        this.groups = groups;
        this.loadSessionsForCourses();
      },
      error: (error) => {
        console.error('Failed to load groups:', error);
        this.loading = false;
      }
    });
  }

  loadSessionsForCourses(): void {
    const sessionPromises = this.courses.map(course =>
      this.http.get<Session[]>(`${this.api}/sessions/getByCourse.php?course_id=${course.id}`).toPromise()
        .then(sessions => {
          // Add course name to each session
          return (sessions || []).map(session => ({
            ...session,
            course_name: course.name
          }));
        })
    );

    Promise.all(sessionPromises).then(allSessions => {
      this.sessions = allSessions.flat();

      this.sessions.forEach(session => {
        const group = this.groups.find(g => g.id === session.group_id);
        if (group) {
          session.group_name = group.name;
        }
      });

      // Sort by date (most recent first)
      this.sessions.sort((a, b) =>
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
      );

      this.loading = false;
    }).catch(error => {
      console.error('Failed to load sessions:', error);
      this.loading = false;
    });
  }

  getSessionsByCourse(courseId: number): Session[] {
    return this.sessions.filter(s => s.course_id === courseId);
  }

  getPastSessions(): Session[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.sessions.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

