import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {CoursesService} from '../../shared/services/courses.service';
import {Course} from '../../shared/models/course.model';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CourseModalComponent} from './modal/course-modal.component';
import {Teacher} from '../../shared/models/teacher.model';
import {TeachersService} from '../../shared/services/teachers.service';
import {AlertService} from '../../shared/services/alert.service';
import {Observable, of} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {StudyCycle} from '../../shared/models/study-cycle.enum';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatPaginatorModule, MatAutocompleteModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatButtonModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  teachers: Teacher[] = [];
  loading = true;
  searchText: string = '';
  selectedStudyCycle: StudyCycle | null = null;
  selectedYear: number | null = null;
  selectedSemester: number | null = null;
  selectedTeacher: number | null = null;
  selectedAcronym: string = '';
  selectedCourseType: 'obligatoriu' | 'optional' | null = null;

  // Teacher autocomplete
  teacherControl = new FormControl<string | Teacher>('');
  filteredTeachers$: Observable<Teacher[]> = of([]);

  // Year, Semester and Study Cycle autocomplete
  studyCycleControl = new FormControl<StudyCycle | string>('');
  yearControl = new FormControl<string | number>('');
  semesterControl = new FormControl<string | number>('');

  availableYears = [1, 2, 3, 4, 5, 6];
  years = [1, 2, 3, 4, 5, 6];
  semesters = [1, 2];
  studyCycles = [StudyCycle.LICENTA, StudyCycle.MASTER];

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
    // Setup teacher autocomplete filtering
    this.filteredTeachers$ = this.teacherControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterTeachers(name as string) : this.teachers.slice();
      })
    );
  }

  ngOnInit(): void {
    this.teachersService.getAll().subscribe({
      next: (teachers) => {
        this.teachers = teachers;
        // Trigger the observable to update
        this.teacherControl.updateValueAndValidity();
      },
      error: (error) => console.error('Error loading teachers:', error)
    });

    this.loadCourses();
  }

  loadCourses(): void {
    this.coursesService.getAll(this.selectedYear || undefined, this.selectedSemester || undefined).subscribe({
      next: (data) => {
        this.courses = data;
        this.filteredCourses = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Afișăm în filtru anul "didactic" (1-4 licență, 1-2 master),
   * dar intern year-ul cursului este:
   *  - Licență: 1-4
   *  - Master: 5-6 (year = 4 + anul de master)
   */
  applySearch(): void {
    const searchLower = this.searchText.toLowerCase();

    this.filteredCourses = this.courses.filter(course => {
      // name filter
      const nameMatch = course.name && course.name.toLowerCase().includes(searchLower);

      // acronym filter
      const acronymMatch = !this.selectedAcronym || (course.acronym && course.acronym.toLowerCase().includes(this.selectedAcronym.toLowerCase()));

      // teacher filter
      const teacherMatch = this.selectedTeacher ? course.teacher_id === this.selectedTeacher : true;

      // study cycle filter
      let cycleMatch = true;
      if (this.selectedStudyCycle) {
        if (this.selectedStudyCycle === StudyCycle.LICENTA) {
          cycleMatch = !!course.year && course.year >= 1 && course.year <= 4;
        } else if (this.selectedStudyCycle === StudyCycle.MASTER) {
          cycleMatch = !!course.year && course.year >= 5 && course.year <= 6;
        }
      }

      // year filter — mapăm anul din filtru la year-ul intern al cursului
      let yearMatch = true;
      if (this.selectedYear) {
        if (this.selectedStudyCycle === StudyCycle.MASTER) {
          // Master An 1 -> year 5, Master An 2 -> year 6
          const internalYear = 4 + this.selectedYear; // 1->5, 2->6
          yearMatch = course.year === internalYear;
        } else {
          // Licență sau fără ciclu selectat: filtrăm direct după year
          yearMatch = course.year === this.selectedYear;
        }
      }

      // semester filter
      const semesterMatch = this.selectedSemester ? course.semester === this.selectedSemester : true;

      // course type filter (optional/obligatory)
      let courseTypeMatch = true;
      if (this.selectedCourseType) {
        const isOptional = course.is_optional ? 1 : 0;
        if (this.selectedCourseType === 'optional') {
          courseTypeMatch = isOptional === 1;
        } else if (this.selectedCourseType === 'obligatoriu') {
          courseTypeMatch = isOptional === 0;
        }
      }

      return (!this.searchText || nameMatch) && acronymMatch && teacherMatch && cycleMatch && yearMatch && semesterMatch && courseTypeMatch;
    });

    this.pageIndex = 0;
  }

  onFilterChange(): void {
    this.loadCourses();
    setTimeout(() => {
      this.applySearch(); // Apply teacher filter and search after data loads
    }, 100);
  }

  openAddModal() {
    const modalRef = this.modalService.open(CourseModalComponent, {size: 'lg'});
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.teachers = this.teachers;

    modalRef.result.then((result) => {
      if (result) {
        const newCourse: Partial<Course> & Omit<Course, 'id'> = {
          name: result.name,
          acronym: result.acronym,
          teacher_id: result.teacher_id,
          year: result.year,
          semester: result.semester,
          is_optional: result.is_optional
        };
        this.coursesService.create(newCourse as Course).subscribe({
          next: (created) => {
            this.courses.push(created);
            this.applySearch();
            // Save lab instructors
            if (result.lab_instructor_ids && result.lab_instructor_ids.length > 0) {
              this.coursesService.updateLabInstructors(created.id!, result.lab_instructor_ids).subscribe({
                error: (error) => console.error('Error saving lab instructors:', error)
              });
            }
            // Upload file if selected
            if (result.file && created.id) {
              this.coursesService.uploadCourseFile(created.id, result.file).subscribe({
                next: (response) => {
                  console.log('File uploaded successfully:', response);
                  created.course_file = response.filename;
                  const idx = this.courses.findIndex(c => c.id === created.id);
                  if (idx > -1) {
                    this.courses[idx] = created;
                  }
                },
                error: (error) => console.error('Error uploading file:', error)
              });
            }
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
          acronym: result.acronym,
          teacher_id: result.teacher_id,
          year: result.year,
          semester: result.semester,
          is_optional: result.is_optional
        };
        this.coursesService.update(updatedCourse).subscribe({
          next: () => {
            const idx = this.courses.findIndex(c => c.id === course.id);
            if (idx > -1) {
              this.courses[idx] = updatedCourse;
            }
            this.applySearch();
            // Update lab instructors
            this.coursesService.updateLabInstructors(course.id!, result.lab_instructor_ids || []).subscribe({
              error: (error) => console.error('Error updating lab instructors:', error)
            });
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
      'Sigur doriți să ștergeți această materie?',
      () => {
        if (id != null) {
          this.coursesService.delete(id).subscribe({
            next: () => {
              this.courses = this.courses.filter(c => c.id !== id);
              this.applySearch();
              this.alertService.success('Cursul a fost șters cu succes.');
            },
            error: (error) => {
              console.error('Error deleting course:', error);
              this.alertService.error('Ștergerea cursului a eșuat. Încercați din nou.');
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
    return this.filteredCourses.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  displayTeacherName(teacher: Teacher): string {
    return teacher && teacher.name ? teacher.name : '';
  }

  onTeacherSelected(teacher: Teacher | null): void {
    if (teacher && teacher.id) {
      this.selectedTeacher = teacher.id;
    } else {
      this.selectedTeacher = null;
    }
    this.applySearch();
  }

  clearTeacherFilter(): void {
    this.selectedTeacher = null;
    this.teacherControl.setValue('');
    this.applySearch();
  }

  clearSearchText(): void {
    this.searchText = '';
    this.applySearch();
  }

  clearAcronymFilter(): void {
    this.selectedAcronym = '';
    this.applySearch();
  }

  clearYearFilter(): void {
    this.selectedYear = null;
    this.yearControl.setValue('');
    this.applySearch();
  }

  clearSemesterFilter(): void {
    this.selectedSemester = null;
    this.semesterControl.setValue('');
    this.applySearch();
  }

  clearStudyCycleFilter(): void {
    this.selectedStudyCycle = null;
    this.studyCycleControl.setValue('');
    // Resetăm și anul când ștergem ciclul
    this.selectedYear = null;
    this.yearControl.setValue('');
    this.availableYears = [1, 2, 3, 4, 5, 6];
    this.applySearch();
  }

  displayYear(year: number): string {
    if (!year) return '';
    // Afișăm anul "didactic" (1-4 licență, 1-2 master)
    if (year <= 4) {
      return `Anul ${year}`;
    } else {
      return `Anul ${year - 4}`;
    }
  }

  displayStudyCycle(cycle: StudyCycle | string): string {
    return cycle ? String(cycle) : '';
  }

  onStudyCycleSelected(cycle: StudyCycle | null): void {
    this.selectedStudyCycle = cycle;
    // Resetăm anul când schimbăm ciclul
    this.selectedYear = null;
    this.yearControl.setValue('');
    this.onStudyCycleChange();
  }

  onStudyCycleChange(): void {
    // Actualizăm anii afișați în funcție de ciclu
    if (this.selectedStudyCycle === StudyCycle.LICENTA) {
      // Licență: ani 1-4
      this.availableYears = [1, 2, 3, 4];
    } else if (this.selectedStudyCycle === StudyCycle.MASTER) {
      // Master: ani de studiu 1-2 (dar intern 5-6)
      this.availableYears = [1, 2];
    } else {
      // Niciun ciclu selectat: afișăm toți anii posibili 1-4 licență + 1-2 master
      this.availableYears = [1, 2, 3, 4, 5, 6];
    }
    this.applySearch();
  }

  displaySemester(semester: number): string {
    return semester ? `Semester ${semester}` : '';
  }

  onYearSelected(year: number | null): void {
    this.selectedYear = year;
    this.applySearch();
  }

  onSemesterSelected(semester: number | null): void {
    this.selectedSemester = semester;
    this.applySearch();
  }

  private _filterTeachers(value: string): Teacher[] {
    const filterValue = value.toLowerCase();
    return this.teachers.filter(teacher =>
      teacher.name.toLowerCase().includes(filterValue)
    );
  }
}
