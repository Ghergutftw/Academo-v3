import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Course, CoursesService} from '../../core/service/courses.service';
import {AuthService} from '../../core/service/auth.service';

@Component({
  selector: 'app-student-courses',
  imports: [CommonModule],
  templateUrl: './student-courses.component.html',
  styleUrl: './student-courses.component.css'
})
export class StudentCoursesComponent implements OnInit {
  courses: Course[] = [];
  loading: boolean = false;
  error: string = '';
  currentUser: any;

  constructor(
    private coursesService: CoursesService,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadCourses();
  }

  loadCourses(): void {
    if (!this.currentUser) return;

    this.loading = true;
    this.error = '';

    this.coursesService.getByStudent(this.currentUser.user_type_id).subscribe({
      next: (courses) => {
        this.courses = courses;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load courses';
        this.loading = false;
        console.error('Error loading courses:', error);
      }
    });
  }
}
