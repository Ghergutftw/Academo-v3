import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';
import {StudyGroupService} from '../../shared/services/study-group.service';
import {StudentGroupsService} from '../../shared/services/student-groups.service';
import {StudentGroup} from '../../shared/models/student-groups.model';
import {CoursesService} from '../../shared/services/courses.service';
import {Course as ServiceCourse} from '../../shared/models/course.model';
import {StudentsService} from '../../shared/services/students.service';
import {StudyGroup} from '../../shared/models/study-group.model';
import {Student} from '../../shared/models/student.model';
import {StudyCycle} from '../../shared/models/study-cycle.enum';
import {StudyGroupModalComponent} from './modal/study-group-modal.component';
import { AlertService } from '../../shared/services/alert.service';

@Component({
  selector: 'app-study-groups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './study-groups.component.html',
  styleUrls: ['./study-groups.component.css']
})
export class StudyGroupsComponent implements OnInit {
  studyGroups: StudyGroup[] = [];
  courses: ServiceCourse[] = [];
  students: Student[] = [];
  filteredStudyGroups: StudyGroup[] = [];
  studentGroups: StudentGroup[] = [];

  selectedCourseId: number | null = null;
  selectedGroupId: number | null = null;
  selectedAdminGroupId: number | null = null;
  selectedStudyCycle: StudyCycle | null = null;
  selectedYear: number | null = null;
  selectedSemester: number | null = null;
  availableYears: number[] = [];
  filteredGroups: StudentGroup[] = [];
  groupStudents: Student[] = [];
  availableStudents: Student[] = [];
  filteredAvailableStudents: Student[] = [];
  studentSearchText: string = '';
  studentCountsMap: { [groupId: number]: number } = {};

  // Form for creating/editing study groups
  showGroupForm = false;
  editingGroup: StudyGroup | null = null;
  groupForm = {
    name: '',
    course_id: 0,
    lab_day: null,
    lab_hour: null
  };

  constructor(
    private studyGroupService: StudyGroupService,
    private coursesService: CoursesService,
    private studentsService: StudentsService,
    private groupsService: StudentGroupsService,
    private modalService: NgbModal,
    private alertService: AlertService
  ) {
  }

  ngOnInit() {
    this.loadCourses();
    this.loadStudyGroups();
    this.loadStudents();
    this.loadStudentGroups();
  }

  loadCourses() {
    this.coursesService.getAll().subscribe({
      next: (courses) => {
        this.courses = courses;
      },
      error: (error) => console.error('Error loading courses:', error)
    });
  }

  loadStudyGroups() {
    this.studyGroupService.getAll().subscribe({
      next: (response) => {
        this.studyGroups = response.data;
        this.filterGroups();
        this.loadStudentCounts();
      },
      error: (error) => console.error('Error loading study groups:', error)
    });
  }

  loadStudents() {
    this.studentsService.getAll().subscribe({
      next: (students) => {
        this.students = students;
      },
      error: (error) => console.error('Error loading students:', error)
    });
  }

  loadStudentGroups() {
    this.groupsService.getAll().subscribe({
      next: (groups) => {
        this.studentGroups = groups;
      },
      error: (error) => console.error('Error loading administrative groups:', error)
    });
  }

  filterGroups() {
    this.filteredStudyGroups = this.studyGroups.filter(g => {
      const course = this.courses.find(c => c.id === g.course_id);
      if (!course) return false;
      // Filtru program de studiu (ciclu)
      if (this.selectedStudyCycle === StudyCycle.LICENTA && (course.year < 1 || course.year > 4)) {
        return false;
      }
      if (this.selectedStudyCycle === StudyCycle.MASTER && (course.year < 5 || course.year > 6)) {
        return false;
      }
      // Filtru an - pentru Master, trebuie să mapez: Master An 1 -> year 5, Master An 2 -> year 6
      if (this.selectedYear) {
        if (this.selectedStudyCycle === StudyCycle.MASTER) {
          const masterYear = this.selectedYear + 4; // Master year 1 = course year 5, etc.
          if (course.year !== masterYear) {
            return false;
          }
        } else {
          if (course.year !== this.selectedYear) {
            return false;
          }
        }
      }
      // Filtru semestru
      if (this.selectedSemester && course.semester !== this.selectedSemester) {
        return false;
      }
      // Filtru materie
      if (this.selectedCourseId && g.course_id !== this.selectedCourseId) {
        return false;
      }
      return true;
    });
    // Nu mai e nevoie de applyGroupFilters pentru filteredStudyGroups
  }

  applyGroupFilters() {
    this.filteredGroups = this.studentGroups;

    if (this.selectedStudyCycle) {
      // Filter groups by study cycle based on year range
      this.filteredGroups = this.filteredGroups.filter(g => {
        if (this.selectedStudyCycle === 'Licenta') {
          return g.year && g.year >= 1 && g.year <= 4;
        } else {
          return g.year && g.year >= 1 && g.year <= 2;
        }
      });
    }

    if (this.selectedYear) {
      this.filteredGroups = this.filteredGroups.filter(g => g.year === this.selectedYear);
    }
  }

  onStudyCycleChange() {
    if (this.selectedStudyCycle === StudyCycle.LICENTA) {
      this.availableYears = [1, 2, 3, 4];
    } else if (this.selectedStudyCycle === StudyCycle.MASTER) {
      this.availableYears = [1, 2];
    } else {
      this.availableYears = [];
    }
    this.selectedYear = null;
    this.selectedCourseId = null;
    this.selectedAdminGroupId = null;
    this.filterGroups();
    this.applyGroupFilters();
  }

  onYearChange() {
    this.selectedCourseId = null;
    this.selectedAdminGroupId = null;
    this.filterGroups();
    this.applyGroupFilters();
  }

  onCourseChange() {
    this.filterGroups();
    // Reset child filter
    this.selectedAdminGroupId = null;
    this.selectedGroupId = null;
    this.groupStudents = [];
  }

  onGroupSelect(groupId: number) {
    this.selectedGroupId = groupId;
    this.loadGroupStudents(groupId);
  }

  loadGroupStudents(groupId: number) {
    this.studyGroupService.getStudents(groupId).subscribe({
      next: (response) => {
        this.groupStudents = response.data as any[];
        this.updateAvailableStudents();
      },
      error: (error) => console.error('Error loading group students:', error)
    });
  }

  updateAvailableStudents() {
    const groupStudentIds = this.groupStudents.map(s => s.id);

    // Get the selected group's course year
    const selectedGroup = this.studyGroups.find(g => g.id === this.selectedGroupId);
    const courseYear = selectedGroup ? this.courses.find(c => c.id === selectedGroup.course_id)?.year : null;

    // Filter students by: not already in group AND same study year as course AND same study cycle
    this.availableStudents = this.students.filter(
      s => !groupStudentIds.includes(s.id) &&
        (courseYear === null || s.study_year === courseYear) &&
        (this.selectedStudyCycle === null || s.study_cycle === this.selectedStudyCycle)
    );
    this.studentSearchText = '';
    this.filteredAvailableStudents = [...this.availableStudents];
  }

  openGroupForm(group?: StudyGroup) {
    const modalRef = this.modalService.open(StudyGroupModalComponent, { size: 'lg' });
    modalRef.componentInstance.mode = group ? 'edit' : 'add';
    modalRef.componentInstance.group = group;
    modalRef.componentInstance.courses = this.courses;
    modalRef.componentInstance.studyGroups = this.studyGroups;
    // Transmite materia selectată în modal
    if (!group && this.selectedCourseId) {
      modalRef.componentInstance.courseId = this.selectedCourseId;
    }

    modalRef.result.then((result: any) => {
      if (result) {
        if (group) {
          // Update existing group
          const updateData = {
            id: group.id!,
            name: result.name,
            course_id: result.course_id,
            lab_day: result.lab_day,
            lab_hour: result.lab_hour
          };
          this.studyGroupService.update(updateData).subscribe({
            next: () => {
              this.loadStudyGroups();
            },
            error: (error) => {
              console.error('Error updating group:', error);
              alert('Eroare la actualizarea grupei');
            }
          });
        } else {
          // Create new group
          this.studyGroupService.create(result).subscribe({
            next: () => {
              this.loadStudyGroups();
            },
            error: (error) => {
              console.error('Error creating group:', error);
              alert('Eroare la crearea grupei');
            }
          });
        }
      }
    }).catch(() => {
      // Modal was dismissed
    });
  }

  closeGroupForm() {
    this.showGroupForm = false;
    this.editingGroup = null;
    this.groupForm = {name: '', course_id: 0, lab_day: null, lab_hour: null};
  }

  saveGroup() {
    if (!this.groupForm.name || !this.groupForm.course_id) {
      alert('Nume si materie sunt obligatorii');
      return;
    }

    if (this.editingGroup) {
      // Update existing group
      const updateData = {
        id: this.editingGroup.id!,
        name: this.groupForm.name,
        course_id: this.groupForm.course_id,
        lab_day: this.groupForm.lab_day,
        lab_hour: this.groupForm.lab_hour
      };
      this.studyGroupService.update(updateData).subscribe({
        next: () => {
          this.loadStudyGroups();
          this.closeGroupForm();
        },
        error: (error) => {
          console.error('Error updating group:', error);
          alert('Eroare la actualizarea grupei');
        }
      });
    } else {
      // Create new group
      this.studyGroupService.create(this.groupForm).subscribe({
        next: () => {
          this.loadStudyGroups();
          this.closeGroupForm();
        },
        error: (error) => {
          console.error('Error creating group:', error);
          alert('Eroare la crearea grupei');
        }
      });
    }
  }

  deleteGroup(group: StudyGroup) {
    if (confirm(`Sigur vrei să ștergi grupa "${group.name}"?`)) {
      this.studyGroupService.delete(group.id!).subscribe({
        next: () => {
          this.loadStudyGroups();
          if (this.selectedGroupId === group.id) {
            this.selectedGroupId = null;
            this.groupStudents = [];
          }
        },
        error: (error) => {
          console.error('Error deleting group:', error);
          alert('Eroare la ștergerea grupei');
        }
      });
    }
  }

  addStudentToGroup(studentId: number) {
    if (!this.selectedGroupId) return;

    const currentIds = this.groupStudents.map(s => s.id);
    const newIds = [...currentIds, studentId];

    this.studyGroupService.updateMembers(this.selectedGroupId, newIds).subscribe({
      next: () => {
        this.loadGroupStudents(this.selectedGroupId!);
        // Actualizează contorul imediat
        this.studentCountsMap[this.selectedGroupId!] = newIds.length;
        // Nu mai afișa alert custom la succes
      },
      error: () => {
        alert('Eroare la adăugarea studentului');
      }
    });
  }

  removeStudentFromGroup(studentId: number) {
    if (!this.selectedGroupId) return;

    const newIds = this.groupStudents
      .filter(s => s.id !== studentId)
      .map(s => s.id);

    this.studyGroupService.updateMembers(this.selectedGroupId, newIds).subscribe({
      next: () => {
        this.loadGroupStudents(this.selectedGroupId!);
        // Actualizează contorul imediat
        this.studentCountsMap[this.selectedGroupId!] = newIds.length;
        // Nu mai afișa alert custom la succes
      },
      error: () => {
        alert('Eroare la eliminarea studentului');
      }
    });
  }

  // Create a study group for the selected course from an administrative group (and import its members)
  createStudyGroupFromAdminGroup(courseId: number, adminGroupId: number) {
    if (!courseId || !adminGroupId) return;
    this.studyGroupService.createFromGroup(courseId, adminGroupId).subscribe({
      next: () => {
        this.loadStudyGroups();
        if (this.selectedCourseId === courseId) {
          this.filterGroups();
        }
      },
      error: (error) => {
        console.error('Error creating study group from administrative group:', error);
        alert('Eroare la crearea pseudo-grupei din grupa administrativă');
      }
    });
  }

  getCourseName(courseId: number): string {
    const course = this.courses.find(c => c.id === courseId);
    return course ? course.name || '' : '';
  }

  getCourseType(courseId: number): string {
    const course = this.courses.find(c => c.id === courseId);
    return course?.is_optional ? 'Opțională' : 'Obligatorie';
  }

  // Courses filtered by selected year
  getCoursesFilteredByYear(): ServiceCourse[] {
    if (!this.selectedYear) {
      return this.courses;
    }
    // For Master, map study year to course year (Master year 1 = course year 5, etc.)
    const courseYear = this.selectedStudyCycle === StudyCycle.MASTER ? this.selectedYear + 4 : this.selectedYear;
    return this.courses.filter(c => c.year === courseYear);
  }

  // Courses filtered by selected year and semester
  getCoursesFilteredByYearAndSemester(): ServiceCourse[] {
    let filtered = this.courses;
    if (this.selectedYear) {
      // For Master, map study year to course year
      const courseYear = this.selectedStudyCycle === StudyCycle.MASTER ? this.selectedYear + 4 : this.selectedYear;
      filtered = filtered.filter(c => c.year === courseYear);
    }
    if (this.selectedSemester) {
      filtered = filtered.filter(c => c.semester === this.selectedSemester);
    }
    return filtered;
  }

  // Check if selected course is obligatory (not optional)
  isObligatoryCourse(): boolean {
    if (!this.selectedCourseId) return false;
    const course = this.courses.find(c => c.id === this.selectedCourseId);
    return course ? !course.is_optional : false;
  }

  // Check if both obligatory course AND admin group are selected
  isObligatoryAndAdminGroupSelected(): boolean {
    return this.isObligatoryCourse() && this.selectedAdminGroupId !== null;
  }

  // Add all students from selected administrative group to selected study group
  // This is used for MANDATORY courses where all students must be enrolled
  addAllStudentsFromAdminGroup() {
    if (!this.selectedGroupId || !this.selectedAdminGroupId || !this.isObligatoryCourse()) {
      alert('Selectează o grupă de studiu, o grupă administrativă și asigură-te că materia este obligatorie');
      return;
    }

    // Get all students from the administrative group
    const studentsFromAdminGroup = this.students.filter(s => s.group_id === this.selectedAdminGroupId);

    if (studentsFromAdminGroup.length === 0) {
      alert('Nu există studenți în grupa administrativă selectată');
      return;
    }

    // Get current student IDs in the study group
    const currentIds = this.groupStudents.map(s => s.id);

    // Add all students from admin group (avoiding duplicates)
    const allStudentIds = [...new Set([...currentIds, ...studentsFromAdminGroup.map(s => s.id)])];

    this.studyGroupService.updateMembers(this.selectedGroupId, allStudentIds).subscribe({
      next: () => {
        this.loadGroupStudents(this.selectedGroupId!);
        alert(`${studentsFromAdminGroup.length} studenți au fost adăugați la grupă`);
      },
      error: (error) => {
        console.error('Error adding all students:', error);
        alert('Eroare la adăugarea studenților');
      }
    });
  }

  onSemesterChange() {
    this.selectedCourseId = null;
    this.selectedAdminGroupId = null;
    this.filterGroups();
  }

  resetFilters() {
    this.selectedStudyCycle = null;
    this.selectedYear = null;
    this.selectedSemester = null;
    this.selectedCourseId = null;
    this.selectedAdminGroupId = null;
    this.selectedGroupId = null;
    this.groupStudents = [];
    this.availableYears = [];
    this.filterGroups();
  }

  getStudentsCountForAdminGroup(adminGroupId: number): number {
    return this.students.filter(s => s.group_id === adminGroupId).length;
  }

  getStudentCountForGroup(groupId: number): number {
    return this.studentCountsMap[groupId] ?? 0;
  }

  getSelectedGroupName(): string {
    const g = this.studyGroups.find(g => g.id === this.selectedGroupId);
    return g?.name || '';
  }

  filterAvailableStudents(): void {
    const q = (this.studentSearchText || '').toLowerCase();
    this.filteredAvailableStudents = this.availableStudents.filter(s =>
      !q || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.group_name?.toLowerCase().includes(q)
    );
  }


  loadStudentCounts(): void {
    this.studyGroups.forEach(g => {
      if (g.id) {
        this.studyGroupService.getStudents(g.id).subscribe({
          next: (res) => { this.studentCountsMap[g.id!] = res.data?.length ?? 0; },
          error: () => {}
        });
      }
    });
  }

  onExcelImport(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (!this.selectedGroupId) {
      alert('Selectează mai întâi o grupă de studiu');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        if (file.name.endsWith('.csv')) {
          const data = e.target.result;
          const lines = data.split('\n').filter((line: string) => line.trim());
          this.processStudentData(lines);
        } else {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const lines: string[] = rows.map(row => {
            if (Array.isArray(row)) {
              return row.filter(cell => cell !== null && cell !== undefined && cell !== '').join(' ');
            }
            return '';
          }).filter(line => line.trim());

          this.processStudentData(lines);
        }
      } catch (error) {
        alert('Eroare la parsarea fișierului');
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  processStudentData(lines: string[]): void {
    if (!this.selectedGroupId) return;

    const studentsToAdd: number[] = [];
    const notFoundEmails: string[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      if (index === 0 && (trimmedLine.toLowerCase().includes('email') || trimmedLine.toLowerCase().includes('nume'))) {
        return;
      }

      const emailMatch = trimmedLine.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
      if (!emailMatch) {
        notFoundEmails.push(trimmedLine);
        return;
      }

      const email = emailMatch[0].toLowerCase();
      const student = this.availableStudents.find(s => s.email?.toLowerCase() === email);

      if (student) {
        if (!studentsToAdd.includes(student.id)) {
          studentsToAdd.push(student.id);
        }
      } else {
        notFoundEmails.push(email);
      }
    });

    if (studentsToAdd.length === 0) {
      this.alertService.error('Nu au fost găsiți studenți care să corespundă cu datele din fișier');
      return;
    }

    const currentIds = this.groupStudents.map(s => s.id);
    const allIds = [...new Set([...currentIds, ...studentsToAdd])];

    this.studyGroupService.updateMembers(this.selectedGroupId, allIds).subscribe({
      next: () => {
        this.loadGroupStudents(this.selectedGroupId!);
        // Actualizează contorul imediat
        this.studentCountsMap[this.selectedGroupId!] = allIds.length;
        let message = `${studentsToAdd.length} studenți au fost adăugați cu succes!`;
        if (notFoundEmails.length > 0) {
          message += `\n\n${notFoundEmails.length} email-uri/linii nu au fost găsite:\n${notFoundEmails.slice(0, 5).join('\n')}${notFoundEmails.length > 5 ? '\n...' : ''}`;
        }
        this.alertService.success(message);
      },
      error: () => {
        this.alertService.error('Eroare la adăugarea studenților');
      }
    });
  }

}
