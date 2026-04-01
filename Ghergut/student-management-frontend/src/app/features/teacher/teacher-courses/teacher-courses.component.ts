import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule, FormControl} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {environment} from '../../../environments/environment';
import {AuthService} from '../../../shared/services/auth.service';
import {CoursesService} from '../../../shared/services/courses.service';
import {TeachersService} from '../../../shared/services/teachers.service';
import {LaboratoryService} from '../../../shared/services/laboratory.service';
import {Course} from '../../../shared/models/course.model';
import {UserRole} from '../../../shared/models/user-role.enum';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import { EditLabModalComponent } from '../../courses/course-laboratories/modals/edit/edit-lab-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatPaginator],
  templateUrl: './teacher-courses.component.html',
  styleUrls: ['./teacher-courses.component.css']
})
export class TeacherCoursesComponent implements OnInit {
  currentUser: any;
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  loading: boolean = false;
  error: string = '';

  filterYear: string = '';
  filterSemester: string = '';
  searchTerm: string = '';
  uniqueYears: number[] = [];
  uniqueSemesters: number[] = [];

  yearControl = new FormControl('');
  semesterControl = new FormControl('');

  expandedCourses: Set<number> = new Set();
  courseLaboratories: Map<number, any[]> = new Map();
  loadingLabs: Set<number> = new Set();

  pageIndex: number = 0;
  pageSize: number = 10;
  totalItems: number = 0;

  private apiUrl = environment.apiUrl;

  constructor(
    public authService: AuthService,
    private coursesService: CoursesService,
    private teachersService: TeachersService,
    private laboratoryService: LaboratoryService,
    private modalService: NgbModal
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

    this.coursesService.getByTeacher(this.currentUser.user_type_id).subscribe({
      next: (courses) => {
        this.courses = courses;
        this.loadTeacherInfoForCourses();
        this.setupFilters();
        this.applyFilters();
        if (courses.length === 0) {
          this.error = 'Nu aveți încă materii asignate';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Nu s-au putut încărca materiile';
        console.error(error);
        this.loading = false;
      }
    });
  }

  loadTeacherInfoForCourses(): void {
    this.teachersService.getAll().subscribe({
      next: (teachers) => {
        this.courses.forEach(course => {
          const teacher = teachers.find(t => t.id === course.teacher_id);
          if (teacher) {
            course.teacher_name = teacher.name;
            course.teacher_email = teacher.email;
          }
        });
        this.loadLabInstructorsForCourses();
      },
      error: (error) => {
        console.error(error);
        this.loadLabInstructorsForCourses();
      }
    });
  }

  loadLabInstructorsForCourses(): void {
    const promises = this.courses.map(course =>
      this.coursesService.getLabInstructors(course.id).toPromise()
        .then((instructors: any[] | undefined) => {
          course.lab_instructors = instructors || [];
        })
        .catch((error: any) => {
          console.error(error);
          course.lab_instructors = [];
        })
    );

    Promise.all(promises).then(() => {
      this.courses = [...this.courses];
    });
  }

  setupFilters(): void {
    this.uniqueYears = [...new Set(this.courses.map(c => Number(c.year)).filter(y => !isNaN(y)))].sort((a, b) => a - b);
    this.uniqueSemesters = [...new Set(this.courses.map(c => Number(c.semester)).filter(s => !isNaN(s)))].sort((a, b) => a - b);
  }

  applyFilters(): void {
    this.filteredCourses = this.courses.filter(course => {
      const matchesYear = this.filterYear === '' || course.year.toString() === this.filterYear;
      const matchesSemester = this.filterSemester === '' || course.semester.toString() === this.filterSemester;

      const matchesSearch = !this.searchTerm ||
        course.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (course.teacher_name && course.teacher_name.toLowerCase().includes(this.searchTerm.toLowerCase()));

      return matchesYear && matchesSemester && matchesSearch;
    });

    this.totalItems = this.filteredCourses.length;
    this.pageIndex = 0;
  }

  clearFilters(): void {
    this.filterYear = '';
    this.filterSemester = '';
    this.searchTerm = '';
    this.yearControl.setValue('');
    this.semesterControl.setValue('');
    this.applyFilters();
  }

  onYearSelected(year: number): void {
    this.filterYear = year.toString();
    this.applyFilters();
  }

  clearYearFilter(): void {
    this.filterYear = '';
    this.yearControl.setValue('');
    this.applyFilters();
  }

  displayYear(year: number): string {
    return year ? `Anul ${year}` : '';
  }

  onSemesterSelected(semester: number): void {
    this.filterSemester = semester.toString();
    this.applyFilters();
  }

  clearSemesterFilter(): void {
    this.filterSemester = '';
    this.semesterControl.setValue('');
    this.applyFilters();
  }

  displaySemester(semester: number): string {
    return semester ? `Semestrul ${semester}` : '';
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  getPaginatedCourses(): Course[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredCourses.slice(startIndex, endIndex);
  }

  toggleCourseDetails(courseId: number): void {
    if (this.expandedCourses.has(courseId)) {
      this.expandedCourses.delete(courseId);
    } else {
      this.expandedCourses.add(courseId);
      if (!this.courseLaboratories.has(courseId)) {
        this.loadLaboratories(courseId);
      }
    }
  }

  isCourseExpanded(courseId: number): boolean {
    return this.expandedCourses.has(courseId);
  }

  loadLaboratories(courseId: number): void {
    this.loadingLabs.add(courseId);
    this.laboratoryService.getByCourse(courseId).subscribe({
      next: (laboratories) => {
        const labPromises = laboratories.map(lab =>
          this.laboratoryService.listFiles(lab.id).toPromise()
            .then(files => {
              lab.files = (files || []).map(f => typeof f === 'string' ? { name: f, path: f } : f);
              return lab;
            })
            .catch(() => {
              lab.files = [];
              return lab;
            })
        );
        Promise.all(labPromises).then(labsWithFiles => {
          this.courseLaboratories.set(courseId, labsWithFiles);
          this.loadingLabs.delete(courseId);
        });
      },
      error: () => {
        this.loadingLabs.delete(courseId);
        this.courseLaboratories.set(courseId, []);
      }
    });
  }

  downloadLabFile(file: any): void {
    this.laboratoryService.downloadFile(file.path).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  downloadAllLabFiles(lab: any, courseName?: string): void {
    const now = new Date();
    const hour = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    const sec = now.getSeconds().toString().padStart(2, '0');
    const time = `${hour}${min}${sec}`;
    const course = courseName || this.courses.find(c => c.id === lab.course_id)?.name || 'Materie';
    const courseSanitized = course.replace(/\s+/g, '_');
    const fileName = `Fisiere_${courseSanitized}_Lab_${lab.lab_number}_${time}.zip`;
    this.laboratoryService.downloadAllFiles(lab.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    }, () => {
      this.error = 'Eroare la descărcarea arhivei.';
    });
  }

  getLaboratories(courseId: number): any[] {
    return this.courseLaboratories.get(courseId) || [];
  }

  isLoadingLabs(courseId: number): boolean {
    return this.loadingLabs.has(courseId);
  }

  hasCourseFile(course: any): boolean {
    return course.has_files || false;
  }



  downloadCourseFile(courseId: number, courseName: string): void {
    const url = `${this.apiUrl}/courses/downloadFile.php`;
    const link = document.createElement('a');
    link.href = `${url}?course_id=${courseId}`;
    link.download = `${courseName}_fisa.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openManageLabFilesModal(lab: any): void {
    const modalRef = this.modalService.open(EditLabModalComponent, { size: 'md' });
    modalRef.componentInstance.lab = lab;
    modalRef.componentInstance.isTeacher = true;
    modalRef.result.finally(() => {
      this.loadLaboratories(lab.course_id);
    });
  }
}
