import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, roleGuard } from './auth.guard';
import { AuthService } from '../service/auth.service';
import { UserRole } from '../../shared/models/user-role.enum';
import { User } from '../../shared/models/user.model';

describe('Auth Guards', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

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

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'getCurrentUser'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', () => {
      authService.isAuthenticated.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should deny access and redirect to login when user is not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('roleGuard', () => {
    it('should allow access when user has the required role', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getCurrentUser.and.returnValue(mockAdminUser);

      const guard = roleGuard([UserRole.ADMIN]);
      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should allow access when user role is in allowed roles list', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getCurrentUser.and.returnValue(mockTeacherUser);

      const guard = roleGuard([UserRole.ADMIN, UserRole.TEACHER]);
      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any)
      );

      expect(result).toBe(true);
    });

    it('should deny access and redirect to login when user is not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);

      const guard = roleGuard([UserRole.ADMIN]);
      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should deny access and redirect to user role page when role is not allowed', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getCurrentUser.and.returnValue(mockStudentUser);

      const guard = roleGuard([UserRole.ADMIN]);
      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/student']);
    });

    it('should redirect teacher to /teacher when accessing admin-only route', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getCurrentUser.and.returnValue(mockTeacherUser);

      const guard = roleGuard([UserRole.ADMIN]);
      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/teacher']);
    });

    it('should redirect admin to /admin when accessing student-only route', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getCurrentUser.and.returnValue(mockAdminUser);

      const guard = roleGuard([UserRole.STUDENT]);
      const result = TestBed.runInInjectionContext(() =>
        guard({} as any, {} as any)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });
  });
});
