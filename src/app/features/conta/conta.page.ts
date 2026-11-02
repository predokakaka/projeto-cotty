import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonIcon,
  IonButton,
  IonBadge,
  IonSpinner,
  IonSkeletonText,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline } from 'ionicons/icons';
import { Sessao, TipoConta } from '../../shared/models/modelo.login';
import { Barbeiro } from '../../shared/models/modelo.barbeiro';
import { Cliente } from '../../shared/models/modelo.cliente';
import { LoginService } from '../../core/services/login.service';
import { AvisoService } from '../../core/services/aviso.service';
import { ClienteService } from '../../core/services/cliente';
import { BarbeiroService } from '../../core/services/barbeiro';
import { somenteDigitos } from '../../shared/utils/documento';
import { mensagemDeErro } from '../../shared/utils/erro';
import { LIMITE_CURTO, celularValido, emailValido } from '../../shared/utils/validacao';

const ROTULOS: Record<TipoConta, string> = {
  cliente: 'Cliente',
  barbeiro: 'Profissional',
  barbearia: 'Estabelecimento',
};

/**
 * Conta de quem está logado.
 *  - cliente e barbeiro: editam os próprios dados, saem ou excluem a conta;
 *  - barbearia: o perfil e a exclusão ficam na página da própria barbearia
 *    (o backend pede a senha para alterar/excluir).
 */
@Component({
  selector: 'app-conta',
  templateUrl: 'conta.page.html',
  styleUrls: ['conta.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonIcon,
    IonButton,
    IonBadge,
    IonSpinner,
    IonSkeletonText,
  ],
})
export class ContaPage {
  private loginService = inject(LoginService);
  private clienteService = inject(ClienteService);
  private barbeiroService = inject(BarbeiroService);
  private alertController = inject(AlertController);
  private aviso = inject(AvisoService);
  private router = inject(Router);

  protected readonly limiteCurto = LIMITE_CURTO;

  protected sessao: Sessao | null = null;
  protected form = { nome: '', email: '', celular: '' };
  protected carregando = false;
  protected comErro = false;
  protected salvando = false;
  protected excluindo = false;
  protected mensagemErro = '';

  private barbeiroAtual: Barbeiro | null = null;

  constructor() {
    addIcons({ 'person-circle-outline': personCircleOutline });
  }

  public ionViewWillEnter() {
    this.sessao = this.loginService.getSessao();
    this.mensagemErro = '';
    this.comErro = false;
    this.barbeiroAtual = null;

    if (this.sessao?.tipo === 'cliente') {
      this.carregarCliente(this.sessao.id);
    } else if (this.sessao?.tipo === 'barbeiro') {
      this.carregarBarbeiro(this.sessao.id);
    }
  }

  protected get nomeSessao(): string {
    return this.sessao?.nome ?? '';
  }

  protected get ehCliente(): boolean {
    return this.sessao?.tipo === 'cliente';
  }

  protected get rotuloTipo(): string {
    return this.sessao ? ROTULOS[this.sessao.tipo] : '';
  }

  protected get editavel(): boolean {
    return this.sessao?.tipo === 'cliente' || this.sessao?.tipo === 'barbeiro';
  }

  protected irParaLogin() {
    this.router.navigate(['/login']);
  }

  protected verBarbearia() {
    if (this.sessao?.tipo === 'barbearia') {
      this.router.navigate(['/barbearia', this.sessao.id]);
    }
  }

  protected sair() {
    this.loginService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  protected salvar() {
    const sessao = this.sessao;
    if (this.salvando || !sessao || !this.editavel) return;

    const erro = this.validar(sessao);
    if (erro) {
      this.mensagemErro = erro;
      return;
    }

    this.salvando = true;
    this.mensagemErro = '';

    const nome = this.form.nome.trim();
    const email = this.form.email.trim().toLowerCase();

    const requisicao: Observable<unknown> =
      sessao.tipo === 'cliente'
        ? this.clienteService.updateCliente(sessao.id, {
            nome,
            email,
            celular: somenteDigitos(this.form.celular),
          })
        : this.barbeiroService.updateBarbeiro(sessao.id, {
            nome,
            email,
            foto: this.barbeiroAtual?.foto ?? null,
          });

    requisicao.subscribe({
      next: () => {
        this.salvando = false;
        this.form.nome = nome;
        this.form.email = email;
        this.loginService.atualizarNomeSessao(nome);
        this.sessao = this.loginService.getSessao();
        this.aviso.mostrar('Dados atualizados.');
      },
      error: (err) => {
        this.salvando = false;
        this.mensagemErro = mensagemDeErro(
          err,
          'Não foi possível salvar as alterações.',
          'Já existe uma conta com esses dados.'
        );
      },
    });
  }

  protected async confirmarExclusao() {
    const alerta = await this.alertController.create({
      header: 'Excluir conta',
      message: 'Esta ação não pode ser desfeita. Deseja excluir sua conta?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.excluir();
          },
        },
      ],
    });
    await alerta.present();
  }

  private excluir() {
    const sessao = this.sessao;
    if (!sessao || !this.editavel) return;

    this.excluindo = true;
    this.mensagemErro = '';

    const requisicao: Observable<unknown> =
      sessao.tipo === 'cliente'
        ? this.clienteService.deleteCliente(sessao.id)
        : this.barbeiroService.deleteBarbeiro(sessao.id);

    requisicao.subscribe({
      next: () => {
        this.excluindo = false;
        this.loginService.logout();
        this.router.navigate(['/login'], { replaceUrl: true });
        this.aviso.mostrar('Conta excluída.');
      },
      error: () => {
        this.excluindo = false;
        this.mensagemErro =
          'Não foi possível excluir a conta. Se houver agendamentos ou serviços vinculados, remova-os antes.';
      },
    });
  }

  private carregarCliente(cliente_id: number) {
    this.carregando = true;
    this.clienteService.getClienteById(cliente_id).subscribe({
      next: (resposta) => {
        this.carregando = false;
        if (resposta && 'email' in resposta) {
          const cliente = resposta as Cliente;
          this.form = { nome: cliente.nome, email: cliente.email, celular: cliente.celular ?? '' };
        } else {
          this.comErro = true;
        }
      },
      error: () => {
        this.carregando = false;
        this.comErro = true;
      },
    });
  }

  private carregarBarbeiro(id_barbeiro: number) {
    this.carregando = true;
    this.barbeiroService.getBarbeiros().subscribe({
      next: (lista) => {
        this.carregando = false;
        const barbeiro = lista.find((b) => Number(b.id_barbeiro) === id_barbeiro);
        if (barbeiro) {
          this.barbeiroAtual = barbeiro;
          this.form = { nome: barbeiro.nome, email: barbeiro.email, celular: '' };
        } else {
          this.comErro = true;
        }
      },
      error: () => {
        this.carregando = false;
        this.comErro = true;
      },
    });
  }

  private validar(sessao: Sessao): string | null {
    const f = this.form;
    if (!f.nome.trim() || !f.email.trim()) return 'Preencha todos os campos.';
    if (!emailValido(f.email)) return 'Informe um e-mail válido.';
    if (f.nome.trim().length > LIMITE_CURTO || f.email.trim().length > LIMITE_CURTO) {
      return `Nome e e-mail podem ter no máximo ${LIMITE_CURTO} caracteres.`;
    }
    if (sessao.tipo === 'cliente' && !celularValido(f.celular)) return 'Informe um celular válido, com DDD.';
    return null;
  }
}
