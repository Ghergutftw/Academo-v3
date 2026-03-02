import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Teacher} from '../../shared/models/teacher.model';
import {Course} from '../../shared/models/course.model';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';

@Component({
  selector: 'app-course-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule],
  templateUrl: './course-assignments.component.html',
  styleUrls: ['./course-assignments.component.css']
})
export class CourseAssignmentsComponent implements OnInit {
  teachers: Teacher[] = [];
  courses: Course[] = [];
  teacherCourses: { [teacherId: number]: Course[] } = {};
  loading = true;
  expandedTeachers: Set<number> = new Set();

  pageIndex = 0;
  pageSize = 5;
  pageSizeOptions = [5, 10, 25, 50];
  totalTeachers = 0;

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.loadTeachers();
    this.loadCourses();
  }

  loadTeachers(): void {
    this.http.get<Teacher[]>(`${environment.apiUrl}/teachers/getAll.php`).subscribe({
      next: (teachers) => {
        this.teachers = teachers;
        this.totalTeachers = teachers.length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.loading = false;
      }
    });
  }

  loadCourses(): void {
    this.http.get<Course[]>(`${environment.apiUrl}/courses/getAll.php`).subscribe({
      next: (courses) => {
        this.courses = courses;
        this.groupCoursesByTeacher();
      },
      error: (error) => console.error('Error loading courses:', error)
    });
  }

  groupCoursesByTeacher(): void {
    this.teacherCourses = {};
    this.courses.forEach(course => {
      if (!this.teacherCourses[course.teacher_id]) {
        this.teacherCourses[course.teacher_id] = [];
      }
      this.teacherCourses[course.teacher_id].push(course);
    });
  }

  getTeacherCourses(teacherId: number): Course[] {
    return this.teacherCourses[teacherId] || [];
  }

  assignCourse(courseId: number, teacherId: number): void {
    const course = this.courses.find(c => c.id === courseId);
    if (!course) return;

    this.http.post(`${environment.apiUrl}/courses/update.php`, {
      id: courseId,
      name: course.name,
      description: course.description,
      teacher_id: teacherId
    }).subscribe({
      next: () => {
        course.teacher_id = teacherId;
        this.groupCoursesByTeacher();
      },
      error: (error) => console.error('Error assigning course:', error)
    });
  }

  unassignCourse(courseId: number): void {
    const course = this.courses.find(c => c.id === courseId);
    if (!course) return;

    this.http.post(`${environment.apiUrl}/courses/update.php`, {
      id: courseId,
      name: course.name,
      description: course.description,
      teacher_id: 0
    }).subscribe({
      next: () => {
        course.teacher_id = 0;
        this.groupCoursesByTeacher();
      },
      error: (error) => console.error('Error unassigning course:', error)
    });
  }

  getAvailableCourses(teacherId: number): Course[] {
    return this.courses.filter(c => c.teacher_id !== teacherId);
  }

  toggleTeacher(teacherId: number): void {
    if (this.expandedTeachers.has(teacherId)) {
      this.expandedTeachers.delete(teacherId);
    } else {
      this.expandedTeachers.add(teacherId);
    }
  }

  isTeacherExpanded(teacherId: number): boolean {
    return this.expandedTeachers.has(teacherId);
  }

  getPaginatedTeachers(): Teacher[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.teachers.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }
}

