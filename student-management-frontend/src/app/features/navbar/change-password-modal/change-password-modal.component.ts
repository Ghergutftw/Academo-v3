import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {AuthService} from '../../../shared/services/auth.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password-modal.component.html',
  styleUrls: ['./change-password-modal.component.css']
})
export class ChangePasswordModalComponent {
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  error: string = '';
  success: string = '';
  loading: boolean = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    public activeModal: NgbActiveModal
  ) {}

  onSubmit(): void {
    this.error = '';
    this.success = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.error = 'Toate câmpurile sunt obligatorii';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'Parola nouă trebuie să aibă cel puțin 6 caractere';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Parolele nu coincid';
      return;
    }

    this.loading = true;
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.error = 'Utilizator neautentificat';
      this.loading = false;
      return;
    }

    const payload = {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      userId: user.id,
      userRole: user.role
    };

    this.http.post(`${environment.apiUrl}/auth/change-password.php`, payload).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          this.success = 'Parola a fost schimbată cu succes';
          setTimeout(() => {
            this.activeModal.close('success');
          }, 2000);
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.error || 'Eroare la schimbarea parolei';
      }
    });
  }
}
