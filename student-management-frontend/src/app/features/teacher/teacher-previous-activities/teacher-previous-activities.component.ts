import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatNativeDateModule, MatOptionModule} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {AuthService} from '../../../shared/services/auth.service';
import {environment} from '../../../environments/environment';

interface TeacherActivity {
  id: number;
  course_name: string;
  course_id: number;
  group_name: string;
  group_id: number;
  lab_number: number;
  topic: string;
  session_date: string;
  semester: number;
  year: number;
}

@Component({
  selector: 'app-teacher-previous-activities',
  imports: [CommonModule, FormsModule, MatPaginatorModule, MatSelectModule, MatFormFieldModule, MatOptionModule, MatDatepickerModule, MatInputModule, MatNativeDateModule],
  templateUrl: './teacher-previous-activities.component.html',
  styleUrl: './teacher-previous-activities.component.css'
})
export class TeacherPreviousActivitiesComponent implements OnInit {
  activities: TeacherActivity[] = [];
  filteredActivities: TeacherActivity[] = [];
  loading: boolean = false;
  error: string = '';
  currentUser: any;

  filterCourse: any = '';
  filterGroup: any = '';
  filterYear: any = '';
  filterSemester: any = '';
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;

  pageIndex: number = 0;
  pageSize: number = 10;
  totalItems: number = 0;

  availableCourses: { id: number, name: string }[] = [];
  availableGroups: { id: number, name: string }[] = [];
  availableYears: number[] = [];
  availableSemesters: number[] = [];

  private apiUrl = environment.apiUrl;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadActivities();
    this.loadFilterOptions();
  }

  loadActivities(): void {
    if (!this.currentUser) return;

    this.loading = true;
    this.error = '';

    const url = `${this.apiUrl}/teachers/getPreviousActivities.php?teacher_id=${this.currentUser.user_type_id}`;

    this.http.get<TeacherActivity[]>(url).subscribe({
      next: (activities) => {
        this.activities = activities;
        this.extractYearsAndSemesters();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Eroare la încărcarea activităților';
        this.loading = false;
      }
    });
  }

  loadFilterOptions(): void {
    if (!this.currentUser) return;

    this.http.get<any[]>(`${this.apiUrl}/courses/getByTeacher.php?teacher_id=${this.currentUser.user_type_id}`).subscribe({
      next: (courses) => {
        this.availableCourses = courses.map(c => ({id: c.id, name: c.name}));
      }
    });

    this.http.get<any[]>(`${this.apiUrl}/teachers/getTeacherGroups.php?teacher_id=${this.currentUser.user_type_id}`).subscribe({
      next: (groups) => {
        this.availableGroups = groups.map(g => ({id: g.id, name: g.name}));
      }
    });
  }

  extractYearsAndSemesters(): void {
    const years = new Set(this.activities.map(a => a.year));
    this.availableYears = Array.from(years).sort((a, b) => a - b);

    const semesters = new Set(this.activities.map(a => a.semester));
    this.availableSemesters = Array.from(semesters).sort((a, b) => a - b);
  }

  applyFilters(): void {
    let filtered = [...this.activities];

    if (this.filterCourse !== '' && this.filterCourse !== null) {
      filtered = filtered.filter(activity =>
        activity.course_id.toString() === this.filterCourse.toString()
      );
    }

    if (this.filterGroup !== '' && this.filterGroup !== null) {
      filtered = filtered.filter(activity =>
        activity.group_id.toString() === this.filterGroup.toString()
      );
    }

    if (this.filterYear !== '' && this.filterYear !== null) {
      filtered = filtered.filter(activity =>
        activity.year.toString() === this.filterYear.toString()
      );
    }

    if (this.filterSemester !== '' && this.filterSemester !== null) {
      filtered = filtered.filter(activity =>
        activity.semester.toString() === this.filterSemester.toString()
      );
    }

    if (this.filterStartDate) {
      const startDate = new Date(this.filterStartDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.session_date);
        return activityDate.getTime() >= startDate.getTime();
      });
    }

    if (this.filterEndDate) {
      const endDate = new Date(this.filterEndDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.session_date);
        return activityDate.getTime() <= endDate.getTime();
      });
    }

    this.filteredActivities = filtered.sort((a, b) =>
      new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    );

    this.totalItems = this.filteredActivities.length;
    this.pageIndex = 0;
  }

  clearFilters(): void {
    this.filterCourse = '';
    this.filterGroup = '';
    this.filterYear = '';
    this.filterSemester = '';
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  getPaginatedActivities(): TeacherActivity[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredActivities.slice(startIndex, endIndex);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateStr}, ${timeStr}`;
  }
}
