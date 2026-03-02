import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AuthService} from '../../core/service/auth.service';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {AttendanceRecord, AttendanceStats} from '../../shared/models/attendance-stats.model';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  currentUser: any;
  attendanceStats: AttendanceStats[] = [];
  attendanceRecords: AttendanceRecord[] = [];
  loading: boolean = false;
  error: string = '';

  private api = `${environment.apiUrl}`;

  constructor(
    public authService: AuthService,
    private http: HttpClient
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
    this.http.get<AttendanceStats[]>(`${this.api}/attendance/getStatsByStudent.php?student_id=${this.currentUser.user_type_id}`).subscribe({
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

    this.http.get<AttendanceRecord[]>(`${this.api}/attendance/getByStudent.php?student_id=${this.currentUser.user_type_id}`).subscribe({
      next: (records) => {
        this.attendanceRecords = records;
      },
      error: (error) => {
        console.error('Failed to load attendance records:', error);
      }
    });
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
      case 'late':
        return 'badge-warning';
      case 'excused':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }
}

