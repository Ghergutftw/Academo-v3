import {Component, ElementRef, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../shared/services/auth.service';
import {User} from '../../shared/models/user.model';
import {UserRole} from '../../shared/models/user-role.enum';
import {ChangePasswordModalComponent} from './change-password-modal/change-password-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    NgOptimizedImage
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  showDropdown = false;

  profileName: string = '';
  profileEmail: string = '';

  constructor(
    private authService: AuthService,
    private elementRef: ElementRef,
    private modalService: NgbModal
  ) {
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === UserRole.ADMIN;
  }

  get isTeacher(): boolean {
    return this.currentUser?.role === UserRole.TEACHER;
  }

  get isStudent(): boolean {
    return this.currentUser?.role === UserRole.STUDENT;
  }

  get userInitial(): string {
    return this.currentUser?.name?.[0]?.toUpperCase() || 'U';
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profileName = user.name || '';
        this.profileEmail = user.email || '';
      }
    });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    this.showDropdown = false;
    this.authService.logout();
  }

  openChangePasswordModal(): void {
    this.showDropdown = false;
    this.modalService.open(ChangePasswordModalComponent, {
      centered: true,
      backdrop: 'static'
    });
  }

  getScheduleUrl(): string {
    // Check if user is a student and has study_cycle property
    if (this.currentUser?.study_cycle === 'Master') {
      // Return Master schedule URL for Master students
      return 'https://docs.google.com/document/d/1c2s5HcCT08Dwmp_ztdAtvIUN9zJ9QeJ1RqnQmk7CMxs/edit?tab=t.0';
    }
    // Default to Licență schedule for Bachelor students
    return 'https://docs.google.com/spreadsheets/d/12IFQFiq0IWS0S8ohucNU1jOXiMHeFMcdC4_4idStfG4/edit?gid=1355420507#gid=1355420507';
  }

}

