import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../../shared/services/auth.service';
import {StudentsService} from '../../../shared/services/students.service';
import {CoursesService} from '../../../shared/services/courses.service';
import {Activity} from '../../../shared/models/activity.model';

@Component({
  selector: 'app-previous-activities',
  imports: [CommonModule, FormsModule],
  templateUrl: './previous-activities.component.html',
  styleUrl: './previous-activities.component.css'
})
export class PreviousActivitiesComponent implements OnInit {
  activities: Activity[] = [];
  filteredActivities: Activity[] = [];
  loading: boolean = false;
  error: string = '';
  currentUser: any;
  // Filtre
  filterCourse: string = '';
  filterGroup: string = '';
  filterStartDate: string = '';
  filterEndDate: string = '';
  // Liste pentru dropdown-uri
  availableCourses: { id: number, name: string }[] = [];
  availableGroups: { id: number, name: string }[] = [];

  constructor(
    private authService: AuthService,
    private studentsService: StudentsService,
    private coursesService: CoursesService
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

    this.studentsService.getPreviousActivities(this.currentUser.user_type_id).subscribe({
      next: (activities) => {
        this.activities = activities;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Eroare la încărcarea activităților';
        this.loading = false;
        console.error('Error loading activities:', error);
      }
    });
  }

  loadFilterOptions(): void {
    if (!this.currentUser) return;

    // Încarcă cursurile pentru filtrare
    this.coursesService.getByStudent(this.currentUser.user_type_id).subscribe({
      next: (courses) => {
        this.availableCourses = courses.map(c => ({id: c.id, name: c.name}));
      },
      error: (error) => {
        console.error('Error loading courses for filter:', error);
      }
    });

    // Încarcă grupele pentru filtrare
    this.studentsService.getStudentGroups(this.currentUser.user_type_id).subscribe({
      next: (groups) => {
        this.availableGroups = groups.map(g => ({id: g.id, name: g.name}));
      },
      error: (error) => {
        console.error('Error loading groups for filter:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.activities];

    // Filtru după materie
    if (this.filterCourse) {
      filtered = filtered.filter(activity =>
        activity.course_id.toString() === this.filterCourse
      );
    }

    // Filtru după grupă
    if (this.filterGroup) {
      filtered = filtered.filter(activity =>
        activity.group_id.toString() === this.filterGroup
      );
    }

    // Filtru după perioada de început
    if (this.filterStartDate) {
      filtered = filtered.filter(activity =>
        activity.activity_date >= this.filterStartDate
      );
    }

    // Filtru după perioada de sfârșit
    if (this.filterEndDate) {
      filtered = filtered.filter(activity =>
        activity.activity_date <= this.filterEndDate
      );
    }

    this.filteredActivities = filtered.sort((a, b) =>
      new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
    );
  }

  clearFilters(): void {
    this.filterCourse = '';
    this.filterGroup = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.applyFilters();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'present':
        return 'text-success';
      case 'absent':
        return 'text-danger';
      default:
        return 'text-muted';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'present':
        return 'Prezent';
      case 'absent':
        return 'Absent';
      default:
        return 'Necunoscut';
    }
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
