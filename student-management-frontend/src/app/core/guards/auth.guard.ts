import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from '../service/auth.service';
import {UserRole} from '../../shared/models/user-role.enum';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    const user = authService.getCurrentUser();
    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    const userRole = user?.role || UserRole.STUDENT;
    router.navigate([`/${userRole}`]);
    return false;
  };
};

