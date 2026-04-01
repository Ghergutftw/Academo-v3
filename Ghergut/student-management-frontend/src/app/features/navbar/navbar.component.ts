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


}

