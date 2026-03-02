import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {LaboratoryService} from '../../../core/service/laboratory.service';
import {Course} from '../../../shared/models/course.model';
import {Laboratory} from '../../../shared/models/laboratory.model';

interface CourseWithTeacher extends Course {
  teacher_name?: string;
}

@Component({
  selector: 'app-course-laboratories',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  private api = `${environment.apiUrl}`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private laboratoryService: LaboratoryService
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
    this.http.get<Course[]>(`${this.api}/courses/getAll.php`).subscribe({
      next: (courses) => {
        this.course = courses.find(c => c.id === this.courseId) || null;
      },
      error: () => {
        this.error = 'Failed to load course details';
      }
    });
  }

  loadLaboratories(): void {
    this.loading = true;
    this.laboratoryService.getByCourse(this.courseId).subscribe({
      next: (labs) => {
        this.laboratories = labs;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load laboratories';
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
      this.error = 'Topic cannot be empty';
      return;
    }
    this.loading = true;
    this.laboratoryService.updateTopic(lab.id, this.editingTopic).subscribe({
      next: () => {
        const index = this.laboratories.findIndex(l => l.id === lab.id);
        if (index !== -1) {
          this.laboratories[index].topic = this.editingTopic;
        }
        this.success = `Laboratory ${lab.lab_number} topic updated successfully!`;
        this.cancelEdit();
        this.loading = false;
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: () => {
        this.error = 'Failed to update laboratory topic';
        this.loading = false;
      }
    });
  }
}
