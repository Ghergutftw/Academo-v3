import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Laboratory } from '../../../../../shared/models/laboratory.model';

@Component({
  selector: 'delete-lab-modal',
  standalone: true,
  templateUrl: './delete-lab-modal.component.html',
  styleUrls: ['./delete-lab-modal.component.css']
})
export class DeleteLabModalComponent {
  @Input() lab!: Laboratory;

  constructor(public activeModal: NgbActiveModal) {}

  confirmDelete() {
    this.activeModal.close({ delete: true });
  }

  cancel() {
    this.activeModal.dismiss();
  }
}

