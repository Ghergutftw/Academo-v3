import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Student} from '../../shared/models/student.model';
import {Group} from '../../shared/models/group.model';

@Component({
  selector: 'app-student-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ mode === 'add' ? 'Add Student' : 'Edit Student' }}</h5>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <div class="mb-3">
        <label for="studentName" class="form-label">Name *</label>
        <input
          id="studentName"
          type="text"
          class="form-control"
          [(ngModel)]="studentName"
          required
        />
      </div>
      <div class="mb-3">
        <label for="studentEmail" class="form-label">Email *</label>
        <input
          id="studentEmail"
          type="email"
          class="form-control"
          [(ngModel)]="studentEmail"
          required
        />
      </div>
      <div class="mb-3">
        <label for="studentGroup" class="form-label">Group *</label>
        <select
          id="studentGroup"
          class="form-control"
          [(ngModel)]="studentGroupId"
          required
        >
          <option [value]="null" disabled>Select a group</option>
          @for (group of groups; track group.id) {
            <option [value]="group.id">{{ group.name }} (Year {{ group.year }})</option>
          }
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="activeModal.dismiss()">Cancel</button>
      <button type="button" class="btn btn-primary" (click)="save()" [disabled]="!studentName || !studentEmail || !studentGroupId">
        {{ mode === 'add' ? 'Add' : 'Save' }}
      </button>
    </div>
  `
})
export class StudentModalComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() student?: Student;
  @Input() groups: Group[] = [];

  studentName: string = '';
  studentEmail: string = '';
  studentGroupId: number | null = null;

  constructor(public activeModal: NgbActiveModal) {
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.student) {
      this.studentName = this.student.name ?? '';
      this.studentEmail = this.student.email ?? '';
      this.studentGroupId = this.student.group_name ?? null;
    }
  }

  save() {
    this.activeModal.close({
      name: this.studentName,
      email: this.studentEmail,
      group_id: this.studentGroupId
    });
  }
}

