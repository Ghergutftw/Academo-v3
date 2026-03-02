import {Routes} from '@angular/router';
import {roleGuard} from './core/guards/auth.guard';
import {UserRole} from './shared/models/user-role.enum';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },

  {
    path: 'exam-schedule',
    loadComponent: () => import('./features/exam-schedule/exam-schedule.component').then(m => m.ExamScheduleComponent)
  },

  {
    path: 'admin',
    canActivate: [roleGuard([UserRole.ADMIN])],
    children: [
      { path: '', redirectTo: 'students', pathMatch: 'full' },
      { path: 'students', loadComponent: () => import('./features/student/students/students.component').then(m => m.StudentsListComponent) },
      { path: 'teachers', loadComponent: () => import('./features/teacher/teachers/teachers.component').then(m => m.TeachersComponent) },
      { path: 'groups', loadComponent: () => import('./features/groups/groups.component').then(m => m.GroupsComponent) },
      { path: 'study-groups', loadComponent: () => import('./features/study-groups/study-groups.component').then(m => m.StudyGroupsComponent) },
      { path: 'courses', loadComponent: () => import('./features/courses/courses.component').then(m => m.CoursesComponent) },
      { path: 'courses/:id/laboratories', loadComponent: () => import('./features/courses/course-laboratories/course-laboratories.component').then(m => m.CourseLaboratoriesComponent) },
    ]
  },

  {
    path: 'teacher',
    canActivate: [roleGuard([UserRole.TEACHER])],
    children: [
      { path: '', redirectTo: 'attendance-grid', pathMatch: 'full' },
      { path: 'courses', loadComponent: () => import('./features/teacher/teacher-courses/teacher-courses.component').then(m => m.TeacherCoursesComponent) },
      { path: 'attendance-grid', loadComponent: () => import('./features/teacher/attendance-grid/attendance-grid.component').then(m => m.AttendanceGridComponent) },
      { path: 'previous-activities', loadComponent: () => import('./features/teacher/teacher-previous-activities/teacher-previous-activities.component').then(m => m.TeacherPreviousActivitiesComponent) },
      { path: 'students', loadComponent: () => import('./features/student/students/students.component').then(m => m.StudentsListComponent) },
      { path: 'groups', loadComponent: () => import('./features/groups/groups.component').then(m => m.GroupsComponent) },
      { path: 'study-groups', loadComponent: () => import('./features/study-groups/study-groups.component').then(m => m.StudyGroupsComponent) },
    ]
  },

  {
    path: 'student',
    canActivate: [roleGuard([UserRole.STUDENT])],
    children: [
      { path: '', loadComponent: () => import('./features/student/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent) },
      { path: 'courses', loadComponent: () => import('./features/student/student-courses/student-courses.component').then(m => m.StudentCoursesComponent) },
      { path: 'my-group', loadComponent: () => import('./features/student/my-group/my-group.component').then(m => m.MyGroupComponent) },
      { path: 'groups', loadComponent: () => import('./features/groups/groups.component').then(m => m.GroupsComponent) },
    ]
  },

  { path: '**', redirectTo: 'login' },
];
