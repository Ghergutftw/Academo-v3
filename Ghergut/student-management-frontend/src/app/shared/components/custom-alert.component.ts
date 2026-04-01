import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AlertConfig, AlertService} from '../services/alert.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-custom-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-alert.component.html',
  styleUrls: ['./custom-alert.component.css']
})
export class CustomAlertComponent implements OnInit, OnDestroy {
  alertConfig: AlertConfig | null = null;
  private subscription?: Subscription;

  constructor(private alertService: AlertService) {}

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
