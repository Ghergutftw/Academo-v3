import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatListModule} from '@angular/material/list';
import {Group} from '../../shared/models/group.model';
import {GroupsService} from '../../core/service/groups.service';
import {StudentsService} from '../../core/service/students.service';
import {Student} from '../../shared/models/student.model';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../core/service/auth.service';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {GroupModalComponent} from './group-modal.component';
import {Router} from '@angular/router';
import {UserRole} from '../../shared/models/user-role.enum';
import {AlertService} from '../../shared/services/alert.service';

@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    FormsModule,
    MatPaginatorModule
  ],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {
  groups: Group[] = [];
  studentsMap: { [groupId: number]: Student[] } = {};
  expandedGroup: number | null = null;

  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private groupsService: GroupsService,
    private studentsService: StudentsService,
    public authService: AuthService,
    private modalService: NgbModal,
    private router: Router,
    private alertService: AlertService
  ) {
  }

  get isAdmin(): boolean {
    return this.authService.hasRole(UserRole.ADMIN);
  }

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.groupsService.getAll().subscribe((groups: Group[]) => {
      this.groups = groups;
    });
  }

  loadStudentsForGroup(groupId: number): void {
    if (!this.studentsMap.hasOwnProperty(groupId)) {
      console.log('Loading students for group:', groupId);
      this.studentsService.getByGroup(groupId).subscribe({
        next: (students: Student[]) => {
          console.log('Students loaded for group', groupId, ':', students);
          this.studentsMap[groupId] = students || [];
        },
        error: (error) => {
          console.error('Error loading students for group', groupId, ':', error);
          this.studentsMap[groupId] = [];
        }
      });
    } else {
      console.log('Students already loaded for group:', groupId, this.studentsMap[groupId]);
    }
  }

  openAddModal(): void {
    const modalRef = this.modalService.open(GroupModalComponent, {size: 'lg'});
    modalRef.componentInstance.mode = 'add';

    modalRef.result.then((result) => {
      if (result) {
        const newGroup: Group = {
          id: 0,
          name: result.name,
          year: result.year
        };
        this.groupsService.create(newGroup).subscribe(() => {
          this.loadGroups();
        });
      }
    });
  }

  editGroup(group: Group): void {
    const modalRef = this.modalService.open(GroupModalComponent, {size: 'lg'});
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.group = group;

    modalRef.result.then((result) => {
      if (result) {
        const updatedGroup: Group = {
          id: group.id,
          name: result.name,
          year: result.year,
          created_at: group.created_at
        };
        this.groupsService.update(updatedGroup).subscribe(() => {
          this.loadGroups();
        });
      }
    });
  }

  deleteGroup(id: number): void {
    this.alertService.confirm(
      'Are you sure you want to delete this group? This action cannot be undone.',
      () => {
        this.groupsService.delete(id).subscribe({
          next: () => {
            this.loadGroups();
            this.alertService.success('Group deleted successfully!');
          },
          error: (error) => {
            console.error('Failed to delete group:', error);
            this.alertService.error('Failed to delete group. It may be linked to other records.');
          }
        });
      }
    );
  }

  toggleStudents(groupId: number): void {
    if (this.expandedGroup === groupId) {
      this.expandedGroup = null;
    } else {
      this.expandedGroup = groupId;
      this.loadStudentsForGroup(groupId);
    }
  }

  editStudent(student: Student): void {
    sessionStorage.setItem('editStudentId', student.id.toString());

    const currentRole = this.authService.getCurrentUser()?.role;
    if (currentRole === 'admin') {
      this.router.navigate(['/admin/students']);
    } else if (currentRole === 'teacher') {
      this.router.navigate(['/teacher/students']);
    }
  }

  deleteStudent(studentId: number, groupId: number): void {
    this.alertService.confirm(
      'Are you sure you want to delete this student?',
      () => {
        this.studentsService.delete(studentId).subscribe({
          next: () => {
            this.studentsService.getByGroup(groupId).subscribe({
              next: (students: Student[]) => {
                this.studentsMap[groupId] = students || [];
                this.alertService.success('Student deleted successfully!');
              },
              error: (error) => {
                console.error('Error reloading students for group', groupId, ':', error);
                this.alertService.warning('Student deleted, but failed to refresh the group list. Please expand the group again.');
              }
            });
          },
          error: (error) => {
            console.error('Error deleting student:', error);
            this.alertService.error('Failed to delete student. Please try again.');
          }
        });
      }
    );
  }

  getPaginatedGroups(): Group[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.groups.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }
}
