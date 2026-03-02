import {Component, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TeachersService} from '../../core/service/teachers.service';
import {Teacher} from '../../shared/models/teacher.model';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {TeacherModalComponent} from './teacher-modal.component';
import {AlertService} from '../../shared/services/alert.service';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule],
  templateUrl: './teachers.component.html',
  styleUrls: ['./teachers.component.css']
})
export class TeachersComponent {
  teachers = signal<Teacher[]>([]);
  filteredTeachers = signal<Teacher[]>([]);

  searchText: string = '';
  sortColumn: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private teachersService: TeachersService,
    private modalService: NgbModal,
    private alertService: AlertService
  ) {
    this.loadTeachers();
  }

  loadTeachers() {
    this.teachersService.getAll().subscribe({
      next: (data: Teacher[]) => {
        this.teachers.set(data);
        this.filteredTeachers.set(data);
        this.applyFilterAndSort();
      },
      error: (error: any) => console.error('Error loading teachers:', error)
    });
    this.applyFilterAndSort();
  }

  applyFilterAndSort(): void {
    const searchLower = this.searchText.toLowerCase();
    let filtered = this.teachers().filter(teacher => {
      const name = teacher.name || '';
      const email = teacher.email || '';
      const id = teacher.id?.toString() || '';
      return name.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower) ||
        id.includes(searchLower);
    });

    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (this.sortColumn) {
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          break;
        case 'email':
          aVal = (a.email || '').toLowerCase();
          bVal = (b.email || '').toLowerCase();
          break;
        case 'id':
          aVal = a.id;
          bVal = b.id;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredTeachers.set(filtered);
  }

  onSearchChange(): void {
    this.applyFilterAndSort();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilterAndSort();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  deleteTeacher(id: number | undefined) {
    this.alertService.confirm(
      'Are you sure you want to delete this teacher?',
      () => {
        if (id != null) {
          this.teachersService.delete(id).subscribe({
            next: () => {
              this.teachers.update(teachers =>
                teachers.filter(t => t.id !== id)
              );
              this.applyFilterAndSort();
              this.alertService.success('Teacher deleted successfully!');
            },
            error: (error: any) => {
              console.error('Error deleting teacher:', error);
              this.alertService.error('Failed to delete teacher. Please try again.');
            }
          });
        }
      }
    );
  }

  openAddModal() {
    const modalRef = this.modalService.open(TeacherModalComponent, {size: 'lg'});
    modalRef.componentInstance.mode = 'add';

    modalRef.result.then((result) => {
      if (result) {
        const newTeacher: Teacher = {
          id: 0,
          name: result.name,
          email: result.email
        };
        this.teachersService.create(newTeacher).subscribe(newTeacherObj => {
          this.teachers.update(list => [...list, newTeacherObj]);
          this.applyFilterAndSort();
        });
      }
    });
  }

  editTeacher(teacher: Teacher) {
    const modalRef = this.modalService.open(TeacherModalComponent, {size: 'lg'});
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.teacher = teacher;

    modalRef.result.then((result) => {
      if (result) {
        const updatedTeacher: Teacher = {
          id: teacher.id,
          name: result.name,
          email: result.email,
          created_at: teacher.created_at
        };
        this.teachersService.update(updatedTeacher).subscribe(updatedTeacherObj => {
          this.teachers.update(list => list.map(t => t.id === updatedTeacherObj.id ? updatedTeacherObj : t));
          this.applyFilterAndSort();
        });
      }
    });
  }

  getPaginatedTeachers(): Teacher[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredTeachers().slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }
}
