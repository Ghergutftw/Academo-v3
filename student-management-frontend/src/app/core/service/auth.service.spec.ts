import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginCredentials, LoginResponse, User } from '../../shared/models/user.model';
import { UserRole } from '../../shared/models/user-role.enum';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.STUDENT,
    user_type_id: 3
  };

  const mockLoginResponse: LoginResponse = {
    success: true,
    token: 'test-token-123',
    user: mockUser
  };

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store token and user', (done) => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials).subscribe(response => {
        expect(response).toEqual(mockLoginResponse);
        expect(sessionStorage.getItem('auth_token')).toBe('test-token-123');
        expect(sessionStorage.getItem('auth_user')).toBe(JSON.stringify(mockUser));
        expect(service.getCurrentUser()).toEqual(mockUser);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockLoginResponse);
    });

    it('should not store data if login fails', (done) => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrong'
      };

      service.login(credentials).subscribe(response => {
        expect(response.success).toBe(false);
        expect(sessionStorage.getItem('auth_token')).toBeNull();
        expect(sessionStorage.getItem('auth_user')).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login.php`);
      req.flush({ success: false, error: 'Invalid credentials' });
    });
  });

  describe('logout', () => {
    it('should clear storage and navigate to login', () => {
      sessionStorage.setItem('auth_token', 'test-token');
      sessionStorage.setItem('auth_user', JSON.stringify(mockUser));
      service['currentUserSubject'].next(mockUser);

      service.logout();

      expect(sessionStorage.getItem('auth_token')).toBeNull();
      expect(sessionStorage.getItem('auth_user')).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      service['currentUserSubject'].next(mockUser);
      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should return null when no user is logged in', () => {
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('getToken', () => {
    it('should return token from sessionStorage', () => {
      sessionStorage.setItem('auth_token', 'test-token');
      expect(service.getToken()).toBe('test-token');
    });

    it('should return null when no token exists', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token and user exist', () => {
      sessionStorage.setItem('auth_token', 'test-token');
      service['currentUserSubject'].next(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when token is missing', () => {
      service['currentUserSubject'].next(mockUser);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false when user is missing', () => {
      sessionStorage.setItem('auth_token', 'test-token');
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the specified role', () => {
      service['currentUserSubject'].next(mockUser);
      expect(service.hasRole(UserRole.STUDENT)).toBe(true);
    });

    it('should return false when user has a different role', () => {
      service['currentUserSubject'].next(mockUser);
      expect(service.hasRole(UserRole.ADMIN)).toBe(false);
    });

    it('should return false when no user is logged in', () => {
      expect(service.hasRole(UserRole.STUDENT)).toBe(false);
    });
  });

  describe('checkStoredAuth', () => {
    it('should restore user from sessionStorage', () => {
      sessionStorage.setItem('auth_token', 'test-token');
      sessionStorage.setItem('auth_user', JSON.stringify(mockUser));

      service.checkStoredAuth();

      expect(service.getCurrentUser()).toEqual(mockUser);

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/verify.php?token=test-token`);
      req.flush({ valid: true, user: mockUser });
    });

    it('should logout if token verification fails', () => {
      sessionStorage.setItem('auth_token', 'invalid-token');
      sessionStorage.setItem('auth_user', JSON.stringify(mockUser));

      service.checkStoredAuth();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/verify.php?token=invalid-token`);
      req.flush({ valid: false, error: 'Invalid token' });

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
