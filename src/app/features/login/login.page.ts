import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cutOutline } from 'ionicons/icons';
import { Login, Sessao } from '../../shared/models/modelo.login';
import { ERRO_CREDENCIAIS, LoginService } from '../../core/services/login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  imports: [
    FormsModule,
    RouterLink,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
})
export class LoginPage {
  private loginService = inject(LoginService);
  private router = inject(Router);

  protected entrando = false;
  protected mensagemErro = '';
  protected segundosBloqueio = 0;
  private intervaloBloqueio: ReturnType<typeof setInterval> | null = null;

  protected login: Login = { nome: '', email: '', password: '' };

  constructor() {
    addIcons({ 'cut-outline': cutOutline });
  }

  // Chegar na tela de login encerra qualquer sessão anterior (padrão do 14/09).
  public ionViewWillEnter() {
    this.loginService.logout();
    this.login = { nome: '', email: '', password: '' };
    this.mensagemErro = '';
    this.entrando = false;
    this.atualizarContagemBloqueio();
  }

  public ionViewWillLeave() {
    this.pararContagemBloqueio();
  }

  protected formularioPreenchido(): boolean {
    return (
      Boolean(this.login.nome?.trim()) &&
      this.login.email.trim() !== '' &&
      this.login.password !== ''
    );
  }

  protected aoDigitarSenha(evento: CustomEvent<{ value?: string | number | null }>) {
    this.login.password = String(evento.detail.value ?? '').replace(/\s/g, '');
  }

  protected acessar() {
    if (this.entrando) return;

    this.atualizarContagemBloqueio();
    if (this.segundosBloqueio > 0) {
      this.mensagemErro = this.mensagemBloqueio();
      return;
    }

    if (!this.formularioPreenchido()) {
      this.mensagemErro = 'Preencha todos os campos para entrar.';
      return;
    }

    this.entrando = true;
    this.mensagemErro = '';

    this.loginService.loginUsuario(this.login).subscribe({
      next: (sessao) => {
        this.entrando = false;
        this.irParaInicio(sessao);
      },
      error: (erro) => {
        this.entrando = false;
        if (this.eErroCredenciais(erro)) {
          this.loginService.registrarFalhaLoginUsuario();
          this.atualizarContagemBloqueio();
          this.mensagemErro = this.segundosBloqueio > 0
            ? this.mensagemBloqueio()
            : this.traduzirErro(erro);
        } else {
          this.mensagemErro = this.traduzirErro(erro);
        }
      },
    });
  }

  protected formatarTempoBloqueio(): string {
    const minutos = Math.floor(this.segundosBloqueio / 60);
    const segundos = this.segundosBloqueio % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  }

  private eErroCredenciais(erro: unknown): boolean {
    return erro instanceof Error && erro.message === ERRO_CREDENCIAIS;
  }

  private mensagemBloqueio(): string {
    return `Muitas tentativas. Aguarde ${this.formatarTempoBloqueio()} para tentar novamente.`;
  }

  private atualizarContagemBloqueio() {
    this.segundosBloqueio = this.loginService.segundosBloqueioLoginUsuario();
    if (this.segundosBloqueio > 0 && !this.intervaloBloqueio) {
      this.intervaloBloqueio = setInterval(() => {
        this.segundosBloqueio = this.loginService.segundosBloqueioLoginUsuario();
        if (this.segundosBloqueio === 0) {
          this.pararContagemBloqueio();
          this.mensagemErro = '';
        } else if (this.mensagemErro.startsWith('Muitas tentativas.')) {
          this.mensagemErro = this.mensagemBloqueio();
        }
      }, 1000);
    } else if (this.segundosBloqueio === 0) {
      this.pararContagemBloqueio();
    }
  }

  private pararContagemBloqueio() {
    if (this.intervaloBloqueio) {
      clearInterval(this.intervaloBloqueio);
      this.intervaloBloqueio = null;
    }
  }

  private irParaInicio(sessao: Sessao) {
    if (sessao.tipo === 'barbearia') {
      this.router.navigate(['/barbearia', sessao.id], { replaceUrl: true });
    } else {
      this.router.navigate(['/tabs/barbearias'], { replaceUrl: true });
    }
  }

  private traduzirErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse) {
      return 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.';
    }
    if (erro instanceof Error && erro.message === ERRO_CREDENCIAIS) {
      return 'Nome, e-mail ou senha incorretos.';
    }
    return 'Algo deu errado ao entrar. Tente novamente.';
  }
}
