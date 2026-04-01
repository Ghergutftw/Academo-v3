import {Component, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {TeacherModalComponent} from './modal/teacher-modal.component';
import {Observable, of} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {Teacher} from '../../../shared/models/teacher.model';
import {Course} from '../../../shared/models/course.model';
import {TeachersService} from '../../../shared/services/teachers.service';
import {CoursesService} from '../../../shared/services/courses.service';
import {AlertService} from '../../../shared/services/alert.service';
import {CourseLabInstructorService} from '../../../shared/services/course-lab-instructor.service';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatPaginatorModule, MatAutocompleteModule, MatInputModule, MatFormFieldModule],
  templateUrl: './teachers.component.html',
  styleUrls: ['./teachers.component.css']
})
export class TeachersComponent {
  teachers = signal<Teacher[]>([]);
  filteredTeachers = signal<Teacher[]>([]);
  courses: Course[] = [];
  courseControl = new FormControl<string | Course>('');
  filteredCourses$: Observable<Course[]> = of([]);
  selectedCourseId: number | null = null;
  selectedCourseLabInstructorIds: number[] = [];

  searchText: string = '';
  sortColumn: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private teachersService: TeachersService,
    private coursesService: CoursesService,
    private modalService: NgbModal,
    private alertService: AlertService,
    private courseLabInstructorService: CourseLabInstructorService
  ) {
    this.loadTeachers();
    this.loadCourses();

    // Setup autocomplete filtering
    this.filteredCourses$ = this.courseControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterCourses(name as string) : this.courses.slice();
      })
    );
  }

  loadTeachers() {
    this.teachersService.getAll().subscribe({
      next: (data: Teacher[]) => {
        this.teachers.set(data);
        this.filteredTeachers.set(data);
        this.applyFilterAndSort();
      },
      error: (error: any) => console.error('Error loading teachers:', error)
    });
    this.applyFilterAndSort();
  }

  loadCourses() {
    this.coursesService.getAll().subscribe({
      next: (data: Course[]) => {
        this.courses = data;
        // Trigger the observable to update
        this.courseControl.updateValueAndValidity();
      },
      error: (error: any) => console.error('Error loading courses:', error)
    });
  }

  displayCourseName(course: Course): string {
    return course && course.name ? course.name : '';
  }

  onCourseSelected(course: Course | null): void {
    if (course && course.id) {
      this.selectedCourseId = course.id;
      // Load lab instructors for this course
      this.courseLabInstructorService.getByCourse(course.id)
        .subscribe({
          next: (instructors) => {
            this.selectedCourseLabInstructorIds = instructors.map(i => Number(i.teacher_id));
            this.applyFilterAndSort();
          },
          error: (error) => {
            console.error('Error loading lab instructors:', error);
            this.selectedCourseLabInstructorIds = [];
            this.applyFilterAndSort();
          }
        });
    }
  }

  clearCourseFilter(): void {
    this.courseControl.setValue('');
    this.selectedCourseId = null;
    this.selectedCourseLabInstructorIds = [];
    this.applyFilterAndSort();
  }

  applyFilterAndSort(): void {
    const searchLower = this.searchText.toLowerCase();
    let filtered = this.teachers().filter(teacher => {
      const name = teacher.name || '';
      const email = teacher.email || '';
      const id = teacher.id?.toString() || '';
      const matchesSearch = name.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower) ||
        id.includes(searchLower);

      // Filter by course if selected
      if (this.selectedCourseId) {
        const selectedCourse = this.courses.find(c => c.id === this.selectedCourseId);
        if (selectedCourse) {
          // Include both titular teacher and lab instructors
          const isTitular = teacher.id === selectedCourse.teacher_id;
          const isLabInstructor = this.selectedCourseLabInstructorIds.includes(teacher.id!);
          return matchesSearch && (isTitular || isLabInstructor);
        }
        return false;
      }

      return matchesSearch;
    });

    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (this.sortColumn) {
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          break;
        case 'email':
          aVal = (a.email || '').toLowerCase();
          bVal = (b.email || '').toLowerCase();
          break;
        case 'id':
          aVal = a.id;
          bVal = b.id;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredTeachers.set(filtered);
  }

  onSearchChange(): void {
    this.applyFilterAndSort();
  }

  clearSearchText(): void {
    this.searchText = '';
    this.applyFilterAndSort();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilterAndSort();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  deleteTeacher(id: number | undefined) {
    this.alertService.confirm(
      'Sigur doriți să ștergeți acest profesor?',
      () => {
        if (id != null) {
          this.teachersService.delete(id).subscribe({
            next: () => {
              this.teachers.update(teachers =>
                teachers.filter(t => t.id !== id)
              );
              this.applyFilterAndSort();
              this.alertService.success('Profesorul a fost șterse cu succes.');
            },
            error: (error: any) => {
              console.error('Error deleting teacher:', error);
              this.alertService.error('Eroare la ștergerea profesorului. Asigurați-vă că profesorul nu are cursuri sau laboratoare asociate.');
            }
          });
        }
      }
    );
  }

  openAddModal() {
    const modalRef = this.modalService.open(TeacherModalComponent, {size: 'lg'});
    modalRef.componentInstance.mode = 'add';

    modalRef.result.then((result) => {
      if (result) {
        const newTeacher: Teacher = {
          id: 0,
          name: result.name,
          email: result.email,
          is_admin: result.is_admin
        };
        this.teachersService.create(newTeacher).subscribe(newTeacherObj => {
          this.teachers.update(list => [...list, newTeacherObj]);
          this.applyFilterAndSort();
        });
      }
    });
  }

  editTeacher(teacher: Teacher) {
    const modalRef = this.modalService.open(TeacherModalComponent, {size: 'lg'});
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.teacher = teacher;

    modalRef.result.then((result) => {
      if (result) {
        const updatedTeacher: Teacher = {
          id: teacher.id,
          name: result.name,
          email: result.email,
          is_admin: result.is_admin
        };
        this.teachersService.update(updatedTeacher).subscribe(updatedTeacherObj => {
          this.teachers.update(list => list.map(t => t.id === updatedTeacherObj.id ? updatedTeacherObj : t));
          this.applyFilterAndSort();
        });
      }
    });
  }

  getPaginatedTeachers(): Teacher[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredTeachers().slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  private _filterCourses(value: string): Course[] {
    const filterValue = value.toLowerCase();
    return this.courses.filter(course =>
      course.name.toLowerCase().includes(filterValue)
    );
  }
}
