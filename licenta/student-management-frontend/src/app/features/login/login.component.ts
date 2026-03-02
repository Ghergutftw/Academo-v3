import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.isAuthenticated()) {
      this.redirectByRole();
    }
  }

  onSubmit(): void {
    this.error = '';
    this.loading = true;

    if (!this.email || !this.password) {
      this.error = 'Please enter both email and password';
      this.loading = false;
      return;
    }

    this.authService.login({email: this.email, password: this.password}).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.redirectByRole();
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.error || 'Invalid email or password';
      }
    });
  }

  private redirectByRole(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    switch (user.role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'teacher':
        this.router.navigate(['/teacher']);
        break;
      case 'student':
        this.router.navigate(['/student']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}

