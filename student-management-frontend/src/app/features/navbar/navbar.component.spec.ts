import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../core/service/auth.service';
import { User } from '../../shared/models/user.model';
import { UserRole } from '../../shared/models/user-role.enum';
import { BehaviorSubject } from 'rxjs';
import { ElementRef } from '@angular/core';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let currentUserSubject: BehaviorSubject<User | null>;

  const mockAdminUser: User = {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    user_type_id: 1
  };

  const mockTeacherUser: User = {
    id: 2,
    name: 'Teacher User',
    email: 'teacher@example.com',
    role: UserRole.TEACHER,
    user_type_id: 2
  };

  const mockStudentUser: User = {
    id: 3,
    name: 'Student User',
    email: 'student@example.com',
    role: UserRole.STUDENT,
    user_type_id: 3
  };

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<User | null>(null);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'logout'], {
      currentUser$: currentUserSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', () => {
      authService.isAuthenticated.and.returnValue(true);
      expect(component.isAuthenticated).toBe(true);
    });

    it('should return false when user is not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);
      expect(component.isAuthenticated).toBe(false);
    });
  });

  describe('role checks', () => {
    it('should return true for isAdmin when user is admin', () => {
      component.currentUser = mockAdminUser;
      expect(component.isAdmin).toBe(true);
      expect(component.isTeacher).toBe(false);
      expect(component.isStudent).toBe(false);
    });

    it('should return true for isTeacher when user is teacher', () => {
      component.currentUser = mockTeacherUser;
      expect(component.isAdmin).toBe(false);
      expect(component.isTeacher).toBe(true);
      expect(component.isStudent).toBe(false);
    });

    it('should return true for isStudent when user is student', () => {
      component.currentUser = mockStudentUser;
      expect(component.isAdmin).toBe(false);
      expect(component.isTeacher).toBe(false);
      expect(component.isStudent).toBe(true);
    });

    it('should return false for all roles when no user is logged in', () => {
      component.currentUser = null;
      expect(component.isAdmin).toBe(false);
      expect(component.isTeacher).toBe(false);
      expect(component.isStudent).toBe(false);
    });
  });

  describe('userInitial', () => {
    it('should return first letter of user name in uppercase', () => {
      component.currentUser = mockAdminUser;
      expect(component.userInitial).toBe('A');
    });

    it('should return "U" when no user is logged in', () => {
      component.currentUser = null;
      expect(component.userInitial).toBe('U');
    });

    it('should return "U" when user has no name', () => {
      component.currentUser = { ...mockAdminUser, name: '' };
      expect(component.userInitial).toBe('U');
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to currentUser$ and update component state', () => {
      fixture.detectChanges();

      currentUserSubject.next(mockAdminUser);

      expect(component.currentUser).toEqual(mockAdminUser);
      expect(component.profileName).toBe('Admin User');
      expect(component.profileEmail).toBe('admin@example.com');
    });

    it('should handle null user', () => {
      fixture.detectChanges();

      currentUserSubject.next(null);

      expect(component.currentUser).toBeNull();
    });
  });

  describe('toggleDropdown', () => {
    it('should toggle showDropdown from false to true', () => {
      component.showDropdown = false;
      component.toggleDropdown();
      expect(component.showDropdown).toBe(true);
    });

    it('should toggle showDropdown from true to false', () => {
      component.showDropdown = true;
      component.toggleDropdown();
      expect(component.showDropdown).toBe(false);
    });
  });

  describe('logout', () => {
    it('should close dropdown and call authService.logout', () => {
      component.showDropdown = true;
      component.logout();

      expect(component.showDropdown).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
    });
  });
});
