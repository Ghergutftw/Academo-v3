import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { AlertService } from '../../shared/services/alert.service';
import { ExamScheduleService } from '../../shared/services/exam-schedule.service';

@Component({
  selector: 'app-exam-schedule',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-schedule.component.html',
  styleUrls: ['./exam-schedule.component.css']
})
export class ExamScheduleComponent implements OnInit {
  currentUser: any;
  isAdmin = false;
  loading = false;
  selectedFile: File | null = null;
  fileExists = false;

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private scheduleService: ExamScheduleService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.currentUser?.is_admin === true || this.currentUser?.role === 'admin';
    this.checkScheduleExists();
  }

  checkScheduleExists(): void {
    this.scheduleService.checkScheduleExists().subscribe({
      next: (response) => {
        this.fileExists = response.exists === true;
      },
      error: () => {
        this.fileExists = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        this.alertService.error('Te rog selecteaza un fisier .xlsx sau .xls');
        return;
      }
      this.selectedFile = file;
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.alertService.error('Te rog selecteaza un fisier');
      return;
    }

    this.loading = true;
    this.scheduleService.uploadScheduleFile(this.selectedFile).subscribe({
      next: () => {
        this.alertService.success('Programul a fost incarcat cu succes');
        this.selectedFile = null;
        this.fileExists = true;
        this.loading = false;
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      },
      error: (error: any) => {
        this.alertService.error(error.error?.error || 'Failed to upload file');
        this.loading = false;
      }
    });
  }

  downloadFile(): void {
    this.loading = true;
    this.scheduleService.downloadScheduleFile().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Programare_Examene.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      error: () => {
        this.alertService.error('Eroare la descarcarea fisierului');
        this.loading = false;
      }
    });
  }

  clearFile(): void {
    this.selectedFile = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}

