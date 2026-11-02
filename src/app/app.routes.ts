import { Routes } from '@angular/router';
import { autorizacaoGuard } from './core/guards/autorizacao-guard';
import { visitanteGuard } from './core/guards/visitante-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'sobre-nos',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'sobre-nos',
    loadComponent: () => import('./features/sobre-nos/sobre-nos.page').then((m) => m.SobreNosPage),
  },
  {
    path: 'cadastro',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./features/cadastro/cadastro.page').then((m) => m.CadastroPage),
  },
  {
    path: 'cadastro-barbearia',
    canActivate: [autorizacaoGuard],
    loadComponent: () =>
      import('./features/cadastro-barbearia/cadastro-barbearia.page').then(
        (m) => m.CadastroBarbeariaPage
      ),
  },
  {
    path: 'filiacao',
    canActivate: [autorizacaoGuard],
    loadComponent: () => import('./features/filiacao/filiacao.page').then((m) => m.FiliacaoPage),
  },
  {
    path: 'solicitacoes-filiacao',
    canActivate: [autorizacaoGuard],
    loadComponent: () =>
      import('./features/solicitacoes-filiacao/solicitacoes-filiacao.page').then(
        (m) => m.SolicitacoesFiliacaoPage
      ),
  },
  {
    path: 'tabs',
    canActivate: [autorizacaoGuard],
    loadComponent: () => import('./layout/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'barbearias',
        loadComponent: () =>
          import('./features/barbearias/barbearias.page').then((m) => m.BarbeariasPage),
      },
      {
        path: 'agendamentos',
        loadComponent: () =>
          import('./features/agendamentos/agendamentos.page').then((m) => m.AgendamentosPage),
      },
      {
        path: 'conta',
        loadComponent: () => import('./features/conta/conta.page').then((m) => m.ContaPage),
      },
      {
        path: '',
        redirectTo: '/tabs/barbearias',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'barbearia/:id',
    canActivate: [autorizacaoGuard],
    loadComponent: () =>
      import('./features/barbearia-detail/barbearia-detail.page').then((m) => m.BarbeariaDetailPage),
  },
  {
    path: '**',
    redirectTo: '/tabs/barbearias',
  },
];
