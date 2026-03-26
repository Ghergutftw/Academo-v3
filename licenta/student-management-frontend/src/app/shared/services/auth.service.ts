import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {Router} from '@angular/router';
import {environment} from '../../environments/environment';
import {LoginCredentials, LoginResponse, User} from '../models/user.model';
import {UserRole} from '../models/user-role.enum';

@Injectable({providedIn: 'root'})
export class AuthService {
  private api = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkStoredAuth();
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/login.php`, credentials).pipe(
      tap(response => {
        if (response.success) {
          sessionStorage.setItem(this.tokenKey, response.token);
          sessionStorage.setItem(this.userKey, JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUserSubject.value;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  checkStoredAuth(): void {
    const token = this.getToken();
    const storedUser = sessionStorage.getItem(this.userKey);

    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        this.http.get<any>(`${this.api}/verify.php`).subscribe({
          next: (response) => {
            if (response.valid) {
              this.currentUserSubject.next(response.user);
              sessionStorage.setItem(this.userKey, JSON.stringify(response.user));
            } else if (response.error) {
              this.logout();
            }
          },
          error: (err) => {
            if (err.status === 401) {
              this.logout();
            }
            console.warn('Token verification failed, but keeping user logged in:', err.status);
          }
        });
      } catch (e) {
        console.error('Failed to parse stored user data:', e);
        this.logout();
      }
    }
  }
}

