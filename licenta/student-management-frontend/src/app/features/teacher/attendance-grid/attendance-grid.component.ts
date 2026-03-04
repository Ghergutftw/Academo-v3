import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {AuthService} from '../../../shared/services/auth.service';
import {CoursesService} from '../../../shared/services/courses.service';
import {Course} from '../../../shared/models/course.model';
import {LaboratoryService} from '../../../shared/services/laboratory.service';
import {StudyGroupService} from '../../../shared/services/study-group.service';
import {Session, SessionService} from '../../../shared/services/session.service';
import {AttendanceRecord, AttendanceService} from '../../../shared/services/attendance.service';
import {StudentGroupsService} from '../../../shared/services/student-groups.service';
import {StudentGroup} from '../../../shared/models/student-groups.model';
import {StudyGroup, GroupOrStudyGroup} from '../../../shared/models/study-group.model';
import {Student} from '../../../shared/models/student.model';
import {Laboratory} from '../../../shared/models/laboratory.model';
import {firstValueFrom} from 'rxjs';


@Component({
  selector: 'app-attendance-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatTooltipModule],
  templateUrl: './attendance-grid.component.html',
  styleUrls: ['./attendance-grid.component.css']
})
export class AttendanceGridComponent implements OnInit {
  courses: Course[] = [];
  groups: StudentGroup[] = [];
  studyGroups: StudyGroup[] = [];
  displayGroups: GroupOrStudyGroup[] = [];
  students: Student[] = [];
  laboratories: Laboratory[] = [];
  sessions: Session[] = [];

  // Track pending, unsaved changes
  pendingChanges: { [studentId: number]: { [labNumber: number]: string } } = {};
  hasPending = false;

  // Snapshot for comparison to detect if a cell is actually changed
  originalGrid: {
    [studentId: number]: {
      [labNumber: number]: { session_id: number | null, status: string, exists: boolean }
    } | undefined
  } = {};

  selectedCourse: Course | null = null;
  selectedGroup: GroupOrStudyGroup | null = null;
  isMandatoryCourse: boolean = false;

  // Grid data: attendanceGrid[student_id][lab_number] = {session_id, status, exists}
  attendanceGrid: {
    [studentId: number]: {
      [labNumber: number]: { session_id: number | null, status: string, exists: boolean }
    } | undefined
  } = {};

  loading = false;
  saving = false;
  error = '';
  success = '';

  constructor(
    private authService: AuthService,
    private coursesService: CoursesService,
    private laboratoryService: LaboratoryService,
    private studyGroupService: StudyGroupService,
    private sessionService: SessionService,
    private attendanceService: AttendanceService,
    private groupsService: StudentGroupsService
  ) {
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  // Export în Excel
  exportToExcel(): void {
    if (!this.selectedCourse || !this.selectedGroup || this.students.length === 0) {
      this.error = 'Nu există date de exportat!';
      return;
    }

    // Prepară datele pentru export
    const exportData = {
      course_id: this.selectedCourse.id,
      course_name: this.selectedCourse.name,
      group_id: this.selectedGroup.id,
      group_name: this.selectedGroup.name,
      is_mandatory_course: this.isMandatoryCourse,
      students: this.students.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        attendance: this.getStudentAttendanceData(student.id)
      }))
    };

    console.log('Date pentru export:', exportData);

    this.attendanceService.exportToExcel(exportData).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.error = 'Nu s-a primit niciun fișier de la server';
          return;
        }
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `prezenta_${this.selectedCourse?.name?.replace(/\s+/g, '_')}_${this.selectedGroup?.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.success = 'Fișierul Excel a fost generat și descărcat cu succes!';
        console.log('Download completat cu succes');
      },
      error: (error) => {
        let errorMessage = 'A apărut o eroare la generarea fișierului Excel.';
        if (error.status === 0) {
          errorMessage = 'Nu se poate conecta la server. Verifică că WAMP este pornit.';
        } else if (error.status === 404) {
          errorMessage = 'API-ul de export nu a fost găsit (404).';
        } else if (error.status === 500) {
          errorMessage = 'Eroare internă de server (500).';
        }
        this.error = errorMessage;
      }
    });
  }

  loadCourses(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.loading = true;
    this.coursesService.getByTeacher(currentUser.user_type_id).subscribe({
      next: (courses) => {
        this.courses = courses;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load courses';
        this.loading = false;
        console.error(error);
      }
    });
  }

  onCourseChange(): void {
    this.selectedGroup = null;
    this.students = [];
    this.laboratories = [];
    this.sessions = [];
    this.attendanceGrid = {};
    this.pendingChanges = {};
    this.hasPending = false;
    this.originalGrid = {};
    this.error = '';
    this.success = '';
    this.displayGroups = [];

    if (this.selectedCourse) {
      this.isMandatoryCourse = !this.selectedCourse.is_optional;

      if (this.isMandatoryCourse) {
        this.loadRegularGroups();
      } else {
        this.loadStudyGroups();
      }

      this.loadLaboratories();
    }
  }

  loadRegularGroups(): void {
    this.groupsService.getAll().subscribe({
      next: (groups) => {
        // Filter to only groups matching the course's academic year if provided
        const filtered = this.selectedCourse?.year
          ? groups.filter(g => (g.year ?? null) === this.selectedCourse!.year)
          : groups;
        this.groups = filtered;
        this.displayGroups = filtered.map(g => ({
          id: g.id,
          name: g.name,
          isRegularGroup: true
        }));
      },
      error: (error) => {
        console.error('Failed to load groups:', error);
      }
    });
  }

  loadStudyGroups(): void {
    if (!this.selectedCourse || !this.selectedCourse.id) return;

    this.studyGroupService.getByCourse(this.selectedCourse.id).subscribe({
      next: (groups) => {
        this.studyGroups = groups;
        this.displayGroups = groups.map(g => ({
          id: g.id,
          name: g.name,
          isRegularGroup: false
        }));
      },
      error: (error) => {
        console.error('Failed to load study groups:', error);
      }
    });
  }

  loadLaboratories(): void {
    if (!this.selectedCourse || !this.selectedCourse.id) return;

    this.laboratoryService.getByCourse(this.selectedCourse.id).subscribe({
      next: (labs) => {
        this.laboratories = labs.sort((a, b) => a.lab_number - b.lab_number);
      },
      error: (error) => {
        console.error('Failed to load laboratories:', error);
      }
    });
  }

  onGroupChange(): void {
    this.students = [];
    this.sessions = [];
    this.attendanceGrid = {};
    this.pendingChanges = {};
    this.hasPending = false;
    this.originalGrid = {};
    this.error = '';
    this.success = '';

    if (this.selectedGroup) {
      if (this.selectedGroup.isRegularGroup && this.selectedCourse?.id) {
        // For mandatory courses, create/get study group from regular group
        this.createStudyGroupFromRegularGroup();
      } else {
        // For optional courses, proceed normally
        this.loadStudents();
        this.loadSessions();
      }
    }
  }

  createStudyGroupFromRegularGroup(): void {
    if (!this.selectedCourse?.id || !this.selectedGroup?.id) return;

    this.loading = true;
    this.studyGroupService.createFromGroup(this.selectedCourse.id, this.selectedGroup.id).subscribe({
      next: (response) => {
        // Update the displayGroups to include the study group
        const updatedGroup = {
          id: response.id,
          name: response.name,
          isRegularGroup: false
        };

        // Find and update the group in displayGroups
        const existingIndex = this.displayGroups.findIndex(g => g.id === this.selectedGroup?.id && g.isRegularGroup);
        if (existingIndex !== -1) {
          this.displayGroups[existingIndex] = updatedGroup;
        }

        // Update selected group to point to the same reference
        this.selectedGroup = this.displayGroups[existingIndex] || updatedGroup;

        this.loadStudents();
        this.loadSessions();
      },
      error: (error) => {
        this.error = 'Failed to create study group for this course and group';
        this.loading = false;
        console.error(error);
      }
    });
  }

  loadStudents(): void {
    if (!this.selectedGroup) return;

    this.loading = true;

    // Always use study group members since we convert regular groups to study groups
    this.studyGroupService.getMembers(this.selectedGroup.id).subscribe({
      next: (students) => {
        this.students = students.sort((a, b) => a.name.localeCompare(b.name));
        this.initializeGrid();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load students';
        this.loading = false;
        console.error(error);
      }
    });
  }

  loadSessions(): void {
    if (!this.selectedCourse || !this.selectedCourse.id || !this.selectedGroup) return;

    this.sessionService.getByCourse(this.selectedCourse.id).subscribe({
      next: (allSessions) => {
        // Filter sessions for selected group (now always a study group)
        this.sessions = allSessions.filter(s => s.study_group_id === this.selectedGroup!.id);
        this.loadAttendanceForSessions();
      },
      error: (error) => {
        console.error('Failed to load sessions:', error);
      }
    });
  }

  loadAttendanceForSessions(): void {
    if (this.sessions.length === 0) return;

    const sessionIds = this.sessions.map(s => s.id);
    this.attendanceService.getBySessions(sessionIds).subscribe({
      next: (records) => {
        this.populateGridWithAttendance(records);
      },
      error: (error) => {
        console.error('Failed to load attendance:', error);
      }
    });
  }

  initializeGrid(): void {
    // Initialize empty grid
    this.students.forEach(student => {
      this.attendanceGrid[student.id] = {};
      for (let labNum = 1; labNum <= 14; labNum++) {
        const studentGrid = this.attendanceGrid[student.id];
        if (studentGrid) {
          studentGrid[labNum] = {
            session_id: null,
            status: 'absent',
            exists: false
          };
        }
      }
    });
  }

  populateGridWithAttendance(records: AttendanceRecord[]): void {
    // Map session IDs to lab numbers
    const sessionToLab: { [sessionId: number]: number } = {};
    this.sessions.forEach(session => {
      sessionToLab[session.id] = session.laboratory_number;
    });

    // Fill grid with attendance data
    records.forEach(record => {
      const labNumber = sessionToLab[record.session_id];
      const studentGrid = this.attendanceGrid[record.student_id];
      if (labNumber && studentGrid) {
        studentGrid[labNumber] = {
          session_id: record.session_id,
          status: record.status,
          exists: true
        };
      }
    });

    // Snapshot original grid after load to detect future changes
    this.originalGrid = JSON.parse(JSON.stringify(this.attendanceGrid));
  }

  toggleAttendance(studentId: number, labNumber: number): void {
    const studentGrid = this.attendanceGrid[studentId];
    if (!studentGrid) return;

    const cell = studentGrid[labNumber];
    if (!cell) return;

    // Toggle status
    if (cell.status === 'present') {
      cell.status = 'absent';
    } else {
      cell.status = 'present';
    }
    // Mark as locally changed; session will be created on save if missing
    cell.exists = true;

    // Track as pending change; if equals original, remove from pending
    const original = this.originalGrid?.[studentId]?.[labNumber]?.status || 'absent';
    if (!this.pendingChanges[studentId]) this.pendingChanges[studentId] = {};
    if (cell.status === original) {
      delete this.pendingChanges[studentId][labNumber];
      if (Object.keys(this.pendingChanges[studentId]).length === 0) {
        delete this.pendingChanges[studentId];
      }
    } else {
      this.pendingChanges[studentId][labNumber] = cell.status;
    }

    this.hasPending = Object.keys(this.pendingChanges).length > 0;
  }

  saveAttendanceCell(studentId: number, sessionId: number, status: string): void {
    this.attendanceService.save({
      session_id: sessionId,
      records: [{student_id: studentId, status: status}]
    }).subscribe({
      next: () => {
        // Success - no notification for individual cells to avoid spam
      },
      error: (error) => {
        this.error = 'Failed to save attendance';
        console.error(error);
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  async createSessionForLab(labNumber: number): Promise<number> {
    if (!this.selectedCourse?.id || !this.selectedGroup?.id) throw new Error('Missing course or group');
    // If it already exists, return its id
    const existing = this.getSessionForLab(labNumber);
    if (existing) return existing.id;

    const payload = {
      course_id: this.selectedCourse.id,
      study_group_id: this.selectedGroup.id,
      laboratory_number: labNumber,
      session_date: new Date().toISOString().slice(0, 10),
      topic: this.getLabTopic(labNumber)
    };
    const res = await firstValueFrom(this.sessionService.create(payload));
    // Push the new session locally
    this.sessions.push({
      id: res.id,
      course_id: this.selectedCourse.id,
      laboratory_number: labNumber,
      study_group_id: this.selectedGroup.id,
      session_date: payload.session_date,
      topic: payload.topic
    } as Session);
    return res.id;
  }

  discardPendingChanges(): void {
    // Restore from snapshot
    this.attendanceGrid = JSON.parse(JSON.stringify(this.originalGrid || {}));
    this.pendingChanges = {};
    this.hasPending = false;
    this.error = '';
    this.success = '';
  }

  async savePendingChanges(): Promise<void> {
    if (!this.selectedCourse || !this.selectedGroup || !this.hasPending) return;

    try {
      this.saving = true;
      // Group by lab number
      const byLab: { [labNumber: number]: { student_id: number; status: string }[] } = {};
      for (const sid of Object.keys(this.pendingChanges)) {
        const studentId = Number(sid);
        for (const labStr of Object.keys(this.pendingChanges[studentId])) {
          const labNumber = Number(labStr);
          if (!byLab[labNumber]) byLab[labNumber] = [];
          byLab[labNumber].push({student_id: studentId, status: this.pendingChanges[studentId][labNumber]});
        }
      }

      // Ensure sessions exist for all labs that have changes
      const labNumbers = Object.keys(byLab).map(n => Number(n));
      const labToSessionId: { [lab: number]: number } = {};
      for (const lab of labNumbers) {
        labToSessionId[lab] = await this.createSessionForLab(lab);
      }

      // Save per session
      for (const lab of labNumbers) {
        const sessionId = labToSessionId[lab];
        const records = byLab[lab];
        await firstValueFrom(this.attendanceService.save({session_id: sessionId, records}));
      }

      // Refresh attendance from server to ensure consistency
      this.loadSessions();

      // Clear pending
      this.pendingChanges = {};
      this.hasPending = false;
      this.success = 'Prezența a fost salvată cu succes.';
      setTimeout(() => this.success = '', 3000);
    } catch (e) {
      console.error(e);
      this.error = 'Nu s-au putut salva modificările de prezență';
      setTimeout(() => this.error = '', 3000);
    } finally {
      this.saving = false;
    }
  }

  getSessionForLab(labNumber: number): Session | undefined {
    return this.sessions.find(s => s.laboratory_number === labNumber);
  }

  getCellClass(studentId: number, labNumber: number): string {
    const cell = this.attendanceGrid[studentId]?.[labNumber];
    if (!cell) return 'absent';
    return cell.status === 'present' ? 'present' : 'absent';
  }

  getLabTopic(labNumber: number): string {
    const lab = this.laboratories.find(l => l.lab_number === labNumber);
    return lab?.topic || `Laboratory ${labNumber}`;
  }

  getCellStatus(studentId: number, labNumber: number): string {
    const studentGrid = this.attendanceGrid[studentId];
    if (!studentGrid) return 'absent';
    const cell = studentGrid[labNumber];
    return cell?.status || 'absent';
  }

  // Obține datele de prezență pentru un student
  private getStudentAttendanceData(studentId: number): any[] {
    const attendance = [];
    for (let labNum = 1; labNum <= 14; labNum++) {
      const status = this.getCellStatus(studentId, labNum);
      const topic = this.getLabTopic(labNum) || '';
      attendance.push({
        lab_number: labNum,
        topic: topic,
        status: status
      });
    }
    return attendance;
  }
}
