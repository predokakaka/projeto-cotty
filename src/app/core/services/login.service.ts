import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Login, Sessao } from '../../shared/models/modelo.login';
import { ClienteService } from './cliente';
import { BarbeiroService } from './barbeiro';

export const ERRO_CREDENCIAIS = 'CREDENCIAIS_INVALIDAS';

const CHAVE_SESSAO = 'sessao';
const CHAVE_TENTATIVAS_LOGIN_USUARIO = 'tentativas-login-usuario';
const LIMITE_TENTATIVAS_LOGIN = 6;
const JANELA_TENTATIVAS_MS = 40_000;
const TEMPO_BLOQUEIO_MS = 60_000;

interface EstadoTentativasLogin {
  falhas: number[];
  bloqueadoAte: number;
}

/**
 * Login feito no frontend.
 *
 * O backend ainda não tem rota POST /login, então as credenciais são conferidas
 * contra as listas que ele já expõe (GET /cliente e /barbeiro).
 * Quando o backend ganhar um /login real, só o método loginUsuario abaixo
 * precisa mudar para um this.http.post(...) — a página e o guard continuam iguais.
 */
@Injectable({ providedIn: 'root' })
export class LoginService {
  private clienteService = inject(ClienteService);
  private barbeiroService = inject(BarbeiroService);

  private sessao: Sessao | null = this.lerSessaoSalva();
  private tentativasLoginUsuario: EstadoTentativasLogin = { falhas: [], bloqueadoAte: 0 };

  /** Usuário = cliente ou barbeiro. Confere nome, e-mail e senha do cadastro. */
  public loginUsuario(login: Login): Observable<Sessao> {
    const nome = (login.nome ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
    const email = login.email.trim().toLowerCase();

    return forkJoin([
      this.clienteService.getClientes(),
      this.barbeiroService.getBarbeiros(),
    ]).pipe(
      map(([clientes, barbeiros]): Sessao => {
        const cliente = clientes.find(
          (c) =>
            c.nome.trim().replace(/\s+/g, ' ').toLowerCase() === nome &&
            c.email.trim().toLowerCase() === email &&
            c.senha === login.password
        );
        if (cliente) {
          return { tipo: 'cliente', id: cliente.cliente_id!, nome: cliente.nome };
        }

        const barbeiro = barbeiros.find(
          (b) =>
            b.nome.trim().replace(/\s+/g, ' ').toLowerCase() === nome &&
            b.email.trim().toLowerCase() === email &&
            b.senha === login.password
        );
        if (barbeiro) {
          return { tipo: 'barbeiro', id: barbeiro.id_barbeiro!, nome: barbeiro.nome };
        }

        throw new Error(ERRO_CREDENCIAIS);
      }),
      tap((sessao) => {
        this.limparTentativasLoginUsuario();
        this.salvarSessao(sessao);
      })
    );
  }

  public segundosBloqueioLoginUsuario(): number {
    const estado = this.lerTentativasLoginUsuario();
    const restante = Math.ceil((estado.bloqueadoAte - Date.now()) / 1000);
    if (restante > 0) return restante;

    if (estado.bloqueadoAte) {
      this.salvarTentativasLoginUsuario({ falhas: [], bloqueadoAte: 0 });
    }
    return 0;
  }

  public registrarFalhaLoginUsuario(): number {
    const agora = Date.now();
    const estado = this.lerTentativasLoginUsuario();
    const restante = Math.ceil((estado.bloqueadoAte - agora) / 1000);
    if (restante > 0) return restante;

    const falhas = estado.falhas.filter(
      (instante) => instante <= agora && instante > agora - JANELA_TENTATIVAS_MS
    );
    falhas.push(agora);

    if (falhas.length >= LIMITE_TENTATIVAS_LOGIN) {
      this.salvarTentativasLoginUsuario({
        falhas: [],
        bloqueadoAte: agora + TEMPO_BLOQUEIO_MS,
      });
      return TEMPO_BLOQUEIO_MS / 1000;
    }

    this.salvarTentativasLoginUsuario({ falhas, bloqueadoAte: 0 });
    return 0;
  }

  public limparTentativasLoginUsuario() {
    this.salvarTentativasLoginUsuario({ falhas: [], bloqueadoAte: 0 });
  }

  /** Usado pelo cadastro: a conta acabou de ser criada, então já entra logada. */
  public iniciarSessao(sessao: Sessao) {
    this.salvarSessao(sessao);
  }

  public getSessao(): Sessao | null {
    return this.sessao;
  }

  public isLoggedIn(): boolean {
    return this.sessao !== null;
  }

  /** Mantém o nome da sessão em dia depois que a pessoa edita o próprio perfil. */
  public atualizarNomeSessao(nome: string) {
    if (this.sessao) {
      this.salvarSessao({ ...this.sessao, nome });
    }
  }

  public logout() {
    this.sessao = null;
    try {
      sessionStorage.removeItem(CHAVE_SESSAO);
    } catch {
      // armazenamento indisponível: a sessão em memória já foi limpa
    }
  }

  private salvarSessao(sessao: Sessao) {
    this.sessao = sessao;
    try {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    } catch {
      // sem armazenamento: a sessão vale só até recarregar a página
    }
  }

  private lerSessaoSalva(): Sessao | null {
    try {
      const salva = sessionStorage.getItem(CHAVE_SESSAO);
      return salva ? (JSON.parse(salva) as Sessao) : null;
    } catch {
      return null;
    }
  }

  private lerTentativasLoginUsuario(): EstadoTentativasLogin {
    try {
      const salva = sessionStorage.getItem(CHAVE_TENTATIVAS_LOGIN_USUARIO);
      if (!salva) return this.tentativasLoginUsuario;

      const estado: unknown = JSON.parse(salva);
      if (
        typeof estado === 'object' &&
        estado !== null &&
        'falhas' in estado &&
        Array.isArray(estado.falhas) &&
        estado.falhas.every((instante) => typeof instante === 'number' && Number.isFinite(instante)) &&
        'bloqueadoAte' in estado &&
        typeof estado.bloqueadoAte === 'number' &&
        Number.isFinite(estado.bloqueadoAte)
      ) {
        this.tentativasLoginUsuario = { falhas: estado.falhas, bloqueadoAte: estado.bloqueadoAte };
        return this.tentativasLoginUsuario;
      }
    } catch {
      return this.tentativasLoginUsuario;
    }
    return this.tentativasLoginUsuario;
  }

  private salvarTentativasLoginUsuario(estado: EstadoTentativasLogin) {
    this.tentativasLoginUsuario = estado;
    try {
      sessionStorage.setItem(CHAVE_TENTATIVAS_LOGIN_USUARIO, JSON.stringify(estado));
    } catch {
      // o estado em memória mantém o limite até a aplicação ser encerrada
    }
  }
}
