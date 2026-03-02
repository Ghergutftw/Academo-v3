import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Group} from '../../shared/models/group.model';

@Component({
  selector: 'app-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ mode === 'add' ? 'Add Group' : 'Edit Group' }}</h5>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <div class="mb-3">
        <label for="groupName" class="form-label">Name *</label>
        <input
          id="groupName"
          type="text"
          class="form-control"
          [(ngModel)]="groupName"
          required
        />
      </div>
      <div class="mb-3">
        <label for="groupYear" class="form-label">Year *</label>
        <input
          id="groupYear"
          type="number"
          class="form-control"
          [(ngModel)]="groupYear"
          min="1"
          max="6"
          required
        />
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="activeModal.dismiss()">Cancel</button>
      <button type="button" class="btn btn-primary" (click)="save()" [disabled]="!groupName || !groupYear">
        {{ mode === 'add' ? 'Add' : 'Save' }}
      </button>
    </div>
  `
})
export class GroupModalComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() group?: Group;

  groupName: string = '';
  groupYear: number | null = null;

  constructor(public activeModal: NgbActiveModal) {
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.group) {
      this.groupName = this.group.name;
      this.groupYear = this.group.year || null;
    }
  }

  save() {
    this.activeModal.close({
      name: this.groupName,
      year: this.groupYear
    });
  }
}

