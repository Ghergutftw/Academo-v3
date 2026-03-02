import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {NavbarComponent} from './features/navbar/navbar.component';
import {CustomAlertComponent} from './shared/components/custom-alert.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CustomAlertComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
}
