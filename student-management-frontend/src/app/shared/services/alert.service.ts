import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

export interface AlertConfig {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new Subject<AlertConfig | null>();
  public alert$ = this.alertSubject.asObservable();

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    this.alertSubject.next({message, type});
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  warning(message: string) {
    this.show(message, 'warning');
  }

  info(message: string) {
    this.show(message, 'info');
  }

  confirm(message: string, onConfirm: () => void, onCancel?: () => void) {
    this.alertSubject.next({message, type: 'confirm', onConfirm, onCancel});
  }

  hide() {
    this.alertSubject.next(null);
  }
}

