import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CoursesService} from '../../../shared/services/courses.service';
import {Course} from '../../../shared/models/course.model';
import {AuthService} from '../../../shared/services/auth.service';
import {environment} from '../../../environments/environment';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {LaboratoryService} from '../../../shared/services/laboratory.service';

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginator],
  templateUrl: './student-courses.component.html',
  styleUrl: './student-courses.component.css'
})
export class StudentCoursesComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  loading: boolean = false;
  error: string = '';
  currentUser: any;

  filterYear: string = '';
  filterSemester: string = '';
  searchTerm: string = '';
  uniqueYears: number[] = [];
  uniqueSemesters: number[] = [];

  expandedCourses: Set<number> = new Set();
  courseLaboratories: Map<number, any[]> = new Map();
  loadingLabs: Set<number> = new Set();

  pageIndex: number = 0;
  pageSize: number = 10;
  totalItems: number = 0;

  private apiUrl = environment.apiUrl;

  constructor(
    private coursesService: CoursesService,
    private authService: AuthService,
    private laboratoryService: LaboratoryService
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
        this.setupFilters();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Nu s-au putut încărca materiile';
        this.loading = false;
      }
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

      const searchLower = this.searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower ||
        course.name.toLowerCase().includes(searchLower) ||
        (course.teacher_name && course.teacher_name.toLowerCase().includes(searchLower));

      return matchesYear && matchesSemester && matchesSearch;
    });

    this.totalItems = this.filteredCourses.length;
    this.pageIndex = 0;
  }

  clearFilters(): void {
    this.filterYear = '';
    this.filterSemester = '';
    this.searchTerm = '';
    this.applyFilters();
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

  downloadCourseFile(courseId: number, courseName: string): void {
    const url = `${this.apiUrl}/courses/downloadFile.php?course_id=${courseId}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${courseName}_fisa.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  hasCourseFile(course: any): boolean {
    return !!course.course_file && course.course_file.trim() !== '';
  }

  getLaboratories(courseId: number): any[] {
    return this.courseLaboratories.get(courseId) || [];
  }

  isLoadingLabs(courseId: number): boolean {
    return this.loadingLabs.has(courseId);
  }
}

