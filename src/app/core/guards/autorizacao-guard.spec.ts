import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { routes } from '../../app.routes';
import { LoginService } from '../services/login.service';
import { autorizacaoGuard } from './autorizacao-guard';
import { tipoContaGuard } from './tipo-conta-guard';

describe('guards de acesso', () => {
  let sessaoAtiva = false;
  let tipoConta: 'cliente' | 'barbeiro' | 'barbearia' = 'cliente';

  beforeEach(() => {
    sessaoAtiva = false;
    tipoConta = 'cliente';
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: LoginService,
          useValue: {
            isLoggedIn: () => sessaoAtiva,
            getSessao: () => (sessaoAtiva ? { tipo: tipoConta, id: 1, nome: 'Teste' } : null),
          },
        },
      ],
    });
  });

  function executarGuard(guard: typeof autorizacaoGuard) {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
  }

  it('redireciona visitantes das áreas privadas para o login', () => {
    const resultado = executarGuard(autorizacaoGuard);
    expect(resultado instanceof Object).toBeTrue();
    expect((resultado as ReturnType<Router['createUrlTree']>).toString()).toBe('/login');
  });

  it('permite clientes e profissionais autenticados nas áreas protegidas por sessão', () => {
    sessaoAtiva = true;

    tipoConta = 'cliente';
    expect(executarGuard(autorizacaoGuard)).toBeTrue();

    tipoConta = 'barbeiro';
    expect(executarGuard(autorizacaoGuard)).toBeTrue();
  });

  it('restringe rotas por tipo de conta', () => {
    sessaoAtiva = true;
    tipoConta = 'barbeiro';
    expect(executarGuard(tipoContaGuard('barbeiro'))).toBeTrue();

    tipoConta = 'cliente';
    const resultado = executarGuard(tipoContaGuard('barbeiro'));
    expect((resultado as ReturnType<Router['createUrlTree']>).toString()).toBe('/tabs/barbearias');
  });

  it('deixa a listagem e os perfis públicos e protege conta e agendamentos', () => {
    const tabs = routes.find((route) => route.path === 'tabs');
    const filhos = tabs?.children ?? [];

    expect(routes.find((route) => route.path === '')?.redirectTo).toBe('/tabs/barbearias');
    expect(tabs?.canActivate).toBeUndefined();
    expect(filhos.find((route) => route.path === 'barbearias')?.canActivate).toBeUndefined();
    expect(routes.find((route) => route.path === 'barbearia/:id')?.canActivate).toBeUndefined();
    expect(filhos.find((route) => route.path === 'agendamentos')?.canActivate).toContain(
      autorizacaoGuard
    );
    expect(filhos.find((route) => route.path === 'conta')?.canActivate).toContain(autorizacaoGuard);
  });
});
