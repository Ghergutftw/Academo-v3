import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {StudentGroup} from '../../../shared/models/student-groups.model';
import {Student} from '../../../shared/models/student.model';
import {StudentsService} from '../../../shared/services/students.service';
import {StudyCycle} from '../../../shared/models/study-cycle.enum';

@Component({
  selector: 'app-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-modal.component.html',
  styleUrls: ['./group-modal.component.css']
})
export class GroupModalComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() group?: StudentGroup;

  groupName: string = '';
  groupYear: number | null = null;
  academicYearStart: string = '';
  academicYearEnd: string = '';
  studyCycle: StudyCycle | '' = '';
  availableYears: number[] = [];

  allStudents: Student[] = [];
  filteredStudents: Student[] = [];
  displayedStudents: Student[] = [];
  selectedStudentIds: number[] = [];
  loading: boolean = false;
  studentSearchText: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private studentsService: StudentsService
  ) {
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.group) {
      this.groupName = this.group.name;
      this.groupYear = this.group.year || null;

      // Parse academic year from format "2025-2026"
      if (this.group.academic_year) {
        const years = this.group.academic_year.split('-');
        if (years.length === 2) {
          this.academicYearStart = years[0];
          this.academicYearEnd = years[1];
        }
      }

      // Determine study cycle based on year (1-4 = Licenta, else Master)
      if (this.groupYear) {
        this.studyCycle = this.groupYear <= 4 ? StudyCycle.LICENTA : StudyCycle.MASTER;
        // Set available years without resetting the current year
        if (this.studyCycle === StudyCycle.LICENTA) {
          this.availableYears = [1, 2, 3, 4];
        } else if (this.studyCycle === StudyCycle.MASTER) {
          this.availableYears = [1, 2];
        }
      }

      // Load existing students from the group
      this.loadStudents();
      this.loadGroupStudents();
    } else {
      this.loadStudents();
    }
  }

  onCycleChange() {
    this.groupYear = null;
    this.filteredStudents = [];
    this.selectedStudentIds = [];

    if (this.studyCycle === StudyCycle.LICENTA) {
      this.availableYears = [1, 2, 3, 4];
    } else if (this.studyCycle === StudyCycle.MASTER) {
      this.availableYears = [1, 2];
    } else {
      this.availableYears = [];
    }
  }

  onYearChange() {
    this.filterStudents();
  }

  onAcademicYearStartChange() {
    // Only auto-complete if we have exactly 4 digits
    if (this.academicYearStart && /^\d{4}$/.test(this.academicYearStart)) {
      const year = parseInt(this.academicYearStart);
      this.academicYearEnd = (year + 1).toString();
    } else {
      this.academicYearEnd = '';
    }
  }

  loadStudents() {
    this.loading = true;
    this.studentsService.getAll().subscribe({
      next: (response: Student[]) => {
        this.allStudents = response || [];
        this.filterStudents();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading students:', error);
        this.loading = false;
      }
    });
  }

  loadGroupStudents() {
    if (this.group && this.group.id) {
      this.studentsService.getByGroup(this.group.id).subscribe({
        next: (students: Student[]) => {
          this.selectedStudentIds = students.map(s => s.id);
        },
        error: (error: any) => {
          console.error('Error loading group students:', error);
        }
      });
    }
  }

  filterStudents() {
    if (this.groupYear !== null && this.studyCycle) {
      this.filteredStudents = this.allStudents.filter(
        s => s.study_year === this.groupYear && s.study_cycle === this.studyCycle
      );
    } else {
      this.filteredStudents = [];
    }
    this.filterDisplayedStudents();
  }

  filterDisplayedStudents() {
    if (!this.studentSearchText) {
      this.displayedStudents = this.filteredStudents;
    } else {
      const searchLower = this.studentSearchText.toLowerCase();
      this.displayedStudents = this.filteredStudents.filter(
        s => s.name?.toLowerCase().includes(searchLower) ||
          s.email?.toLowerCase().includes(searchLower)
      );
    }
  }

  toggleStudent(studentId: number) {
    const index = this.selectedStudentIds.indexOf(studentId);
    if (index === -1) {
      this.selectedStudentIds.push(studentId);
    } else {
      this.selectedStudentIds.splice(index, 1);
    }
  }

  isStudentSelected(studentId: number): boolean {
    return this.selectedStudentIds.includes(studentId);
  }

  save() {
    const academicYear = `${this.academicYearStart}-${this.academicYearEnd}`;
    this.activeModal.close({
      name: this.groupName,
      year: this.groupYear,
      academic_year: academicYear,
      student_ids: this.selectedStudentIds
    });
  }

  isAcademicYearValid(): boolean {
    if (!this.academicYearStart || !this.academicYearEnd) return false;
    if (!/^\d{4}$/.test(this.academicYearStart) || !/^\d{4}$/.test(this.academicYearEnd)) return false;
    const start = parseInt(this.academicYearStart);
    const end = parseInt(this.academicYearEnd);
    return end === start + 1;
  }
}

