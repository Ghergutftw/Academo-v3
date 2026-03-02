import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/service/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginResponse, User } from '../../shared/models/user.model';
import { UserRole } from '../../shared/models/user-role.enum';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockAdminUser: User = {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    user_type_id: 1
  };

  const mockTeacherUser: User = {
    id: 2,
    name: 'Teacher',
    email: 'teacher@example.com',
    role: UserRole.TEACHER,
    user_type_id: 2
  };

  const mockStudentUser: User = {
    id: 3,
    name: 'Student',
    email: 'student@example.com',
    role: UserRole.STUDENT,
    user_type_id: 3
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'isAuthenticated',
      'getCurrentUser'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    authService.isAuthenticated.and.returnValue(false);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should redirect authenticated admin user to /admin', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getCurrentUser.and.returnValue(mockAdminUser);

      const newComponent = new LoginComponent(authService, router);

      expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should redirect authenticated teacher user to /teacher', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getCurrentUser.and.returnValue(mockTeacherUser);

      const newComponent = new LoginComponent(authService, router);

      expect(router.navigate).toHaveBeenCalledWith(['/teacher']);
    });

    it('should redirect authenticated student user to /student', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getCurrentUser.and.returnValue(mockStudentUser);

      const newComponent = new LoginComponent(authService, router);

      expect(router.navigate).toHaveBeenCalledWith(['/student']);
    });
  });

  describe('onSubmit', () => {
    it('should show error if email is empty', () => {
      component.email = '';
      component.password = 'password123';

      component.onSubmit();

      expect(component.error).toBe('Please enter both email and password');
      expect(component.loading).toBe(false);
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should show error if password is empty', () => {
      component.email = 'test@example.com';
      component.password = '';

      component.onSubmit();

      expect(component.error).toBe('Please enter both email and password');
      expect(component.loading).toBe(false);
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should login successfully and redirect admin user', () => {
      const loginResponse: LoginResponse = {
        success: true,
        token: 'test-token',
        user: mockAdminUser
      };

      authService.login.and.returnValue(of(loginResponse));
      authService.getCurrentUser.and.returnValue(mockAdminUser);

      component.email = 'admin@example.com';
      component.password = 'password123';

      component.onSubmit();

      expect(component.loading).toBe(false);
      expect(authService.login).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123'
      });
      expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should login successfully and redirect teacher user', () => {
      const loginResponse: LoginResponse = {
        success: true,
        token: 'test-token',
        user: mockTeacherUser
      };

      authService.login.and.returnValue(of(loginResponse));
      authService.getCurrentUser.and.returnValue(mockTeacherUser);

      component.email = 'teacher@example.com';
      component.password = 'password123';

      component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/teacher']);
    });

    it('should login successfully and redirect student user', () => {
      const loginResponse: LoginResponse = {
        success: true,
        token: 'test-token',
        user: mockStudentUser
      };

      authService.login.and.returnValue(of(loginResponse));
      authService.getCurrentUser.and.returnValue(mockStudentUser);

      component.email = 'student@example.com';
      component.password = 'password123';

      component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/student']);
    });

    it('should handle login error with error message', () => {
      const errorResponse = {
        error: { error: 'Invalid credentials' }
      };

      authService.login.and.returnValue(throwError(() => errorResponse));

      component.email = 'test@example.com';
      component.password = 'wrongpassword';

      component.onSubmit();

      expect(component.loading).toBe(false);
      expect(component.error).toBe('Invalid credentials');
    });

    it('should handle login error without specific error message', () => {
      authService.login.and.returnValue(throwError(() => ({})));

      component.email = 'test@example.com';
      component.password = 'wrongpassword';

      component.onSubmit();

      expect(component.loading).toBe(false);
      expect(component.error).toBe('Invalid email or password');
    });

    it('should set loading to true during login', () => {
      const loginResponse: LoginResponse = {
        success: true,
        token: 'test-token',
        user: mockAdminUser
      };

      authService.login.and.returnValue(of(loginResponse));
      authService.getCurrentUser.and.returnValue(mockAdminUser);

      component.email = 'test@example.com';
      component.password = 'password123';
      component.loading = false;

      component.onSubmit();

      expect(authService.login).toHaveBeenCalled();
    });

    it('should clear previous error on new submit', () => {
      const loginResponse: LoginResponse = {
        success: true,
        token: 'test-token',
        user: mockAdminUser
      };

      authService.login.and.returnValue(of(loginResponse));
      authService.getCurrentUser.and.returnValue(mockAdminUser);

      component.error = 'Previous error';
      component.email = 'test@example.com';
      component.password = 'password123';

      component.onSubmit();

      expect(component.error).toBe('');
    });
  });
});
