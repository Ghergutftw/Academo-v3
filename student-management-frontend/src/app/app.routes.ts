import {Routes} from '@angular/router';
import {AdminDashboardComponent} from './features/admin-dashboard/admin-dashboard.component';
import {StudentsListComponent} from './features/students/students.component';
import {TeachersComponent} from './features/teachers/teachers.component';
import {GroupsComponent} from './features/groups/groups.component';
import {CoursesComponent} from './features/courses/courses.component';
import {CourseAssignmentsComponent} from './features/course-assignments/course-assignments.component';
import {
  CourseLaboratoriesComponent
} from './features/admin-dashboard/course-laboratories/course-laboratories.component';
import {LoginComponent} from './features/login/login.component';
import {TeacherDashboardComponent} from './features/teacher-dashboard/teacher-dashboard.component';
import {StudentDashboardComponent} from './features/student-dashboard/student-dashboard.component';
import {StudentCoursesComponent} from './features/student-courses/student-courses.component';
import {TeacherCoursesComponent} from './features/teacher-courses/teacher-courses.component';
import {roleGuard} from './core/guards/auth.guard';
import {UserRole} from './shared/models/user-role.enum';

export const routes: Routes = [
  {path: '', redirectTo: 'login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},

  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [roleGuard([UserRole.ADMIN])],
    children: [
      {path: '', redirectTo: 'students', pathMatch: 'full'},
      {path: 'students', component: StudentsListComponent},
      {path: 'teachers', component: TeachersComponent},
      {path: 'groups', component: GroupsComponent},
      {path: 'courses/:id/laboratories', component: CourseLaboratoriesComponent},
      {path: 'courses', component: CoursesComponent},
      {path: 'course-assignments', component: CourseAssignmentsComponent}
    ],
  },

  {
    path: 'teacher',
    canActivate: [roleGuard([UserRole.TEACHER])],
    children: [
      {path: '', component: TeacherDashboardComponent},
      {path: 'courses', component: TeacherCoursesComponent},
      {path: 'students', component: StudentsListComponent},
      {path: 'groups', component: GroupsComponent},
    ]
  },
  {
    path: 'student',
    canActivate: [roleGuard([UserRole.STUDENT])],
    children: [
      {path: '', component: StudentDashboardComponent},
      {path: 'courses', component: StudentCoursesComponent},
      {path: 'groups', component: GroupsComponent},
    ]
  },

  {path: '**', redirectTo: 'login'},
];
