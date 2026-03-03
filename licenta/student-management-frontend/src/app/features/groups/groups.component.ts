import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatListModule} from '@angular/material/list';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {StudentGroup} from '../../shared/models/student-groups.model';
import {StudentGroupsService} from '../../shared/services/student-groups.service';
import {StudentsService} from '../../shared/services/students.service';
import {Student} from '../../shared/models/student.model';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AuthService} from '../../shared/services/auth.service';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {GroupModalComponent} from './modal/group-modal.component';
import {Router} from '@angular/router';
import {UserRole} from '../../shared/models/user-role.enum';
import {AlertService} from '../../shared/services/alert.service';
import {StudyCycle} from '../../shared/models/study-cycle.enum';

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
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule
  ],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {
  groups: StudentGroup[] = [];
  filteredGroups: StudentGroup[] = [];
  studentsMap: { [groupId: number]: Student[] } = {};
  expandedGroup: number | null = null;
  selectedYearFilter: number | null = null;
  selectedAcademicYearFilter: string | null = null;
  selectedStudyCycleFilter: StudyCycle | null = null;
  searchText: string = '';

  // Autocomplete form controls
  nameSearchControl = new FormControl<string>('');
  yearControl = new FormControl<string | number>('');
  academicYearControl = new FormControl<string>('');

  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private groupsService: StudentGroupsService,
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
    this.groupsService.getAll().subscribe((groups: StudentGroup[]) => {
      // Sort groups by name ascending
      this.groups = groups.sort((a, b) => a.name.localeCompare(b.name));
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const searchLower = (this.searchText || '').toLowerCase();
    this.filteredGroups = this.groups.filter(g => {
      const nameMatch = !this.searchText || (g.name && g.name.toLowerCase().includes(searchLower));
      const yearMatch = this.selectedYearFilter === null || g.year === this.selectedYearFilter;
      const academicYearMatch = this.selectedAcademicYearFilter === null || g.academic_year === this.selectedAcademicYearFilter;
      const cycleMatch = !this.selectedStudyCycleFilter || g.study_cycle === this.selectedStudyCycleFilter;
      return nameMatch && yearMatch && academicYearMatch && cycleMatch;
    });
    this.pageIndex = 0;
  }

  onYearFilterChange(): void {
    this.applyFilters();
  }

  onAcademicYearFilterChange(): void {
    this.applyFilters();
  }

  getUniqueYears(): number[] {
    const years = this.groups
      .map(g => g.year)
      .filter((year): year is number => year !== null && year !== undefined);
    return Array.from(new Set(years)).sort((a, b) => a - b);
  }

  getUniqueAcademicYears(): string[] {
    const ay = this.groups
      .map(g => g.academic_year)
      .filter((v): v is string => !!v);
    return Array.from(new Set(ay)).sort();
  }

  getUniqueStudyCycles(): StudyCycle[] {
    const cycles = this.groups
      .map(g => g.study_cycle)
      .filter((cycle): cycle is StudyCycle => !!cycle);
    return Array.from(new Set(cycles));
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
    modalRef.componentInstance.allGroups = this.groups;

    modalRef.result.then((result) => {
      if (result) {
        const newGroup = {
          name: result.name,
          year: result.year,
          academic_year: result.academic_year,
          student_ids: result.student_ids || []
        };
        this.groupsService.create(newGroup).subscribe({
          next: () => {
            this.loadGroups();
            const studentCount = result.student_ids?.length || 0;
            if (studentCount > 0) {
              this.alertService.success(`Grupa a fost creata cu succes cu ${studentCount} student(i)`);
            } else {
              this.alertService.success('Grupa a fost creata cu succes!');
            }
          },
          error: (error) => {
            console.error('Error creating group:', error);
            this.alertService.error('Eroare la crearea grupului');
          }
        });
      }
    });
  }

  editGroup(group: StudentGroup): void {
    const modalRef = this.modalService.open(GroupModalComponent, {size: 'lg'});
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.group = group;
    modalRef.componentInstance.allGroups = this.groups;

    modalRef.result.then((result) => {
      if (result) {
        const updatedGroup = {
          id: group.id,
          name: result.name,
          year: result.year,
          academic_year: result.academic_year,
          student_ids: result.student_ids || []
        };
        this.groupsService.update(updatedGroup).subscribe({
          next: () => {
            this.loadGroups();
            const studentCount = result.student_ids?.length || 0;
            this.alertService.success(`Grupa a fost actualizata cu succes cu ${studentCount} student(i)`);
          },
          error: (error) => {
            console.error('Error updating group:', error);
            this.alertService.error('Eroare la actualizarea grupului');
          }
        });
      }
    });
  }

  deleteGroup(id: number): void {
    this.alertService.confirm(
      'Sigur doriți să ștergeți această grupă? Această acțiune nu poate fi anulată.',
      () => {
        this.groupsService.delete(id).subscribe({
          next: () => {
            this.loadGroups();
            this.alertService.success('Grupa a fost ștearsă cu succes!');
          },
          error: (error) => {
            console.error('Failed to delete group:', error);
            this.alertService.error('Ștergerea grupei a eșuat. Poate fi legată de alte înregistrări.');
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
      'Sigur doriți să ștergeți acest student?',
      () => {
        this.studentsService.delete(studentId).subscribe({
          next: () => {
            this.studentsService.getByGroup(groupId).subscribe({
              next: (students: Student[]) => {
                this.studentsMap[groupId] = students || [];
                this.alertService.success('Studentul a fost șters cu succes!');
              },
              error: (error) => {
                console.error('Error reloading students for group', groupId, ':', error);
                this.alertService.warning('Studentul a fost șters, dar nu s-au putut reîncărca studenții pentru grup. Te rog reîncarcă pagina.');
              }
            });
          },
          error: (error) => {
            console.error('Error deleting student:', error);
            this.alertService.error('Eroare la ștergerea studentului');
          }
        });
      }
    );
  }

  getPaginatedGroups(): StudentGroup[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredGroups.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  // Autocomplete helpers
  clearNameSearch(): void {
    this.searchText = '';
    this.nameSearchControl.setValue('');
    this.applyFilters();
  }

  clearYearFilter(): void {
    this.selectedYearFilter = null;
    this.yearControl.setValue('');
    this.onYearFilterChange();
  }

  clearAcademicYearFilter(): void {
    this.selectedAcademicYearFilter = null;
    this.academicYearControl.setValue('');
    this.onAcademicYearFilterChange();
  }

  clearStudyCycleFilter(): void {
    this.selectedStudyCycleFilter = null;
    this.applyFilters();
  }

  displayYear(year: number): string {
    return year ? year.toString() : '';
  }

  displayAcademicYear(ay: string): string {
    return ay || '';
  }

  onYearSelected(year: number | null): void {
    this.selectedYearFilter = year;
    this.onYearFilterChange();
  }

  onAcademicYearSelected(ay: string | null): void {
    this.selectedAcademicYearFilter = ay;
    this.onAcademicYearFilterChange();
  }

  onStudyCycleSelected(cycle: StudyCycle | null): void {
    this.selectedStudyCycleFilter = cycle;
    this.applyFilters();
  }
}
