import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {CoursesService} from '../../../shared/services/courses.service';
import {Course} from '../../../shared/models/course.model';
import {Teacher} from '../../../shared/models/teacher.model';
import {CourseLabInstructorService} from '../../../shared/services/course-lab-instructor.service';
import {StudyCycle} from '../../../shared/models/study-cycle.enum';

@Component({
  selector: 'app-course-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-modal.component.html',
  styleUrls: ['./course-modal.component.css']
})
export class CourseModalComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() course?: Course;
  @Input() teachers: Teacher[] = [];

  courseName: string = '';
  courseTeacherId: number | null = null;
  courseStudyCycle: StudyCycle | null = null;
  courseYear: number | null = null;
  courseSemester: number | null = null;
  courseIsOptional: boolean = false;
  labInstructorIds: number[] = [];
  labSearchText: string = '';
  filteredTeachersForLab: Teacher[] = [];
  showLabError: boolean = false;
  selectedFile: File | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private courseLabInstructorService: CourseLabInstructorService,
    private coursesService: CoursesService
  ) {
  }

  sortLabInstructors() {
    // Selectați la început, restul alfabetic
    const selected = this.teachers.filter(t => this.labInstructorIds.includes(t.id));
    const unselected = this.teachers.filter(t => !this.labInstructorIds.includes(t.id));
    unselected.sort((a, b) => a.name.localeCompare(b.name));
    this.filteredTeachersForLab = [...selected, ...unselected];
    // Dacă există filtrare, aplică și filtrul
    if (this.labSearchText.trim()) {
      const searchLower = this.labSearchText.toLowerCase();
      this.filteredTeachersForLab = this.filteredTeachersForLab.filter(teacher =>
        teacher.name.toLowerCase().includes(searchLower)
      );
    }
  }

  filterLabInstructors() {
    this.sortLabInstructors();
  }

  ngOnInit() {
    this.filteredTeachersForLab = this.teachers;
    this.sortLabInstructors();

    if (this.mode === 'edit' && this.course) {
      this.courseName = this.course.name ?? '';
      this.courseTeacherId = this.course.teacher_id ?? null;
      this.courseYear = this.course.year ?? 1;
      this.courseSemester = this.course.semester ?? 1;
      this.courseIsOptional = this.course.is_optional ?? false;

      // Set study cycle based on year
      if (this.courseYear && this.courseYear >= 5) {
        this.courseStudyCycle = StudyCycle.MASTER;
      } else {
        this.courseStudyCycle = StudyCycle.LICENTA;
      }

      // Load lab instructors for this course
      if (this.course.id) {
        this.loadLabInstructors(this.course.id);
      }
    }
  }

  onStudyCycleChange(): void {
    // Reset year when study cycle changes
    this.courseYear = null;
  }

  loadLabInstructors(courseId: number) {
    this.courseLabInstructorService.getByCourse(courseId)
      .subscribe({
        next: (instructors) => {
          this.labInstructorIds = instructors.map(i => Number(i.teacher_id));
          this.sortLabInstructors();
          console.log('Loaded lab instructors:', this.labInstructorIds);
        },
        error: (error) => console.error('Error loading lab instructors:', error)
      });
  }

  toggleLabInstructor(teacherId: number, event: any) {
    const isChecked = event.target.checked;
    if (isChecked) {
      if (!this.labInstructorIds.includes(teacherId)) {
        this.labInstructorIds.push(teacherId);
      }
    } else {
      this.labInstructorIds = this.labInstructorIds.filter(id => id !== teacherId);
    }
    this.sortLabInstructors();
    console.log('Lab instructors after toggle:', this.labInstructorIds);
  }

  isLabInstructor(teacherId: number): boolean {
    return this.labInstructorIds.includes(teacherId);
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
  }

  isFormValid(): boolean {
    return !!(this.courseName &&
      this.courseTeacherId &&
      this.courseStudyCycle &&
      this.courseYear &&
      this.courseSemester &&
      this.labInstructorIds.length > 0);
  }

  save() {
    if (!this.isFormValid()) {
      this.showLabError = true;
      return;
    }
    this.activeModal.close({
      name: this.courseName,
      teacher_id: this.courseTeacherId,
      year: this.courseYear,
      semester: this.courseSemester,
      is_optional: this.courseIsOptional,
      lab_instructor_ids: this.labInstructorIds,
      file: this.selectedFile
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (this.mode === 'edit' && this.course?.id) {
        // In edit mode, upload immediately
        this.coursesService.uploadCourseFile(this.course.id, file).subscribe({
          next: (response) => {
            console.log('File uploaded successfully:', response);
            if (this.course) {
              this.course.course_file = response.filename;
            }
          },
          error: (error) => {
            console.error('Upload failed:', error);
            alert('Eroare la încărcarea fișierului: ' + (error.error?.error || 'Eroare necunoscută'));
          }
        });
      } else {
        // In add mode, store the file to be uploaded after course creation
        this.selectedFile = file;
        console.log('File selected for upload:', file.name);
      }
    }
  }

  downloadFile(): void {
    if (!this.course?.id) return;

    this.coursesService.downloadCourseFile(this.course.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fisa_disciplinei_${this.course?.name}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Download failed:', error);
        alert('Eroare la descărcarea fișierului');
      }
    });
  }

  deleteFile(): void {
    if (!this.course?.id) return;

    if (confirm(`Sigur doriți să ștergeți fișierul pentru cursul "${this.course.name}"?`)) {
      this.coursesService.deleteCourseFile(this.course.id).subscribe({
        next: (response) => {
          console.log('File deleted successfully:', response);
          if (this.course) {
            this.course.course_file = undefined;
          }
          alert('Fișierul a fost șters cu succes!');
        },
        error: (error) => {
          console.error('Delete failed:', error);
          alert('Eroare la ștergerea fișierului');
        }
      });
    }
  }

  getFileExtension(filename?: string): string {
    if (!filename) return 'FIȘIER';
    const parts = filename.split('.');
    if (parts.length < 2) return 'FIȘIER';
    return parts.pop()!.toUpperCase();
  }

}
