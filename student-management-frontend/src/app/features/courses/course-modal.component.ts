import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Course} from '../../core/service/courses.service';
import {Teacher} from '../../shared/models/teacher.model';

@Component({
  selector: 'app-course-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ mode === 'add' ? 'Add Course' : 'Edit Course' }}</h5>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <div class="mb-3">
        <label for="courseName" class="form-label">Name *</label>
        <input
          id="courseName"
          type="text"
          class="form-control"
          [(ngModel)]="courseName"
          required
        />
      </div>
      <div class="mb-3">
        <label for="courseDescription" class="form-label">Description</label>
        <textarea
          id="courseDescription"
          class="form-control"
          [(ngModel)]="courseDescription"
          rows="3"
        ></textarea>
      </div>
      <div class="mb-3">
        <label for="courseTeacher" class="form-label">Teacher *</label>
        <select
          id="courseTeacher"
          class="form-control"
          [(ngModel)]="courseTeacherId"
          required
        >
          <option [value]="null" disabled>Select a teacher</option>
          @for (teacher of teachers; track teacher.id) {
            <option [value]="teacher.id">{{ teacher.name }}</option>
          }
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="activeModal.dismiss()">Cancel</button>
      <button type="button" class="btn btn-primary" (click)="save()" [disabled]="!courseName || !courseTeacherId">
        {{ mode === 'add' ? 'Add' : 'Save' }}
      </button>
    </div>
  `
})
export class CourseModalComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() course?: Course;
  @Input() teachers: Teacher[] = [];

  courseName: string = '';
  courseDescription: string = '';
  courseTeacherId: number | null = null;

  constructor(public activeModal: NgbActiveModal) {
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.course) {
      this.courseName = this.course.name ?? '';
      this.courseDescription = this.course.description ?? '';
      this.courseTeacherId = this.course.teacher_id ?? null;
    }
  }

  save() {
    this.activeModal.close({
      name: this.courseName,
      description: this.courseDescription,
      teacher_id: this.courseTeacherId
    });
  }
}

