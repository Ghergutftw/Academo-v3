import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AlertConfig, AlertService} from '../services/alert.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-custom-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (alertConfig) {
      <div class="alert-overlay" (click)="onOverlayClick()">
        <div class="alert-container" (click)="$event.stopPropagation()">
          <div class="alert-content" [class]="'alert-' + alertConfig.type">
            <div class="alert-icon">
              @switch (alertConfig.type) {
                @case ('success') {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                  </svg>
                }
                @case ('error') {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clip-rule="evenodd" />
                  </svg>
                }
                @case ('warning') {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
                  </svg>
                }
                @case ('info') {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
                  </svg>
                }
                @case ('confirm') {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
                  </svg>
                }
              }
            </div>
            <div class="alert-message" [innerHTML]="formatMessage(alertConfig.message)"></div>
            <div class="alert-buttons">
              @if (alertConfig.type === 'confirm') {
                <button class="alert-btn alert-btn-cancel" (click)="onCancel()">Cancel</button>
                <button class="alert-btn alert-btn-confirm" (click)="onConfirm()">OK</button>
              } @else {
                <button class="alert-btn alert-btn-close" (click)="close()">OK</button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .alert-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .alert-container {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .alert-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 2rem;
      min-width: 400px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .alert-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .alert-icon svg {
      width: 36px;
      height: 36px;
    }

    .alert-success .alert-icon {
      background-color: #d1f4e0;
      color: #10b981;
    }

    .alert-error .alert-icon {
      background-color: #fee2e2;
      color: #ef4444;
    }

    .alert-warning .alert-icon {
      background-color: #fef3c7;
      color: #f59e0b;
    }

    .alert-info .alert-icon,
    .alert-confirm .alert-icon {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .alert-message {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 1rem;
      font-weight: 500;
      line-height: 1.6;
      color: #1f2937;
      text-align: center;
      margin-bottom: 1.5rem;
      white-space: pre-line;
    }

    .alert-buttons {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }

    .alert-btn {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 1rem;
      font-weight: 600;
      padding: 0.625rem 1.5rem;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 100px;
    }

    .alert-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .alert-btn:active {
      transform: translateY(0);
    }

    .alert-btn-close,
    .alert-btn-confirm {
      background-color: #1976d2;
      color: white;
    }

    .alert-btn-close:hover,
    .alert-btn-confirm:hover {
      background-color: #1565c0;
    }

    .alert-btn-cancel {
      background-color: #e5e7eb;
      color: #374151;
    }

    .alert-btn-cancel:hover {
      background-color: #d1d5db;
    }

    @media (max-width: 640px) {
      .alert-content {
        min-width: 90vw;
        padding: 1.5rem;
      }

      .alert-message {
        font-size: 0.95rem;
      }

      .alert-btn {
        font-size: 0.95rem;
        padding: 0.5rem 1.25rem;
      }
    }
  `]
})
export class CustomAlertComponent implements OnInit, OnDestroy {
  alertConfig: AlertConfig | null = null;
  private subscription?: Subscription;

  constructor(private alertService: AlertService) {
  }

  ngOnInit() {
    this.subscription = this.alertService.alert$.subscribe(config => {
      this.alertConfig = config;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  formatMessage(message: string): string {
    // Convert line breaks to HTML
    return message.replace(/\n/g, '<br>');
  }

  onOverlayClick() {
    if (this.alertConfig?.type !== 'confirm') {
      this.close();
    }
  }

  close() {
    this.alertService.hide();
  }

  onConfirm() {
    if (this.alertConfig?.onConfirm) {
      this.alertConfig.onConfirm();
    }
    this.close();
  }

  onCancel() {
    if (this.alertConfig?.onCancel) {
      this.alertConfig.onCancel();
    }
    this.close();
  }
}

