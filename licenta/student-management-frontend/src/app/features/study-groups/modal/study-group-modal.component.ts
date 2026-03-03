import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StudyGroup } from '../../../shared/models/study-group.model';
import { Course } from '../../../shared/models/course.model';

@Component({
  selector: 'app-study-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './study-group-modal.component.html',
  styleUrls: ['./study-group-modal.component.css']
})
export class StudyGroupModalComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() group?: StudyGroup;
  @Input() courses: Course[] = [];
  @Input() studyGroups: StudyGroup[] = [];

  groupName: string = '';
  courseId: number = 0;
  labDay: string | null = null;
  labHour: string | null = null;

  allLabHours: string[] = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    if (this.mode === 'edit' && this.group) {
      this.groupName = this.group.name;
      this.courseId = this.group.course_id;
      this.labDay = (this.group as any).lab_day || null;
      this.labHour = (this.group as any).lab_hour || null;
    } else if (this.mode === 'add' && this.courseId) {
      // Dacă este add mode și courseId e deja setat, generează automat numele
      this.generateGroupName();
    }
  }

  isOptional(): boolean {
    const course = this.courses.find(c => c.id === this.courseId);
    return !!course?.is_optional;
  }

  generateGroupName(): void {
    if (this.courseId && this.labDay && this.labHour) {
      const course = this.courses.find(c => c.id === this.courseId);
      if (course) {
        const abbrev = course.acronym ;
        const startHour = this.labHour.substring(0, 2);
        const endHour = (parseInt(startHour) + 2).toString().padStart(2, '0');
        this.groupName = `${abbrev} ${this.labDay} ${startHour}-${endHour}`;
      }
    }
  }

  onCourseChange(): void {
    if (this.mode === 'add') {
      this.generateGroupName();
    }
  }

  onLabDayChange(): void {
    if (this.mode === 'add') {
      this.generateGroupName();
    }
  }

  onLabHourChange(): void {
    if (this.mode === 'add') {
      this.generateGroupName();
    }
  }

  getAvailableLabHours(): string[] {
    if (!this.courseId || !this.labDay) return this.allLabHours;
    // Filtrează orele deja folosite pentru această materie și zi
    const used = this.studyGroups
      .filter(g => g.course_id === this.courseId && (g as any).lab_day === this.labDay && (g as any).lab_hour)
      .map(g => (g as any).lab_hour);
    // Dacă e editare, ora curentă trebuie permisă
    if (this.mode === 'edit' && this.labHour && used.includes(this.labHour)) {
      return this.allLabHours.filter(h => !used.includes(h) || h === this.labHour);
    }
    return this.allLabHours.filter(h => !used.includes(h));
  }

  save() {
    this.activeModal.close({
      name: this.groupName,
      course_id: this.courseId,
      lab_day: this.labDay,
      lab_hour: this.labHour
    });
  }
}
