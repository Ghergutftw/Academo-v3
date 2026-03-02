import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../../shared/services/auth.service';
import {environment} from '../../../environments/environment';
import {LaboratoryService} from '../../../shared/services/laboratory.service';
import {StudentsService} from '../../../shared/services/students.service';
import {CoursesService} from '../../../shared/services/courses.service';
import {SessionService} from '../../../shared/services/session.service';
import {AttendanceService} from '../../../shared/services/attendance.service';
import {StudyGroupService} from '../../../shared/services/study-group.service';
import {Course} from '../../../shared/models/course.model';
import {StudentGroup} from '../../../shared/models/student-groups.model';
import {Session} from '../../../shared/models/session.model';
import {Laboratory} from '../../../shared/models/laboratory.model';
import {Student} from '../../../shared/models/student.model';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.css']
})
export class TeacherDashboardComponent implements OnInit {
  currentUser: any;
  courses: Course[] = [];
  groups: StudentGroup[] = [];
  laboratories: Laboratory[] = [];
  selectedCourse: Course | null = null;
  selectedGroup: StudentGroup | null = null;
  selectedLaboratory: Laboratory | null = null;
  selectedDate: string = new Date().toISOString().split('T')[0];
  minDate: string = new Date().toISOString().split('T')[0];
  students: Student[] = [];
  attendance: { [studentId: number]: boolean } = {};
  sessions: Session[] = [];
  loading: boolean = false;
  error: string = '';
  MAX_LABORATORIES = 14;

  // Additional students from other groups
  allStudents: Student[] = [];
  additionalStudents: Student[] = [];
  showAddStudentModal: boolean = false;
  searchStudentText: string = '';
  filteredStudents: Student[] = [];

  constructor(
    public authService: AuthService,
    private studentsService: StudentsService,
    private coursesService: CoursesService,
    private sessionService: SessionService,
    private attendanceService: AttendanceService,
    private laboratoryService: LaboratoryService,
    private studyGroupService: StudyGroupService
  ) {
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadCourses();
    this.loadAllStudents();
  }

  loadAllStudents(): void {
    // Load all students for the add student functionality
    this.studentsService.getAll().subscribe({
      next: (students) => {
        this.allStudents = students;
      },
      error: (error) => {
        console.error('Failed to load all students:', error);
      }
    });
  }

  loadCourses(): void {
    this.coursesService.getByTeacher(this.currentUser.user_type_id).subscribe({
      next: (courses) => {
        this.courses = courses;
        if (this.courses.length === 0) {
          this.error = 'No courses assigned to you yet. Please contact an administrator.';
        }
      },
      error: (error) => {
        this.error = 'Failed to load courses';
        console.error(error);
      }
    });
  }

  loadGroupsForCourse(): void {
    if (!this.selectedCourse) return;

    // Load laboratories for this course
    this.laboratoryService.getByCourse(this.selectedCourse.id).subscribe({
      next: (labs) => {
        this.laboratories = labs;
      },
      error: (error) => {
        console.error('Failed to load laboratories:', error);
      }
    });

    // Load study groups for this course
    this.studyGroupService.getByCourse(this.selectedCourse!.id).subscribe({
      next: (studyGroups) => {
        // Map study groups to Group interface
        this.groups = studyGroups.map(sg => ({
          id: sg.id,
          name: sg.name || '',
          year: undefined
        }));
      },
      error: (error) => {
        console.error('Failed to load study groups:', error);
        this.groups = [];
      }
    });
  }

  loadStudentsForGroup(): void {
    if (!this.selectedGroup || !this.selectedCourse) return;

    this.loading = true;
    // Use study_group_id since selectedGroup is actually a study group
    this.studentsService.getByStudyGroup(this.selectedGroup!.id).subscribe({
      next: (students) => {
        this.students = [...students, ...this.additionalStudents];
        // Initialize attendance as checked (present) for all students
        this.students.forEach(s => {
          this.attendance[s.id] = true;
        });
        this.loading = false;
        this.loadExistingSessions();
      },
      error: (error) => {
        this.error = 'Failed to load students';
        this.loading = false;
      }
    });
  }

  loadExistingSessions(): void {
    if (!this.selectedCourse || !this.selectedGroup) return;

    this.sessionService.getByCourse(this.selectedCourse.id).subscribe({
      next: (sessions) => {
        // Filter sessions for this specific study group
        this.sessions = sessions.filter(s => s.study_group_id === this.selectedGroup!.id);
      }
    });
  }

  isLabCompleted(labNumber: number): boolean {
    return this.sessions.some(s => s.laboratory_number === labNumber);
  }

  createSession(): void {
    if (!this.selectedCourse || !this.selectedGroup || !this.selectedDate || !this.selectedLaboratory) {
      this.error = 'Please select course, group, laboratory, and date';
      return;
    }

    if (this.isLabCompleted(this.selectedLaboratory.lab_number)) {
      this.error = `Laboratory ${this.selectedLaboratory.lab_number} has already been completed for this group!`;
      return;
    }

    this.loading = true;
    const sessionData = {
      course_id: this.selectedCourse.id,
      study_group_id: this.selectedGroup.id,
      laboratory_number: this.selectedLaboratory.lab_number,
      session_date: this.selectedDate
    };

    this.sessionService.create(sessionData).subscribe({
      next: (response) => {
        this.markAttendance(response.id);
      },
      error: (error) => {
        this.error = 'Failed to create session';
        this.loading = false;
      }
    });
  }

  markAttendance(sessionId: number): void {
    if (this.students.length === 0 && this.additionalStudents.length === 0) {
      this.loading = false;
      return;
    }

    // Convert boolean checkboxes to status strings (includes both group students and additional students)
    const records = this.students.map(student => ({
      student_id: student.id,
      status: this.attendance[student.id] ? 'present' : 'absent'
    }));

    const attendanceData = {
      session_id: sessionId,
      records: records
    };

    this.attendanceService.save(attendanceData).subscribe({
      next: () => {
        this.loading = false;
        this.error = '';
        alert(`Prezența pentru laboratorul ${this.selectedLaboratory!.lab_number} a fost înregistrată cu succes!`);
        this.resetForm();
        this.loadExistingSessions();
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Failed to record attendance';
        console.error(error);
      }
    });
  }

  onCourseChange(): void {
    this.selectedGroup = null;
    this.selectedLaboratory = null;
    this.students = [];
    this.attendance = {};
    this.sessions = [];
    this.laboratories = [];
    this.loadGroupsForCourse();
  }

  onGroupChange(): void {
    this.students = [];
    this.attendance = {};
    this.selectedLaboratory = null;
    this.additionalStudents = [];
    this.loadStudentsForGroup();
  }

  resetForm(): void {
    this.selectedLaboratory = null;
    this.attendance = {};
    this.students = [];
  }

  selectAllStudents(): void {
    this.students.forEach(s => {
      this.attendance[s.id] = true;
    });
  }

  deselectAllStudents(): void {
    this.students.forEach(s => {
      this.attendance[s.id] = false;
    });
  }

  openAddStudentModal(): void {
    this.showAddStudentModal = true;
    this.searchStudentText = '';
    this.updateFilteredStudents();
  }

  closeAddStudentModal(): void {
    this.showAddStudentModal = false;
    this.searchStudentText = '';
    this.filteredStudents = [];
  }

  updateFilteredStudents(): void {
    const searchLower = this.searchStudentText.toLowerCase();
    const currentStudentIds = this.students.map(s => s.id);

    this.filteredStudents = this.allStudents.filter(student => {
      if (currentStudentIds.includes(student.id)) {
        return false;
      }
      if (searchLower) {
        const name = student.name || '';
        const email = student.email || '';
        return name.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }

  addStudentToSession(student: Student): void {
    if (this.students.find(s => s.id === student.id)) {
      return;
    }
    this.additionalStudents.push(student);
    this.students.push(student);
    this.attendance[student.id] = true;
    this.updateFilteredStudents();
  }

  removeAdditionalStudent(studentId: number): void {
    this.additionalStudents = this.additionalStudents.filter(s => s.id !== studentId);
    this.students = this.students.filter(s => s.id !== studentId);
    delete this.attendance[studentId];
    if (this.showAddStudentModal) {
      this.updateFilteredStudents();
    }
  }

  isAdditionalStudent(studentId: number): boolean {
    return this.additionalStudents.some(s => s.id === studentId);
  }

  hasGuestStudents(): boolean {
    return this.additionalStudents.length > 0;
  }
}

