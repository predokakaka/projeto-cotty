import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TipoConta } from '../../shared/models/modelo.login';
import { LoginService } from '../services/login.service';

export function tipoContaGuard(...tiposPermitidos: TipoConta[]): CanActivateFn {
  return () => {
    const router = inject(Router);
    const sessao = inject(LoginService).getSessao();

    if (!sessao) {
      return router.createUrlTree(['/login']);
    }

    return tiposPermitidos.includes(sessao.tipo)
      ? true
      : router.createUrlTree(['/tabs/barbearias']);
  };
}
