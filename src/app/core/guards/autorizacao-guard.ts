import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../services/login.service';

export const autorizacaoGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(LoginService).isLoggedIn() ? true : router.createUrlTree(['/login']);
};
