import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../services/login.service';

// Rotas só para quem NÃO está logado (ex.: cadastro). Quem já tem sessão
// é levado para a tela inicial do seu tipo de conta.
export const visitanteGuard: CanActivateFn = () => {
  const router = inject(Router);
  const sessao = inject(LoginService).getSessao();

  if (!sessao) {
    return true;
  }
  return sessao.tipo === 'barbearia'
    ? router.createUrlTree(['/barbearia', sessao.id])
    : router.createUrlTree(['/tabs/barbearias']);
};
