import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StudentsService} from '../../core/service/students.service';
import {Student} from '../../shared/models/student.model';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../core/service/auth.service';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {StudentModalComponent} from './student-modal.component';
import {GroupsService} from '../../core/service/groups.service';
import {Group} from '../../shared/models/group.model';
import {UserRole} from '../../shared/models/user-role.enum';
import * as XLSX from 'xlsx';
import {AlertService} from '../../shared/services/alert.service';

@Component({
  selector: 'app-students-list',
  imports: [CommonModule, FormsModule, MatPaginatorModule],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css'],
})
export class StudentsListComponent implements OnInit {
  students: Student[] = [];
  filteredStudents: Student[] = [];
  groups: Group[] = [];
  loading = true;

  searchText: string = '';
  selectedGroupFilter: number | null = null; // null means "All Groups"

  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private studentsService: StudentsService,
    public authService: AuthService,
    private modalService: NgbModal,
    private groupsService: GroupsService,
    private alertService: AlertService
  ) {
  }

  get isAdmin(): boolean {
    return this.authService.hasRole(UserRole.ADMIN);
  }

  ngOnInit(): void {
    this.groupsService.getAll().subscribe({
      next: (groups) => {
        this.groups = groups;
        console.log('Groups loaded:', this.groups);
      },
      error: (error) => console.error('Error loading groups:', error)
    });

    this.studentsService.getAll().subscribe(list => {
      this.students = list;
      this.applyFilters(); // Use the new filter method
      this.loading = false;
      console.log('Students loaded:', this.students);

      const editStudentId = sessionStorage.getItem('editStudentId');
      if (editStudentId) {
        sessionStorage.removeItem('editStudentId'); // Clear it immediately
        const studentToEdit = this.students.find(s => s.id === parseInt(editStudentId));
        if (studentToEdit) {
          setTimeout(() => this.editStudent(studentToEdit), 100);
        }
      }
    });
  }

  openAddModal() {
    const modalRef = this.modalService.open(StudentModalComponent, {size: 'lg'});
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.groups = this.groups;

    modalRef.result.then((result) => {
      if (result) {
        const newStudent: Student = {
          id: 0,
          name: result.name,
          email: result.email,
          group_name: result.group_id
        };
        this.studentsService.create(newStudent).subscribe((created: Student) => {
          this.students.push(created);
        });
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  editStudent(s: Student) {
    const modalRef = this.modalService.open(StudentModalComponent, {size: 'lg'});
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.student = s;
    modalRef.componentInstance.groups = this.groups;

    modalRef.result.then((result) => {
      if (result) {
        const updatedStudent: Student = {
          id: s.id,
          name: result.name,
          email: result.email,
          group_name: result.group_id,
          created_at: s.created_at
        };
        this.studentsService.update(updatedStudent).subscribe((updated: Student) => {
          const idx = this.students.findIndex(student => student.id === updated.id);
          if (idx > -1) this.students[idx] = updated;
        });
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  deleteStudent(id: number | undefined) {
    if (id != null) {
      this.alertService.confirm(
        'Are you sure you want to delete this student?',
        () => {
          this.studentsService.delete(id).subscribe({
            next: () => {
              this.loadStudents();
              this.alertService.success('Student deleted successfully!');
            },
            error: (error: any) => {
              console.error('Error deleting student:', error);
              this.alertService.error('Failed to delete student. Please try again.');
            }
          });
        }
      );
    }
  }

  getPaginatedStudents(): Student[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredStudents.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  // Get group name by ID
  getGroupName(groupId: number | undefined): string {
    if (!groupId) return 'No Group';
    const group = this.groups.find(g => g.id === groupId);
    return group ? group.name : `Group ${groupId}`;
  }

  // Apply group filter
  applyFilters(): void {
    if (this.selectedGroupFilter === null) {
      // Show all students
      this.filteredStudents = [...this.students];
    } else {
      // Filter by selected group
      this.filteredStudents = this.students.filter(s => s.group_name === this.selectedGroupFilter);
    }
    // Reset to first page when filter changes
    this.pageIndex = 0;
  }

  onGroupFilterChange(): void {
    this.applyFilters();
  }

  // Excel import functionality
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});

      // Assuming first sheet contains the student data
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Process the data
      this.processExcelData(jsonData);
    };

    reader.readAsArrayBuffer(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  }

  processExcelData(data: any[]): void {
    console.log('Processing Excel data:', data);
    console.log('Available groups:', this.groups);

    const studentsToImport: Student[] = [];
    const errors: string[] = [];
    const missingGroups = new Set<string>();

    data.forEach((row: any, index: number) => {
      // Only support exact column names: Name/name, Email/email, Group/group
      const name = row['Name'] || row['name'];
      const email = row['Email'] || row['email'];
      const groupIdentifier = row['Group'] || row['group'];

      console.log(`Row ${index + 1}:`, { name, email, groupIdentifier });

      if (!name || !email || !groupIdentifier) {
        errors.push(`Row ${index + 2}: Missing required fields (Name, Email, or Group)`);
        return;
      }

      // Find group by name or ID
      let groupId: number | undefined;
      const groupIdentifierStr = String(groupIdentifier).trim();

      // Try to find by exact name match first
      const groupByName = this.groups.find(g =>
        g.name.toLowerCase() === groupIdentifierStr.toLowerCase()
      );

      if (groupByName) {
        groupId = groupByName.id;
        console.log(`Found group by name: ${groupByName.name} (ID: ${groupId})`);
      } else if (!isNaN(Number(groupIdentifierStr))) {
        // Try as numeric ID
        const groupById = this.groups.find(g => g.id === Number(groupIdentifierStr));
        if (groupById) {
          groupId = groupById.id;
          console.log(`Found group by ID: ${groupById.name} (ID: ${groupId})`);
        }
      }

      if (!groupId) {
        missingGroups.add(groupIdentifierStr);
        errors.push(`Row ${index + 2}: Group "${groupIdentifierStr}" not found. Available groups: ${this.groups.map(g => g.name).join(', ')}`);
        return;
      }

      studentsToImport.push({
        id: 0,
        name: String(name).trim(),
        email: String(email).trim(),
        group_name: groupId
      });
    });

    console.log('Students to import:', studentsToImport);
    console.log('Errors:', errors);

    if (missingGroups.size > 0) {
      const groupList = Array.from(missingGroups).join(', ');
      this.alertService.error(`Missing groups in the system: ${groupList}\n\nPlease create these groups first before importing students.`);
    }

    if (errors.length > 0) {
      const errorMsg = errors.slice(0, 10).join('\n') + (errors.length > 10 ? `\n... and ${errors.length - 10} more errors` : '');
      this.alertService.confirm(
        `Errors found in Excel file:\n${errorMsg}\n\n${errors.length} errors found. Continue importing ${studentsToImport.length} valid students?`,
        () => {
          if (studentsToImport.length > 0) {
            this.importStudents(studentsToImport, false);
          }
        }
      );
      if (studentsToImport.length === 0) {
        return;
      }
      return;
    }

    if (studentsToImport.length === 0) {
      this.alertService.warning('No valid students found in the Excel file.');
      return;
    }

    // Import students - automatically skip duplicates, only add new ones
    this.importStudents(studentsToImport, false);
  }

  importStudents(students: Student[], updateDuplicates: boolean = false): void {
    console.log('Sending to backend:', students);
    console.log('Update duplicates:', updateDuplicates);

    this.studentsService.importExcel(students, updateDuplicates).subscribe({
      next: (result) => {
        console.log('Import result:', result);

        let message = `Import completed!\n` +
          `✓ Created: ${result.success}\n` +
          `↻ Updated: ${result.updated || 0}\n` +
          `⊘ Skipped: ${result.skipped || 0}\n` +
          `✗ Failed: ${result.failed}`;

        if (result.errors && result.errors.length > 0) {
          console.error('Import errors:', result.errors);

          // Filter out skipped messages for cleaner display
          const actualErrors = result.errors.filter((err: any) =>
            !err.error.includes('already exists (skipped)')
          );

          if (actualErrors.length > 0) {
            const errorDetails = actualErrors.slice(0, 5).map((err: any) =>
              `Row ${err.row}: ${err.error}`
            ).join('\n');
            message += `\n\nErrors:\n${errorDetails}`;
            if (actualErrors.length > 5) {
              message += `\n... and ${actualErrors.length - 5} more errors (check console)`;
            }
          }
        }

        if (result.failed > 0) {
          this.alertService.warning(message);
        } else if (result.success > 0) {
          this.alertService.success(message);
        } else {
          this.alertService.info(message);
        }

        // Refresh student list if any were successful
        if (result.success > 0) {
          this.loadStudents();
        }
      },
      error: (error) => {
        console.error('Error importing students:', error);
        let errorMsg = 'Failed to import students.';

        if (error.error && error.error.error) {
          errorMsg += `\n\nError: ${error.error.error}`;
        } else if (error.message) {
          errorMsg += `\n\nError: ${error.message}`;
        }

        errorMsg += '\n\nCheck the browser console for more details.';
        this.alertService.error(errorMsg);
      }
    });
  }

  loadStudents(): void {
    this.studentsService.getAll().subscribe(list => {
      this.students = list;
      this.applyFilters(); // Apply current filters after reload
      this.loading = false;
      console.log('Students reloaded:', this.students);
    });
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('excelFileInput') as HTMLInputElement;
    fileInput?.click();
  }
}
