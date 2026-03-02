import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Laboratory } from '../../../../../shared/models/laboratory.model';
import { FormsModule } from '@angular/forms';
import { LaboratoryService } from '../../../../../shared/services/laboratory.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'edit-lab-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-lab-modal.component.html',
  styleUrls: ['./edit-lab-modal.component.css']
})
export class EditLabModalComponent {
  @Input() lab!: Laboratory;
  @Input() isTeacher: boolean = false;
  editingTopic: string = '';
  loading: boolean = false;
  error: string = '';
  uploadSuccess: boolean = false;

  constructor(public activeModal: NgbActiveModal, private laboratoryService: LaboratoryService) {}

  ngOnInit() {
    this.editingTopic = this.lab?.topic || '';
    this.loadLabFiles();
  }

  loadLabFiles() {
    if (!this.lab?.id) return;
    this.laboratoryService.listFiles(this.lab.id).subscribe({
      next: (files) => {
        this.lab.files = (files || []).map(f => typeof f === 'string' ? { name: f, path: f } : f);
      },
      error: () => {
        this.lab.files = [];
      }
    });
  }

  onLabFileSelected(lab: Laboratory, event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      this.laboratoryService.uploadFile(lab.id, file).subscribe({
        next: () => {
          this.loadLabFiles();
          this.uploadSuccess = true;
          setTimeout(() => this.uploadSuccess = false, 2000);
        },
        error: () => {
          this.error = 'Eroare la upload fișier laborator';
        }
      });
    });
    event.target.value = '';
  }

  deleteLabFile(lab: Laboratory, file: any): void {
    this.laboratoryService.deleteFile(file).subscribe({
      next: () => this.loadLabFiles(),
      error: () => this.error = 'Eroare la ștergerea fișierului'
    });
  }

  downloadLabFile(lab: Laboratory, file: any): void {
    this.laboratoryService.downloadFile(file.path).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  downloadAllLabFiles(lab: Laboratory): void {
    this.laboratoryService.downloadAllFiles(lab.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lab_${lab.lab_number}_fisiere.zip`;
      link.click();
      window.URL.revokeObjectURL(url);
    }, () => {
      this.error = 'Eroare la descărcarea arhivei.';
    });
  }

  getFileName(file: any): string {
    return typeof file === 'string' ? file : (file && file.name ? file.name : '');
  }

  trackFile(index: number, file: string) {
    return file;
  }

  save() {
    if (this.editingTopic.trim()) {
      this.activeModal.close({ topic: this.editingTopic });
    }
  }

  cancel() {
    this.activeModal.dismiss();
  }

  getFilesArray(fileList: FileList | null): File[] {
    return fileList ? Array.from(fileList) : [];
  }
}
