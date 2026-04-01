import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Student} from '../../../../shared/models/student.model';
import {StudentGroup} from '../../../../shared/models/student-groups.model';
import {StudyCycle} from '../../../../shared/models/study-cycle.enum';

@Component({
  selector: 'app-student-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-modal.component.html',
  styleUrls: ['./student-modal.component.css']
})
export class StudentModalComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() student?: Student;
  @Input() groups: StudentGroup[] = [];

  studentName: string = '';
  studentEmail: string = '';
  studentGroupId: number | null = null;
  studentStartYear: number | null = null;
  studentStudyCycle: StudyCycle | '' = '';
  studentStudyYear: number | null = null;
  studentFinancingType: string = '';
  studentStatus: string = '';
  currentYear: number = new Date().getFullYear();

  filteredGroups: StudentGroup[] = [];
  availableStudyYears: number[] = [];

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    if (this.mode === 'edit' && this.student) {
      this.studentName = this.student.name ?? '';
      this.studentEmail = this.student.email ?? '';
      this.studentGroupId = this.student.group_id ?? null;
      this.studentStartYear = this.student.start_year ?? null;
      this.studentStudyCycle = this.student.study_cycle ?? '';
      this.studentStudyYear = this.student.study_year ?? null;
      this.studentFinancingType = this.student.financing_type ?? '';
      this.studentStatus = this.student.student_status ?? '';
      this.updateAvailableStudyYears();
      this.updateFilteredGroups();
    } else {
      this.studentStudyCycle = '';
      this.studentStudyYear = null;
    }
  }

  onStudyCycleChange(): void {
    this.studentStudyYear = null;
    this.studentGroupId = null;
    this.updateAvailableStudyYears();
    this.filteredGroups = [];
  }

  onStudyYearChange(): void {
    this.studentGroupId = null;
    this.updateFilteredGroups();
  }

  updateAvailableStudyYears(): void {
    if (this.studentStudyCycle === StudyCycle.LICENTA) {
      this.availableStudyYears = [1, 2, 3, 4];
    } else if (this.studentStudyCycle === StudyCycle.MASTER) {
      this.availableStudyYears = [1, 2];
    } else {
      this.availableStudyYears = [];
    }
  }

  updateFilteredGroups(): void {
    if (!this.studentStudyYear) {
      this.filteredGroups = [];
      return;
    }
    this.filteredGroups = this.groups
      .filter(g => Number(g.year) === Number(this.studentStudyYear))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  save() {
    this.activeModal.close({
      name: this.studentName,
      email: this.studentEmail,
      group_id: this.studentGroupId,
      start_year: this.studentStartYear,
      study_cycle: this.studentStudyCycle,
      study_year: this.studentStudyYear,
      financing_type: this.studentFinancingType,
      student_status: this.studentStatus
    });
  }
}
