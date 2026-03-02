import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Teacher} from '../../shared/models/teacher.model';

@Component({
  selector: 'app-teacher-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ mode === 'add' ? 'Add Teacher' : 'Edit Teacher' }}</h5>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <div class="mb-3">
        <label for="teacherName" class="form-label">Name</label>
        <input
          id="teacherName"
          type="text"
          class="form-control"
          [(ngModel)]="teacherName"
          required
        />
      </div>
      <div class="mb-3">
        <label for="teacherEmail" class="form-label">Email</label>
        <input
          id="teacherEmail"
          type="email"
          class="form-control"
          [(ngModel)]="teacherEmail"
          required
        />
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="activeModal.dismiss()">Cancel</button>
      <button type="button" class="btn btn-primary" (click)="save()">
        {{ mode === 'add' ? 'Add' : 'Save' }}
      </button>
    </div>
  `
})
export class TeacherModalComponent {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() teacher?: Teacher;

  teacherName: string = '';
  teacherEmail: string = '';

  constructor(public activeModal: NgbActiveModal) {
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.teacher) {
      this.teacherName = this.teacher.name ?? '';
      this.teacherEmail = this.teacher.email ?? '';
    }
  }

  save() {
    this.activeModal.close({
      name: this.teacherName,
      email: this.teacherEmail
    });
  }
}

