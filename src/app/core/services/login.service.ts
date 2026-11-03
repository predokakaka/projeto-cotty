import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Login, Sessao } from '../../shared/models/modelo.login';

export const ERRO_CREDENCIAIS = 'CREDENCIAIS_INVALIDAS';
export const ERRO_AUTENTICACAO_NAO_DISPONIVEL = 'AUTENTICACAO_NAO_DISPONIVEL';

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
 * O backend não oferece endpoint de autenticação e os GET públicos não retornam
 * senha. O login só pode ser habilitado quando o backend fornecer essa operação.
 */
@Injectable({ providedIn: 'root' })
export class LoginService {
  private sessao: Sessao | null = this.lerSessaoSalva();
  private tentativasLoginUsuario: EstadoTentativasLogin = { falhas: [], bloqueadoAte: 0 };

  /** O contrato atual do backend não permite validar credenciais com segurança. */
  public loginUsuario(_login: Login): Observable<Sessao> {
    return throwError(() => new Error(ERRO_AUTENTICACAO_NAO_DISPONIVEL));
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
