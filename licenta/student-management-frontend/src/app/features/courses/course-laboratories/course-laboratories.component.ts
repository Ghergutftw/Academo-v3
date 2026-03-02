import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {environment} from '../../../environments/environment';
import {LaboratoryService} from '../../../shared/services/laboratory.service';
import {CoursesService} from '../../../shared/services/courses.service';
import {Course} from '../../../shared/models/course.model';
import {Laboratory} from '../../../shared/models/laboratory.model';
import { FileOriginalNamePipe } from '../../../shared/pipes/file-original-name.pipe';
import { FileUploadDatePipe } from '../../../shared/pipes/file-upload-date.pipe';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditLabModalComponent } from './modals/edit/edit-lab-modal.component';
import { DeleteLabModalComponent } from './modals/delete/delete-lab-modal.component';
import { ToArrayPipe } from '../../../shared/pipes/to-array.pipe';

interface CourseWithTeacher extends Course {
  teacher_name?: string;
}

@Component({
  selector: 'app-course-laboratories',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ToArrayPipe
  ],
  providers: [FileOriginalNamePipe, FileUploadDatePipe],
  templateUrl: './course-laboratories.component.html',
  styleUrls: ['./course-laboratories.component.css']
})
export class CourseLaboratoriesComponent implements OnInit {
  courseId: number = 0;
  course: CourseWithTeacher | null = null;
  laboratories: Laboratory[] = [];
  editingLab: Laboratory | null = null;
  editingTopic: string = '';
  loading: boolean = false;
  error: string = '';
  success: string = '';
  showEditLabModal = false;
  showDeleteLabModal = false;
  selectedLab: Laboratory | null = null;

  private api = `${environment.apiUrl}`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coursesService: CoursesService,
    private laboratoryService: LaboratoryService,
    private modalService: NgbModal
  ) {
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = +params['id'];
      if (this.courseId) {
        this.loadCourse();
        this.loadLaboratories();
      }
    });
  }

  loadCourse(): void {
    this.coursesService.getAll().subscribe({
      next: (courses) => {
        this.course = courses.find(c => c.id === this.courseId) || null;
      },
      error: () => {
        this.error = 'Eroare la încărcarea detaliilor cursului';
      }
    });
  }

  // --- File management for laboratories ---
  onLabFileSelected(lab: Laboratory, event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      this.laboratoryService.uploadFile(lab.id, file).subscribe({
        next: () => {
          this.loadLabFiles(lab);
          lab.uploadSuccess = true;
          setTimeout(() => lab.uploadSuccess = false, 2000);
        },
        error: () => {
          this.error = 'Eroare la upload fișier laborator';
        }
      });
    });
    event.target.value = '';
  }

  loadLabFiles(lab: Laboratory): void {
    this.laboratoryService.listFiles(lab.id).subscribe({
      next: (files) => {
        // Normalizez: dacă e string, îl transform în {name, path}
        lab.files = files.map(f => typeof f === 'string' ? { name: f, path: f } : f);
      },
      error: () => {
        lab.files = [];
      }
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

  deleteLabFile(lab: Laboratory, file: any): void {
    this.laboratoryService.deleteFile(file).subscribe({
      next: () => {
        this.loadLabFiles(lab);
      },
      error: () => {
        this.error = 'Eroare la ștergerea fișierului';
      }
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

  // La încărcare laboratoare, încarcă și fișierele pentru fiecare laborator
  loadLaboratories(): void {
    this.loading = true;
    this.laboratoryService.getByCourse(this.courseId).subscribe({
      next: (labs) => {
        this.laboratories = labs.map(lab => ({ ...lab, expanded: false }));
        this.laboratories.forEach(lab => this.loadLabFiles(lab));
        this.loading = false;
      },
      error: () => {
        this.error = 'Eroare la încărcarea laboratoarelor';
        this.loading = false;
      }
    });
  }

  startEdit(lab: Laboratory): void {
    this.editingLab = lab;
    this.editingTopic = lab.topic;
    this.error = '';
    this.success = '';
  }

  cancelEdit(): void {
    this.editingLab = null;
    this.editingTopic = '';
  }

  saveEdit(lab: Laboratory): void {
    if (!this.editingTopic.trim()) {
      this.error = 'Tema nu poate fi goală';
      return;
    }
    this.loading = true;
    this.laboratoryService.updateTopic(lab.id, this.editingTopic).subscribe({
      next: () => {
        const index = this.laboratories.findIndex(l => l.id === lab.id);
        if (index !== -1) {
          this.laboratories[index].topic = this.editingTopic;
        }
        this.success = `Tema laboratorului ${lab.lab_number} a fost actualizată cu succes!`;
        this.cancelEdit();
        this.loading = false;
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: () => {
        this.error = 'Eroare la actualizarea temei laboratorului';
        this.loading = false;
      }
    });
  }

  openEditLabModal(lab: Laboratory): void {
    const modalRef = this.modalService.open(EditLabModalComponent, { size: 'md' });
    modalRef.componentInstance.lab = lab;
    modalRef.result.then((result) => {
      if (result && result.topic && result.topic !== lab.topic) {
        this.editingLab = lab;
        this.editingTopic = result.topic;
        this.saveEdit(lab);
      }
    }, () => {});
  }

  openDeleteLabModal(lab: Laboratory): void {
    const modalRef = this.modalService.open(DeleteLabModalComponent, { size: 'md' });
    modalRef.componentInstance.lab = lab;
    modalRef.result.then((result) => {
      if (result && result.delete) {
        this.deleteLab(lab);
      }
    }, () => {});
  }

  deleteLab(lab: Laboratory): void {
    this.loading = true;
    this.laboratoryService.delete(lab.id).subscribe({
      next: () => {
        this.loadLaboratories();
        this.loading = false;
      },
      error: () => {
        this.error = 'Eroare la ștergerea laboratorului';
        this.loading = false;
      }
    });
  }

  trackFile(index: number, file: string) {
    return file;
  }

  getFileName(file: any): string {
    return typeof file === 'string' ? file : (file && file.name ? file.name : '');
  }
}
