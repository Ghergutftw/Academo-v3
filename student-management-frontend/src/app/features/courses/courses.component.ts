import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {Course, CoursesService} from '../../core/service/courses.service';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CourseModalComponent} from './course-modal.component';
import {Teacher} from '../../shared/models/teacher.model';
import {TeachersService} from '../../core/service/teachers.service';
import {AlertService} from '../../shared/services/alert.service';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  teachers: Teacher[] = [];
  loading = true;

  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private coursesService: CoursesService,
    private teachersService: TeachersService,
    private router: Router,
    private modalService: NgbModal,
    private alertService: AlertService
  ) {
  }

  ngOnInit(): void {
    this.teachersService.getAll().subscribe({
      next: (teachers) => {
        this.teachers = teachers;
      },
      error: (error) => console.error('Error loading teachers:', error)
    });

    this.loadCourses();
  }

  loadCourses(): void {
    this.coursesService.getAll().subscribe({
      next: (data) => {
        this.courses = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.loading = false;
      }
    });
  }

  openAddModal() {
    const modalRef = this.modalService.open(CourseModalComponent, {size: 'lg'});
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.teachers = this.teachers;

    modalRef.result.then((result) => {
      if (result) {
        const newCourse: Course = {
          name: result.name,
          description: result.description,
          teacher_id: result.teacher_id
        };
        this.coursesService.create(newCourse).subscribe({
          next: (created) => {
            this.courses.push(created);
          },
          error: (error) => console.error('Error creating course:', error)
        });
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  editCourse(course: Course) {
    const modalRef = this.modalService.open(CourseModalComponent, {size: 'lg'});
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.course = course;
    modalRef.componentInstance.teachers = this.teachers;

    modalRef.result.then((result) => {
      if (result) {
        const updatedCourse: Course = {
          id: course.id,
          name: result.name,
          description: result.description,
          teacher_id: result.teacher_id
        };
        this.coursesService.update(updatedCourse).subscribe({
          next: () => {
            const idx = this.courses.findIndex(c => c.id === course.id);
            if (idx > -1) {
              this.courses[idx] = updatedCourse;
            }
          },
          error: (error) => console.error('Error updating course:', error)
        });
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  deleteCourse(id: number | undefined) {
    this.alertService.confirm(
      'Are you sure you want to delete this course?',
      () => {
        if (id != null) {
          this.coursesService.delete(id).subscribe({
            next: () => {
              this.courses = this.courses.filter(c => c.id !== id);
              this.alertService.success('Course deleted successfully!');
            },
            error: (error) => {
              console.error('Error deleting course:', error);
              this.alertService.error('Failed to delete course. Please try again.');
            }
          });
        }
      }
    );
  }

  editLaboratories(courseId: number | undefined) {
    if (courseId) {
      this.router.navigate(['/admin/courses', courseId, 'laboratories']);
    }
  }

  getTeacherName(teacherId: number | undefined): string {
    if (!teacherId) return 'No Teacher';
    const teacher = this.teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : `Teacher ${teacherId}`;
  }

  getPaginatedCourses(): Course[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.courses.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }
}
