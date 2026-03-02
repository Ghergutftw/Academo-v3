import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Teacher} from '../../../../shared/models/teacher.model';

@Component({
  selector: 'app-teacher-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-modal.component.html',
  styleUrls: ['./teacher-modal.component.css']
})
export class TeacherModalComponent {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() teacher?: Teacher;

  teacherName: string = '';
  teacherEmail: string = '';

  constructor(public activeModal: NgbActiveModal) {
  }

  save() {
    this.activeModal.close({
      name: this.teacherName,
      email: this.teacherEmail
    });
  }
}

