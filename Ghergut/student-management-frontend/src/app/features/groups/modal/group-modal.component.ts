import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {StudentGroup} from '../../../shared/models/student-groups.model';
import {Student} from '../../../shared/models/student.model';
import {StudentsService} from '../../../shared/services/students.service';
import {StudyCycle} from '../../../shared/models/study-cycle.enum';
import * as XLSX from 'xlsx';
import { AlertService } from '../../../shared/services/alert.service';

@Component({
  selector: 'app-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-modal.component.html',
  styleUrls: ['./group-modal.component.css']
})
export class GroupModalComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() group?: StudentGroup;
  @Input() allGroups: StudentGroup[] = [];

  groupName: string = '';
  groupYear: number | null = null;
  academicYearStart: string = '';
  academicYearEnd: string = '';
  studyCycle: StudyCycle | '' = '';
  availableYears: number[] = [];

  allStudents: Student[] = [];
  filteredStudents: Student[] = [];
  displayedStudents: Student[] = [];
  selectedStudentIds: number[] = [];
  loading: boolean = false;
  studentSearchText: string = '';

  labDay: string = '';
  labHour: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private studentsService: StudentsService,
    private alertService: AlertService
  ) {
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.group) {
      this.groupName = this.group.name;
      this.groupYear = this.group.year || null;

      // Parse academic year from format "2025-2026"
      if (this.group.academic_year) {
        const years = this.group.academic_year.split('-');
        if (years.length === 2) {
          this.academicYearStart = years[0];
          this.academicYearEnd = years[1];
        }
      }

      // Determine study cycle based on year (1-4 = Licenta, else Master)
      if (this.groupYear) {
        this.studyCycle = this.groupYear <= 4 ? StudyCycle.LICENTA : StudyCycle.MASTER;
        // Set available years without resetting the current year
        if (this.studyCycle === StudyCycle.LICENTA) {
          this.availableYears = [1, 2, 3, 4];
        } else if (this.studyCycle === StudyCycle.MASTER) {
          this.availableYears = [1, 2];
        }
      }

      // Load existing students from the group
      this.loadStudents();
      this.loadGroupStudents();
    } else {
      this.loadStudents();
      this.generateGroupName();
    }
  }

  onCycleChange() {
    this.groupYear = null;
    this.filteredStudents = [];
    this.selectedStudentIds = [];

    if (this.studyCycle === StudyCycle.LICENTA) {
      this.availableYears = [1, 2, 3, 4];
    } else if (this.studyCycle === StudyCycle.MASTER) {
      this.availableYears = [1, 2];
    } else {
      this.availableYears = [];
    }
  }

  onYearChange() {
    this.filterStudents();
    this.generateGroupName();
  }

  onAcademicYearStartChange() {
    // Only auto-complete if we have exactly 4 digits
    if (this.academicYearStart && /^\d{4}$/.test(this.academicYearStart)) {
      const year = parseInt(this.academicYearStart);
      this.academicYearEnd = (year + 1).toString();
    } else {
      this.academicYearEnd = '';
    }
  }

  loadStudents() {
    this.loading = true;
    this.studentsService.getAll().subscribe({
      next: (response: Student[]) => {
        this.allStudents = response || [];
        this.filterStudents();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading students:', error);
        this.loading = false;
      }
    });
  }

  loadGroupStudents() {
    if (this.group && this.group.id) {
      this.studentsService.getByGroup(this.group.id).subscribe({
        next: (students: Student[]) => {
          this.selectedStudentIds = students.map(s => s.id);
        },
        error: (error: any) => {
          console.error('Error loading group students:', error);
        }
      });
    }
  }

  filterStudents() {
    if (this.groupYear !== null && this.studyCycle) {
      this.filteredStudents = this.allStudents.filter(
        s => s.study_year === this.groupYear && s.study_cycle === this.studyCycle
      );
    } else {
      this.filteredStudents = [];
    }
    this.filterDisplayedStudents();
  }

  onExcelImport(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        let lines: string[] = [];
        if (file.name.endsWith('.csv')) {
          const data = e.target.result;
          lines = data.split('\n').filter((line: string) => line.trim());
        } else {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          lines = rows.map(row => Array.isArray(row) ? row.filter(cell => cell !== null && cell !== undefined && cell !== '').join(' ') : '').filter(line => line.trim());
        }
        this.processStudentImport(lines);
      } catch (error) {
        this.alertService.error('Eroare la parsarea fișierului.');
      }
    };
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  processStudentImport(lines: string[]): void {
    if (!lines.length) return;
    const importedIds: number[] = [];
    const notFound: string[] = [];
    const wrongYearOrCycle: string[] = [];
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (idx === 0 && (trimmed.toLowerCase().includes('email') || trimmed.toLowerCase().includes('nume'))) return;
      // Extrage email și/sau nume
      const emailMatch = trimmed.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
      let found: Student | undefined;
      if (emailMatch) {
        const email = emailMatch[0].toLowerCase();
        found = this.allStudents.find(s => s.email?.toLowerCase() === email);
      }
      if (!found) {
        // fallback: caută după nume complet (case-insensitive, ignore diacritics)
        const name = trimmed.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i, '').trim();
        found = this.allStudents.find(s => s.name?.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') === name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''));
      }
      if (found) {
        // Verifică dacă studentul aparține anului și ciclului selectat
        if (found.study_year !== this.groupYear || found.study_cycle !== this.studyCycle) {
          wrongYearOrCycle.push(`<b>${found.name}</b> (${found.email})`);
        } else if (!this.selectedStudentIds.includes(found.id)) {
          importedIds.push(found.id);
        }
      } else {
        notFound.push(trimmed);
      }
    });
    if (wrongYearOrCycle.length > 0) {
      this.selectedStudentIds = [];
      this.filterDisplayedStudents();
      this.alertService.error(
        `<b>Importul a eșuat!</b><br>Unii studenți din fișier nu aparțin anului și ciclului selectat:<br><ul style='margin:0 0 0 1.2em;padding:0;'>${wrongYearOrCycle.slice(0, 5).map(s => `<li>${s}</li>`).join('')}${wrongYearOrCycle.length > 5 ? '<li>...</li>' : ''}</ul>`
      );
      return;
    }
    // Selectează studenții importați
    this.selectedStudentIds = [...importedIds, ...this.selectedStudentIds.filter(id => !importedIds.includes(id))];
    this.filterDisplayedStudents();
    // Alertă cu rezultat
    let msg = `<b>${importedIds.length} studenți importați selectați.</b>`;
    if (notFound.length > 0) {
      msg += `<br><span style='color:#b91c1c'><b>${notFound.length} nu au fost găsiți:</b></span> <span style='font-size:0.95em;'>${notFound.slice(0, 5).map(s => `<code>${s}</code>`).join(', ')}${notFound.length > 5 ? ', ...' : ''}</span>`;
    }
    this.alertService.info(msg);
  }

  filterDisplayedStudents() {
    // Afișează toți studenții selectați (indiferent de an), apoi pe cei filtrați
    const selected = this.selectedStudentIds
      .map(id => this.allStudents.find(s => s.id === id))
      .filter((s): s is Student => !!s);
    let filtered: Student[];
    if (!this.studentSearchText) {
      filtered = this.filteredStudents.filter(s => !this.selectedStudentIds.includes(s.id));
    } else {
      const searchLower = this.studentSearchText.toLowerCase();
      filtered = this.filteredStudents.filter(
        s => !this.selectedStudentIds.includes(s.id) &&
          (s.name?.toLowerCase().includes(searchLower) ||
           s.email?.toLowerCase().includes(searchLower))
      );
    }
    // Unim fără duplicate
    this.displayedStudents = [...selected, ...filtered];
  }

  toggleStudent(studentId: number) {
    const index = this.selectedStudentIds.indexOf(studentId);
    if (index === -1) {
      this.selectedStudentIds.unshift(studentId);
    } else {
      this.selectedStudentIds.splice(index, 1);
    }
    this.filterDisplayedStudents();
  }

  isStudentSelected(studentId: number): boolean {
    return this.selectedStudentIds.includes(studentId);
  }

  save() {
    const academicYear = `${this.academicYearStart}-${this.academicYearEnd}`;
    this.activeModal.close({
      name: this.groupName,
      year: this.groupYear,
      academic_year: academicYear,
      student_ids: this.selectedStudentIds,
      lab_day: this.labDay,
      lab_hour: this.labHour
    });
  }

  isAcademicYearValid(): boolean {
    if (!this.academicYearStart || !this.academicYearEnd) return false;
    if (!/^\d{4}$/.test(this.academicYearStart) || !/^\d{4}$/.test(this.academicYearEnd)) return false;
    const start = parseInt(this.academicYearStart);
    const end = parseInt(this.academicYearEnd);
    return end === start + 1;
  }

  generateGroupName() {
    if (!this.groupYear) {
      this.groupName = '';
      return;
    }
    // Filtrează grupele existente pentru anul curent
    const yearGroups = (this.allGroups || []).filter(g => g.year === this.groupYear);
    // Extrage sufixul (ultimele 2 caractere) din nume, ex: "1x01A" => "01A"
    const suffixes = yearGroups.map(g => {
      const match = g.name.match(/(\d{2}[A-Z])$/i);
      return match ? match[1] : null;
    }).filter(Boolean);
    // Găsește următorul număr și literă disponibile
    let nextNum = 1;
    let nextLetter = 'A';
    if (suffixes.length > 0) {
      // Sortează și caută cel mai mare sufix
      suffixes.sort();
      const last = suffixes[suffixes.length - 1];
      if (last) {
        const num = parseInt(last.substring(0, 2), 10);
        const letter = last.substring(2, 3);
        nextNum = isNaN(num) ? 1 : num + 1;
        nextLetter = (letter >= 'A' && letter < 'Z') ? String.fromCharCode(letter.charCodeAt(0) + 1) : 'A';
      }
    }
    // Format: 1x + 2 cifre + literă (ex: 101A, 101B, 102A, ...)
    const yearPrefix = `${this.groupYear}`;
    const numStr = nextNum.toString().padStart(2, '0');
    this.groupName = `${yearPrefix}${numStr}${nextLetter}`;
  }
}

