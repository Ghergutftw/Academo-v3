import {Component, Input, OnInit} from '@angular/core';
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
export class TeacherModalComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() teacher?: Teacher;

  teacherName: string = '';
  teacherEmail: string = '';
  teacherIsAdmin: boolean = false;

  constructor(public activeModal: NgbActiveModal) {
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.teacher) {
      this.teacherName = this.teacher.name;
      this.teacherEmail = this.teacher.email;
      this.teacherIsAdmin = !!this.teacher.is_admin;
    }
  }

  save() {
    this.activeModal.close({
      name: this.teacherName,
      email: this.teacherEmail,
      is_admin: this.teacherIsAdmin
    });
  }
}
