import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AuthService} from '../../../shared/services/auth.service';
import {StudentsService} from '../../../shared/services/students.service';

interface Groupmate {
  id: number;
  name: string;
  email: string;
  group_id: number;
  group_name: string;
}

interface GroupmatesResponse {
  group_id: number;
  group_name: string;
  students: Groupmate[];
}

@Component({
  selector: 'app-my-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-group.component.html',
  styleUrl: './my-group.component.css'
})
export class MyGroupComponent implements OnInit {
  groupmates: Groupmate[] = [];
  groupName: string = '';
  loading: boolean = false;
  error: string = '';
  currentUser: any;

  constructor(
    private studentsService: StudentsService,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadGroupmates();
  }

  loadGroupmates(): void {
    if (!this.currentUser) return;

    this.loading = true;
    this.error = '';

    this.studentsService.getMyGroupmates(this.currentUser.user_type_id).subscribe({
      next: (response: GroupmatesResponse) => {
        this.groupName = response.group_name;
        this.groupmates = response.students;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Nu s-au putut încărca colegii de grupă';
        this.loading = false;
        console.error('Error loading groupmates:', error);
      }
    });
  }
}
