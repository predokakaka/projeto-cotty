import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginService } from '../services/login.service';

/**
 * Protege as páginas que exigem sessão.
 * Em desenvolvimento, `environment.exigirLogin = false` libera o acesso direto
 * (útil enquanto o login ainda depende do backend); em produção a sessão é exigida.
 */
export const autorizacaoGuard: CanActivateFn = () => {
  if (!environment.exigirLogin) {
    return true;
  }
  return inject(LoginService).isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);
};
