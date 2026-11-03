import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonProgressBar,
  IonSpinner,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cutOutline } from 'ionicons/icons';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Sessao } from '../../shared/models/modelo.login';
import { LoginService } from '../../core/services/login.service';
import { ClienteService } from '../../core/services/cliente';
import { BarbeiroService } from '../../core/services/barbeiro';
import { BarbeariaService } from '../../core/services/barbearia';
import { Barbearia } from '../../shared/models/modelo.barbearia';
import { somenteDigitos } from '../../shared/utils/documento';
import { mensagemDeErro } from '../../shared/utils/erro';
import {
  LIMITE_CURTO,
  celularValido,
  emailValido,
  nomeCompletoValido,
  formatarTelefone,
} from '../../shared/utils/validacao';

type TipoCadastro = 'cliente' | 'barbeiro';

const SENHA_MINIMA = 6;

@Component({
  selector: 'app-cadastro',
  imports: [
    FormsModule,
    RouterLink,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonIcon,
    IonProgressBar,
    IonSpinner,
    IonSelect,
    IonSelectOption,
  ],
  template: `
    <ion-content [fullscreen]="true" class="pagina">
      <main class="tela-form">
        <header class="tela-topo">
          <div class="tela-marca"><ion-icon name="cut-outline"></ion-icon></div>
          <h1>Criar conta</h1>
          <p>Escolha como você vai usar o app e preencha seus dados.</p>
        </header>

        <ion-segment [value]="tipo" (ionChange)="trocarTipo($event)" class="seletor-tipo">
          <ion-segment-button value="cliente">Cliente</ion-segment-button>
          <ion-segment-button value="barbeiro">Profissional</ion-segment-button>
        </ion-segment>

        <section class="form-campos">
          <ion-input
            [label]="tipo === 'barbeiro' ? 'Nome completo' : 'Nome'"
            labelPlacement="floating" fill="outline" autocomplete="name"
            placeholder="Ex: João da Silva"
            [maxlength]="limiteCurto" [(ngModel)]="form.nome"
            [class.campo-invalido]="tentouEnviar && !nomeValido()"
          />
          @if (tentouEnviar && form.nome.trim() && !nomeValido()) {
            <p class="form-campo-erro">{{ tipo === 'barbeiro' ? 'Informe nome e sobrenome.' : 'Informe seu nome.' }}</p>
          }

          <ion-input
            label="E-mail"
            labelPlacement="floating" fill="outline" type="email" inputmode="email" autocomplete="email"
            placeholder="nome@email.com"
            [maxlength]="limiteCurto" [(ngModel)]="form.email"
            [class.campo-invalido]="tentouEnviar && form.email.trim() && !emailOk()"
          />
          @if (tentouEnviar && form.email.trim() && !emailOk()) {
            <p class="form-campo-erro">Informe um e-mail válido (ex: nome&#64;email.com).</p>
          }

          @if (tipo === 'cliente') {
            <ion-input
              label="Telefone / WhatsApp"
              labelPlacement="floating" fill="outline" type="tel" inputmode="tel" autocomplete="tel"
              placeholder="12 34 5678900"
              [maxlength]="limiteCurto"
              [value]="form.telefone"
              (ionInput)="aoDigitarTelefone($event)"
              [class.campo-invalido]="tentouEnviar && form.telefone.trim() && !telefoneOk()"
            />
            @if (tentouEnviar && form.telefone.trim() && !telefoneOk()) {
              <p class="form-campo-erro">Informe um número válido com DDD (ex: (11) 91234-5678).</p>
            }
          } @else {
            <ion-input
              label="Modalidade de atendimento"
              labelPlacement="floating" fill="outline"
              placeholder="Ex: presencial"
              [maxlength]="limiteCurto"
              [(ngModel)]="form.modalidade_atendimento"
              [class.campo-invalido]="tentouEnviar && !form.modalidade_atendimento.trim()"
            />
            @if (tentouEnviar && !form.modalidade_atendimento.trim()) {
              <p class="form-campo-erro">Informe a modalidade de atendimento.</p>
            }

            @if (carregandoBarbearias) {
              <p class="form-campo-ajuda">Carregando estabelecimentos...</p>
            } @else if (barbearias.length) {
              <ion-select
                label="Estabelecimento"
                labelPlacement="floating"
                fill="outline"
                interface="popover"
                placeholder="Selecione um estabelecimento"
                [(ngModel)]="form.barbearia_id"
                [class.campo-invalido]="tentouEnviar && !form.barbearia_id"
              >
                @for (barbearia of barbearias; track barbearia.barbearia_id) {
                  <ion-select-option [value]="barbearia.barbearia_id">
                    {{ barbearia.nomeFantasia }} · {{ barbearia.endereco }}
                  </ion-select-option>
                }
              </ion-select>
              @if (tentouEnviar && !form.barbearia_id) {
                <p class="form-campo-erro">Selecione um estabelecimento.</p>
              }
            } @else if (erroCarregandoBarbearias) {
              <p class="form-campo-erro" role="alert">Não foi possível carregar os estabelecimentos.</p>
              <ion-button fill="clear" (click)="carregarBarbearias()">Tentar novamente</ion-button>
            } @else {
              <p class="form-campo-ajuda">Não há estabelecimentos disponíveis para vincular seu cadastro.</p>
            }
          }

          <ion-input
            label="Senha" labelPlacement="floating" fill="outline" type="password"
            placeholder="Mínimo de 6 caracteres"
            autocomplete="new-password" [maxlength]="limiteCurto" [(ngModel)]="form.senha"
            (ionInput)="aoDigitarSenha($event, 'senha')"
            [class.campo-invalido]="tentouEnviar && form.senha && senhaFraca()"
          >
            <ion-input-password-toggle slot="end"></ion-input-password-toggle>
          </ion-input>
          @if (form.senha) {
            <div class="senha-forca">
              <ion-progress-bar
                [value]="nivelForcaSenha() / 3"
                [color]="corForcaSenha()"
                [attr.aria-label]="'Força da senha: ' + textoForcaSenha()"
              />
              <span [class]="'senha-forca-texto senha-forca-' + nivelForcaSenha()">
                {{ textoForcaSenha() }}
              </span>
            </div>
            <p class="form-campo-ajuda">Use pelo menos 6 caracteres; com 8 ou mais, sua senha fica forte.</p>
          }
          @if (tentouEnviar && form.senha && senhaFraca()) {
            <p class="form-campo-erro">A senha precisa ter pelo menos {{ senhaMinima }} caracteres.</p>
          }

          <ion-input
            label="Confirmar senha" labelPlacement="floating" fill="outline" type="password"
            placeholder="Digite a senha novamente"
            autocomplete="new-password" [maxlength]="limiteCurto" [(ngModel)]="form.confirmarSenha"
            (ionInput)="aoDigitarSenha($event, 'confirmarSenha')"
            (keyup.enter)="cadastrar()"
            [class.campo-invalido]="tentouEnviar && form.confirmarSenha && !senhasIguais()"
          >
            <ion-input-password-toggle slot="end"></ion-input-password-toggle>
          </ion-input>
          @if (tentouEnviar && form.confirmarSenha && !senhasIguais()) {
            <p class="form-campo-erro">As senhas não coincidem.</p>
          }
        </section>

        @if (mensagemErro) {
          <p class="form-erro" role="alert">{{ mensagemErro }}</p>
        }

        <ion-button
          expand="block"
          class="btn-principal"
          [disabled]="enviando || !form.senha || senhaFraca()"
          (click)="cadastrar()"
        >
          @if (enviando) {
            <ion-spinner name="crescent"></ion-spinner>
          } @else {
            Criar conta
          }
        </ion-button>

        <ion-button fill="clear" expand="block" class="btn-link" routerLink="/login">
          Já tenho conta
        </ion-button>
      </main>
    </ion-content>
  `,
  styles: [`
    .form-campo-erro {
      margin: -8px 0 0 4px;
      font-size: 12px;
      color: var(--app-danger-text);
      line-height: 1.4;
    }

    .campo-invalido {
      --border-color: var(--app-danger) !important;
      --highlight-color-focused: var(--app-danger) !important;
    }

    .senha-forca {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: -6px;

      ion-progress-bar { flex: 1; --background: var(--app-border); }
    }

    .senha-forca-texto {
      min-width: 62px;
      font-size: 12px;
      text-align: right;
    }

    .senha-forca-1 { color: var(--app-danger-text); }
    .senha-forca-2 { color: var(--app-accent); }
    .senha-forca-3 { color: var(--app-success-text); }

    .form-campo-ajuda {
      margin: -10px 0 0 4px;
      font-size: 12px;
      color: var(--app-text-secondary-readable);
      line-height: 1.4;
    }
  `],
})
export class CadastroPage {
  private router = inject(Router);
  private loginService = inject(LoginService);
  private clienteService = inject(ClienteService);
  private barbeiroService = inject(BarbeiroService);
  private barbeariaService = inject(BarbeariaService);

  protected readonly limiteCurto = LIMITE_CURTO;
  protected readonly senhaMinima = SENHA_MINIMA;

  protected tipo: TipoCadastro = 'cliente';
  protected enviando = false;
  protected tentouEnviar = false;
  protected mensagemErro = '';
  protected form = this.novoForm();
  protected barbearias: Barbearia[] = [];
  protected carregandoBarbearias = false;
  protected erroCarregandoBarbearias = false;

  constructor() {
    addIcons({ 'cut-outline': cutOutline });
  }

  public ionViewWillEnter() {
    this.form = this.novoForm();
    this.mensagemErro = '';
    this.tentouEnviar = false;
    this.enviando = false;
  }

  protected trocarTipo(evento: CustomEvent) {
    this.tipo = evento.detail.value as TipoCadastro;
    this.mensagemErro = '';
    this.tentouEnviar = false;
    if (this.tipo === 'barbeiro') {
      this.carregarBarbearias();
    }
  }

  protected carregarBarbearias() {
    if (this.carregandoBarbearias) return;
    this.carregandoBarbearias = true;
    this.erroCarregandoBarbearias = false;

    this.barbeariaService.getBarbearias().subscribe({
      next: (barbearias) => {
        this.barbearias = barbearias;
        this.carregandoBarbearias = false;
      },
      error: () => {
        this.erroCarregandoBarbearias = true;
        this.carregandoBarbearias = false;
      },
    });
  }

  protected aoDigitarTelefone(evento: any) {
    const formatado = formatarTelefone(evento.target.value ?? '');
    this.form.telefone = formatado;
    evento.target.value = formatado;
  }

  protected aoDigitarSenha(
    evento: CustomEvent<{ value?: string | number | null }>,
    campo: 'senha' | 'confirmarSenha'
  ) {
    this.form[campo] = String(evento.detail.value ?? '').replace(/\s/g, '');
  }

  // --- Helpers de validação usados no template ---

  protected nomeValido(): boolean {
    if (this.tipo === 'barbeiro') {
      return nomeCompletoValido(this.form.nome);
    }
    // Cliente: basta ter um nome com pelo menos 2 caracteres
    return this.form.nome.trim().length >= 2;
  }

  protected emailOk(): boolean {
    return emailValido(this.form.email);
  }

  protected telefoneOk(): boolean {
    return celularValido(this.form.telefone);
  }

  protected senhaFraca(): boolean {
    return this.form.senha.length < SENHA_MINIMA;
  }

  protected nivelForcaSenha(): number {
    if (!this.form.senha) return 0;
    if (this.form.senha.length < SENHA_MINIMA) return 1;
    if (this.form.senha.length < 8) return 2;
    return 3;
  }

  protected textoForcaSenha(): string {
    switch (this.nivelForcaSenha()) {
      case 1: return 'Fraca';
      case 2: return 'Média';
      case 3: return 'Forte';
      default: return '';
    }
  }

  protected corForcaSenha(): string {
    switch (this.nivelForcaSenha()) {
      case 1: return 'danger';
      case 2: return 'warning';
      case 3: return 'success';
      default: return 'medium';
    }
  }

  protected senhasIguais(): boolean {
    return this.form.senha === this.form.confirmarSenha;
  }

  // --- Cadastro ---

  protected cadastrar() {
    if (this.enviando) return;
    this.tentouEnviar = true;

    const erro = this.validar();
    if (erro) {
      this.mensagemErro = erro;
      return;
    }

    this.enviando = true;
    this.mensagemErro = '';

    this.criarConta().subscribe({
      next: (sessao) => {
        this.enviando = false;
        this.loginService.iniciarSessao(sessao);
        this.router.navigate(['/tabs/barbearias'], { replaceUrl: true });
      },
      error: (err) => {
        this.enviando = false;
        this.mensagemErro = this.traduzirErro(err);
      },
    });
  }

  private criarConta(): Observable<Sessao> {
    const f = this.form;
    const email = f.email.trim().toLowerCase();
    const celular = somenteDigitos(f.telefone);

    if (this.tipo === 'cliente') {
      return this.clienteService
        .createCliente({
          nome: f.nome.trim(),
          email,
          senha: f.senha,
          celular,
        })
        .pipe(map((c) => ({ tipo: 'cliente', id: c.cliente_id!, nome: c.nome })));
    }

    // Barbeiro
    return this.barbeiroService
      .createBarbeiro({
        nome: f.nome.trim(),
        email,
        senha: f.senha,
        foto: null,
        modalidade_atendimento: f.modalidade_atendimento.trim(),
        barbearia_id: f.barbearia_id!,
      })
      .pipe(map((b) => ({ tipo: 'barbeiro', id: b.id_barbeiro!, nome: b.nome })));
  }

  private validar(): string | null {
    const f = this.form;

    // Campos obrigatórios
    if (
      !f.nome.trim() ||
      !f.email.trim() ||
      (this.tipo === 'cliente' && !f.telefone.trim()) ||
      !f.senha ||
      !f.confirmarSenha
    ) {
      return 'Preencha todos os campos.';
    }

    // Nome
    if (this.tipo === 'barbeiro') {
      if (!nomeCompletoValido(f.nome)) {
        return 'Informe seu nome completo (nome e sobrenome).';
      }
    } else {
      if (f.nome.trim().length < 2) {
        return 'Informe seu nome.';
      }
    }

    // E-mail
    if (!emailValido(f.email)) {
      return 'Informe um e-mail válido.';
    }
    if (f.email.trim().length > LIMITE_CURTO) {
      return `O e-mail pode ter no máximo ${LIMITE_CURTO} caracteres.`;
    }

    if (this.tipo === 'cliente') {
      if (!celularValido(f.telefone)) {
        return 'Informe um número de telefone válido com DDD (10 ou 11 dígitos).';
      }
    } else {
      if (!f.modalidade_atendimento.trim()) {
        return 'Informe a modalidade de atendimento.';
      }
      if (!f.barbearia_id || !this.barbearias.some((barbearia) => barbearia.barbearia_id === f.barbearia_id)) {
        return 'Selecione um estabelecimento válido.';
      }
    }

    // Senha
    if (f.senha.length < SENHA_MINIMA) {
      return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
    }
    if (f.senha.length > LIMITE_CURTO) {
      return `A senha pode ter no máximo ${LIMITE_CURTO} caracteres.`;
    }
    if (f.senha !== f.confirmarSenha) {
      return 'As senhas não coincidem.';
    }

    return null;
  }

  private traduzirErro(erro: unknown): string {
    return mensagemDeErro(
      erro,
      'Não foi possível concluir o cadastro. Confira os dados e tente novamente.',
      'Já existe uma conta com esses dados.',
    );
  }

  private novoForm() {
    return {
      nome: '',
      email: '',
      telefone: '',
      modalidade_atendimento: '',
      barbearia_id: null as number | null,
      senha: '',
      confirmarSenha: '',
    };
  }
}
