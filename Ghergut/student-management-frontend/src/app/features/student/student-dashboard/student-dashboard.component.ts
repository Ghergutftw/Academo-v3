import {Component, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatPaginator, MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {AuthService} from '../../../shared/services/auth.service';
import {AttendanceService} from '../../../shared/services/attendance.service';
import {environment} from '../../../environments/environment';
import {AttendanceRecord, AttendanceStats} from '../../../shared/models/attendance-stats.model';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatPaginatorModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  currentUser: any;
  attendanceStats: AttendanceStats[] = [];
  attendanceRecords: AttendanceRecord[] = [];
  filteredRecords: AttendanceRecord[] = [];
  paginatedRecords: AttendanceRecord[] = [];
  loading = false;
  error = '';

  filterCourseId: number | null = null;
  filterDateFrom: Date | null = null;
  filterDateTo: Date | null = null;
  availableCourses: { id: number; name: string }[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  pageIndex = 0;

  private api = `${environment.apiUrl}`;

  constructor(
    public authService: AuthService,
    private attendanceService: AttendanceService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadAttendanceStats();
    this.loadAttendanceRecords();
  }

  loadAttendanceStats(): void {
    if (!this.currentUser) return;
    this.loading = true;
    this.attendanceService.getStatsByStudent(this.currentUser.user_type_id).subscribe({
      next: (stats) => { this.attendanceStats = stats; this.loading = false; },
      error: (error) => { this.error = 'Failed to load attendance statistics'; this.loading = false; console.error(error); }
    });
  }

  loadAttendanceRecords(): void {
    if (!this.currentUser) return;
    this.attendanceService.getByStudent(this.currentUser.user_type_id).subscribe({
      next: (records) => {
        // Filter out records without session_date (incomplete records)
        this.attendanceRecords = records.filter(r => r.session_date && r.session_date.trim() !== '');
        this.extractAvailableCourses();
        this.applyFilters();
      },
      error: (error) => { console.error('Failed to load attendance records:', error); }
    });
  }

  extractAvailableCourses(): void {
    const coursesMap = new Map<number, string>();
    this.attendanceRecords.forEach(record => {
      if (!coursesMap.has(record.course_id)) coursesMap.set(record.course_id, record.course_name);
    });
    this.availableCourses = Array.from(coursesMap.entries()).map(([id, name]) => ({id, name}));
  }

  applyFilters(): void {
    let filtered = [...this.attendanceRecords];

    if (this.filterCourseId) {
      filtered = filtered.filter(r => r.course_id === this.filterCourseId);
    }

    if (this.filterDateFrom) {
      const from = new Date(this.filterDateFrom);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter(r => new Date(r.session_date) >= from);
    }

    if (this.filterDateTo) {
      const to = new Date(this.filterDateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.session_date) <= to);
    }

    filtered.sort((a, b) => {
      if (a.status !== b.status) return a.status.localeCompare(b.status);
      return new Date(b.session_date).getTime() - new Date(a.session_date).getTime();
    });

    this.filteredRecords = filtered;
    this.pageIndex = 0;
    if (this.paginator) this.paginator.firstPage();
    this.updatePagination();
  }

  updatePagination(): void {
    const start = this.pageIndex * this.pageSize;
    this.paginatedRecords = this.filteredRecords.slice(start, start + this.pageSize);
  }

  onFilterChange(): void { this.applyFilters(); }

  clearFilters(): void {
    this.filterCourseId = null;
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePagination();
  }

  getPercentageColor(percentage: number): string {
    if (percentage >= 80) return 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
    if (percentage >= 60) return 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)';
    return 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'present': return 'badge-success';
      case 'absent': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }
}
