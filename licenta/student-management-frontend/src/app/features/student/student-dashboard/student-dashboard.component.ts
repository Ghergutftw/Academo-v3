import {Component, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatPaginator, MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {AuthService} from '../../../shared/services/auth.service';
import {AttendanceService} from '../../../shared/services/attendance.service';
import {environment} from '../../../environments/environment';
import {AttendanceRecord, AttendanceStats} from '../../../shared/models/attendance-stats.model';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  currentUser: any;
  attendanceStats: AttendanceStats[] = [];
  attendanceRecords: AttendanceRecord[] = [];
  filteredRecords: AttendanceRecord[] = [];
  paginatedRecords: AttendanceRecord[] = [];
  loading: boolean = false;
  error: string = '';

  // Filtre
  filterCourseId: number | null = null;
  filterDateFrom: string = '';
  filterDateTo: string = '';
  availableCourses: { id: number; name: string }[] = [];

  // Paginare
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  pageIndex: number = 0;

  private api = `${environment.apiUrl}`;

  constructor(
    public authService: AuthService,
    private attendanceService: AttendanceService
  ) {
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadAttendanceStats();
    this.loadAttendanceRecords();
  }

  loadAttendanceStats(): void {
    if (!this.currentUser) return;

    this.loading = true;
    this.attendanceService.getStatsByStudent(this.currentUser.user_type_id).subscribe({
      next: (stats) => {
        this.attendanceStats = stats;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load attendance statistics';
        this.loading = false;
        console.error(error);
      }
    });
  }

  loadAttendanceRecords(): void {
    if (!this.currentUser) return;

    this.attendanceService.getByStudent(this.currentUser.user_type_id).subscribe({
      next: (records) => {
        this.attendanceRecords = records;
        this.extractAvailableCourses();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Failed to load attendance records:', error);
      }
    });
  }

  extractAvailableCourses(): void {
    const coursesMap = new Map<number, string>();
    this.attendanceRecords.forEach(record => {
      if (!coursesMap.has(record.course_id)) {
        coursesMap.set(record.course_id, record.course_name);
      }
    });
    this.availableCourses = Array.from(coursesMap.entries()).map(([id, name]) => ({id, name}));
  }

  applyFilters(): void {
    let filtered = [...this.attendanceRecords];

    // Filtru după materie
    if (this.filterCourseId) {
      filtered = filtered.filter(record => record.course_id === this.filterCourseId);
    }

    // Filtru după dată de la
    if (this.filterDateFrom) {
      const fromDate = new Date(this.filterDateFrom);
      filtered = filtered.filter(record => new Date(record.session_date) >= fromDate);
    }

    // Filtru după dată până la
    if (this.filterDateTo) {
      const toDate = new Date(this.filterDateTo);
      filtered = filtered.filter(record => new Date(record.session_date) <= toDate);
    }

    this.filteredRecords = filtered;
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.updatePagination();
  }

  updatePagination(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedRecords = this.filteredRecords.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterCourseId = null;
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePagination();
  }

  getPercentageColor(percentage: number): string {
    if (percentage >= 80) {
      return 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
    } else if (percentage >= 60) {
      return 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)';
    } else {
      return 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
    }
  }


  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'present':
        return 'badge-success';
      case 'absent':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }
}

