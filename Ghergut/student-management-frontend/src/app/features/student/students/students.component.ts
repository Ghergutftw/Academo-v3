import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {StudentModalComponent} from './modal/student-modal.component';
import * as XLSX from 'xlsx';
import {StudentsService} from '../../../shared/services/students.service';
import {AuthService} from '../../../shared/services/auth.service';
import {StudentGroupsService} from '../../../shared/services/student-groups.service';
import {AlertService} from '../../../shared/services/alert.service';
import {StudentGroup} from '../../../shared/models/student-groups.model';
import {UserRole} from '../../../shared/models/user-role.enum';
import {Student} from '../../../shared/models/student.model';
import {StudyCycle} from '../../../shared/models/study-cycle.enum';

@Component({
  selector: 'app-students-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatPaginatorModule, MatAutocompleteModule, MatInputModule, MatFormFieldModule, MatIconModule, MatButtonModule],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css'],
})
export class StudentsListComponent implements OnInit {
  students: Student[] = [];
  filteredStudents: Student[] = [];
  groups: StudentGroup[] = [];
  loading = true;

  searchText: string = '';
  selectedGroupFilter: number | null = null; // null means "All Groups"
  selectedYearFilter: number | null = null; // null means "All Years"
  selectedStudyCycleFilter: StudyCycle | null = null; // null means "All"
  selectedStudyYearFilter: number | null = null; // null means "All"
  selectedFinancingTypeFilter: string | null = null; // null means "All"
  selectedStudentStatusFilter: string | null = null; // null means "All"

  // Filter options
  studyCycles = [StudyCycle.LICENTA, StudyCycle.MASTER];
  availableStudyYears = [1, 2, 3, 4]; // Dinamically updated based on study cycle
  financingTypes = ['Buget', 'Taxa'];
  studentStatuses = ['Activ', 'Suspendat', 'Exmatriculat'];

  // Autocomplete form controls
  groupControl = new FormControl<string | StudentGroup>('');
  yearControl = new FormControl<string | number>('');
  studyCycleControl = new FormControl<string>('');
  studyYearControl = new FormControl<string | number>('');
  financingTypeControl = new FormControl<string>('');
  studentStatusControl = new FormControl<string>('');

  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private studentsService: StudentsService,
    public authService: AuthService,
    private modalService: NgbModal,
    private groupsService: StudentGroupsService,
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
        const newStudent: Partial<Student> = {
          name: result.name,
          email: result.email,
          group_id: result.group_id,
          start_year: result.start_year,
          study_cycle: result.study_cycle,
          study_year: result.study_year,
          financing_type: result.financing_type,
          student_status: result.student_status
        };
        this.studentsService.create(newStudent as Student).subscribe({
          next: (created: Student) => {
            this.students.push(created);
            this.applyFilters();
            this.alertService.success('Student adăugat cu succes!');
          },
          error: (error: any) => {
            console.error('Error creating student:', error);
            this.alertService.error('Eroare la adăugarea studentului!');
          }
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
          group_id: result.group_id,
          start_year: result.start_year,
          study_cycle: result.study_cycle,
          study_year: result.study_year,
          financing_type: result.financing_type,
          student_status: result.student_status
        };
        this.studentsService.update(updatedStudent).subscribe({
          next: (updated: Student) => {
            const idx = this.students.findIndex(student => student.id === updated.id);
            if (idx > -1) {
              this.students[idx] = updated;
              this.applyFilters();
            }
            this.alertService.success('Student actualizat cu succes!');
          },
          error: (error: any) => {
            console.error('Error updating student:', error);
            this.alertService.error('Eroare la actualizarea studentului!');
          }
        });
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  deleteStudent(id: number | undefined) {
    if (id != null) {
      this.alertService.confirm(
        'Sigur doriți să ștergeți acest student?',
        () => {
          this.studentsService.delete(id).subscribe({
            next: () => {
              this.loadStudents();
              this.alertService.success('Studentul a fost șters cu succes!');
            },
            error: (error: any) => {
              console.error('Error deleting student:', error);
              this.alertService.error('Eroare la ștergerea studentului!');
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

  // Apply filters
  applyFilters(): void {
    this.filteredStudents = this.students.filter(s => {
      const searchLower = this.searchText.toLowerCase();
      const nameMatch = !this.searchText ||
        (s.name && s.name.toLowerCase().includes(searchLower)) ||
        (s.email && s.email.toLowerCase().includes(searchLower));
      const groupMatch = this.selectedGroupFilter === null || s.group_id === this.selectedGroupFilter;
      const yearMatch = this.selectedYearFilter === null || s.start_year === this.selectedYearFilter;
      const studyCycleMatch = this.selectedStudyCycleFilter === null || s.study_cycle === this.selectedStudyCycleFilter;
      const studyYearMatch = this.selectedStudyYearFilter === null || s.study_year === this.selectedStudyYearFilter;
      const financingTypeMatch = this.selectedFinancingTypeFilter === null || s.financing_type === this.selectedFinancingTypeFilter;
      const studentStatusMatch = this.selectedStudentStatusFilter === null || s.student_status === this.selectedStudentStatusFilter;

      return nameMatch && groupMatch && yearMatch && studyCycleMatch && studyYearMatch && financingTypeMatch && studentStatusMatch;
    });
    // Reset to first page when filter changes
    this.pageIndex = 0;
  }

  onGroupFilterChange(): void {
    this.applyFilters();
  }

  onYearFilterChange(): void {
    this.applyFilters();
  }

  onStudyCycleFilterChange(): void {
    // Update available study years based on selected cycle
    if (this.selectedStudyCycleFilter === StudyCycle.MASTER) {
      this.availableStudyYears = [1, 2];
      // Reset study year filter if it's invalid for Master
      if (this.selectedStudyYearFilter && this.selectedStudyYearFilter > 2) {
        this.selectedStudyYearFilter = null;
        this.studyYearControl.setValue('');
      }
    } else if (this.selectedStudyCycleFilter === StudyCycle.LICENTA) {
      this.availableStudyYears = [1, 2, 3, 4];
    } else {
      // No cycle selected, show all years
      this.availableStudyYears = [1, 2, 3, 4];
    }
    this.applyFilters();
  }

  onStudyYearFilterChange(): void {
    this.applyFilters();
  }

  onFinancingTypeFilterChange(): void {
    this.applyFilters();
  }

  onStudentStatusFilterChange(): void {
    this.applyFilters();
  }

  getUniqueYears(): number[] {
    const years = this.students
      .map(s => s.start_year)
      .filter((year): year is number => year !== null && year !== undefined);
    return Array.from(new Set(years)).sort((a, b) => b - a);
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

    data.forEach((row: any, index: number) => {
      // Support column names: Name, Email, Group, Start_Year, Study_Cycle, Study_Year, Financing_Type, Student_Status
      const name = row['Name'] || row['name'];
      const email = row['Email'] || row['email'];
      const groupIdentifier = row['Group'] || row['group'];
      const startYear = row['Start_Year'] || row['start_year'] || row['Start Year'];
      const studyCycle = row['Study_Cycle'] || row['study_cycle'] || row['Study Cycle'] || 'Licenta';
      const studyYear = row['Study_Year'] || row['study_year'] || row['Study Year'] || 1;
      const financingType = row['Financing_Type'] || row['financing_type'] || row['Financing Type'] || 'Buget';
      const studentStatus = row['Student_Status'] || row['student_status'] || row['Student Status'] || 'Activ';

      console.log(`Row ${index + 1}:`, {
        name,
        email,
        groupIdentifier,
        startYear,
        studyCycle,
        studyYear,
        financingType,
        studentStatus
      });

      if (!name || !email || !groupIdentifier) {
        errors.push(`Row ${index + 2}: Missing required fields (Name, Email, or Group)`);
        return;
      }

      // Validate study cycle
      if (studyCycle && ![StudyCycle.LICENTA, StudyCycle.MASTER].includes(studyCycle as StudyCycle)) {
        errors.push(`Row ${index + 2}: Invalid Study_Cycle "${studyCycle}". Must be "Licenta" or "Master"`);
        return;
      }

      // Validate financing type
      if (financingType && !['Buget', 'Taxa'].includes(financingType)) {
        errors.push(`Row ${index + 2}: Invalid Financing_Type "${financingType}". Must be "Buget" or "Taxa"`);
        return;
      }

      // Validate student status
      if (studentStatus && !['Activ', 'Suspendat', 'Exmatriculat'].includes(studentStatus)) {
        errors.push(`Row ${index + 2}: Invalid Student_Status "${studentStatus}". Must be "Activ", "Suspendat", or "Exmatriculat"`);
        return;
      }

      // Find group by name or ID, or pass group name for backend to create
      let groupId: number | undefined;
      let groupName: string | undefined;
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

      // If group not found, pass group name to backend for auto-creation
      if (!groupId) {
        groupName = groupIdentifierStr;
        console.log(`Group "${groupName}" not found, will be auto-created during import`);
      }

      studentsToImport.push({
        id: 0,
        name: String(name).trim(),
        email: String(email).trim(),
        group_id: groupId,
        group_name: groupName,
        start_year: startYear ? Number(startYear) : undefined,
        study_cycle: studyCycle as StudyCycle,
        study_year: studyYear ? Number(studyYear) : 1,
        financing_type: financingType as 'Buget' | 'Taxa',
        student_status: studentStatus as 'Activ' | 'Suspendat' | 'Exmatriculat'
      });
    });

    console.log('Students to import:', studentsToImport);
    console.log('Errors:', errors);

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
      this.alertService.warning('Nu sau gasit studenti pentru import.');
      return;
    }

    // Import students - automatically skip duplicates, only add new ones
    // Groups will be auto-created if they don't exist
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

  // Autocomplete methods
  clearSearchText(): void {
    this.searchText = '';
    this.applyFilters();
  }

  clearGroupFilter(): void {
    this.selectedGroupFilter = null;
    this.groupControl.setValue('');
    this.onGroupFilterChange();
  }

  clearYearFilter(): void {
    this.selectedYearFilter = null;
    this.yearControl.setValue('');
    this.onYearFilterChange();
  }

  clearStudyCycleFilter(): void {
    this.selectedStudyCycleFilter = null;
    this.studyCycleControl.setValue('');
    this.onStudyCycleFilterChange();
  }

  clearStudyYearFilter(): void {
    this.selectedStudyYearFilter = null;
    this.studyYearControl.setValue('');
    this.onStudyYearFilterChange();
  }

  clearFinancingTypeFilter(): void {
    this.selectedFinancingTypeFilter = null;
    this.financingTypeControl.setValue('');
    this.onFinancingTypeFilterChange();
  }

  clearStudentStatusFilter(): void {
    this.selectedStudentStatusFilter = null;
    this.studentStatusControl.setValue('');
    this.onStudentStatusFilterChange();
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedGroupFilter = null;
    this.selectedYearFilter = null;
    this.selectedStudyCycleFilter = null;
    this.selectedStudyYearFilter = null;
    this.selectedFinancingTypeFilter = null;
    this.selectedStudentStatusFilter = null;
    this.groupControl.setValue('');
    this.yearControl.setValue('');
    this.studyCycleControl.setValue('');
    this.studyYearControl.setValue('');
    this.financingTypeControl.setValue('');
    this.studentStatusControl.setValue('');
    this.applyFilters();
  }

  displayGroupName(group: StudentGroup): string {
    return group && group.name ? group.name : '';
  }

  displayYear(year: number): string {
    return year ? year.toString() : '';
  }

  displayStudyCycle(cycle: StudyCycle | null): string {
    return cycle || '';
  }

  displayStudyYear(year: number): string {
    return year ? year.toString() : '';
  }

  displayFinancingType(type: string): string {
    return type || '';
  }

  displayStudentStatus(status: string): string {
    return status || '';
  }

  onGroupSelected(group: StudentGroup | null): void {
    if (group && group.id) {
      this.selectedGroupFilter = group.id;
    } else {
      this.selectedGroupFilter = null;
    }
    this.onGroupFilterChange();
  }

  onYearSelected(year: number | null): void {
    this.selectedYearFilter = year;
    this.onYearFilterChange();
  }

  onStudyCycleSelected(cycle: StudyCycle | null): void {
    this.selectedStudyCycleFilter = cycle;
    this.onStudyCycleFilterChange();
  }

  onStudyYearSelected(year: number | null): void {
    this.selectedStudyYearFilter = year;
    this.onStudyYearFilterChange();
  }

  onFinancingTypeSelected(type: string | null): void {
    this.selectedFinancingTypeFilter = type;
    this.onFinancingTypeFilterChange();
  }

  onStudentStatusSelected(status: string | null): void {
    this.selectedStudentStatusFilter = status;
    this.onStudentStatusFilterChange();
  }
}
