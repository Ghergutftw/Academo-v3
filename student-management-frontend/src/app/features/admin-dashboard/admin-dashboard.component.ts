import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class AdminDashboardComponent {

}
