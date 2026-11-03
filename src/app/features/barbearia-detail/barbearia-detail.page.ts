import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonSkeletonText,
  IonImg,
  IonIcon,
  IonButton,
  IonBadge,
  IonProgressBar,
  IonRefresher,
  IonRefresherContent,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  checkmarkCircleOutline,
  locationOutline,
  cutOutline,
  callOutline,
  peopleOutline,
  timeOutline,
  calendarOutline,
  personOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { forkJoin, of } from 'rxjs';
import { BarbeariaService } from '../../core/services/barbearia';
import { ServicoService } from '../../core/services/servico';
import { HorarioService } from '../../core/services/horario';
import { BarbeiroService } from '../../core/services/barbeiro';
import { AgendamentoService } from '../../core/services/agendamento';
import { LoginService } from '../../core/services/login.service';
import { AvisoService } from '../../core/services/aviso.service';
import { Barbearia } from '../../shared/models/modelo.barbearia';
import { Barbeiro } from '../../shared/models/modelo.barbeiro';
import { Servico } from '../../shared/models/modelo.servico';
import { Horario } from '../../shared/models/modelo.horario';
import { Agendamento, AgendamentoCriacao } from '../../shared/models/modelo.agendamento';
import { MSG_SEM_CONEXAO, mensagemDeErro } from '../../shared/utils/erro';
import { listaOuVazia } from '../../shared/utils/rx';

@Component({
  selector: 'app-barbearia-detail',
  templateUrl: 'barbearia-detail.page.html',
  styleUrls: ['barbearia-detail.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonSkeletonText,
    IonImg,
    IonIcon,
    IonButton,
    IonBadge,
    IonProgressBar,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class BarbeariaDetailPage {
  private route = inject(ActivatedRoute);
  private barbeariaService = inject(BarbeariaService);
  private servicoService = inject(ServicoService);
  private horarioService = inject(HorarioService);
  private barbeiroService = inject(BarbeiroService);
  private agendamentoService = inject(AgendamentoService);
  private loginService = inject(LoginService);
  private alertController = inject(AlertController);
  private aviso = inject(AvisoService);
  private router = inject(Router);

  @ViewChild(IonContent) private conteudo?: IonContent;
  @ViewChild('secaoServicos', { read: ElementRef })
  private elementoServicos?: ElementRef<HTMLElement>;
  @ViewChild('secaoAgendamento', { read: ElementRef })
  private elementoAgendamento?: ElementRef<HTMLElement>;

  protected barbearia: Barbearia | null = null;
  protected barbeiros: Barbeiro[] = [];
  protected servicos: Servico[] = [];
  // Recalculado só quando muda a seleção ou os dados (e não a cada ciclo de renderização).
  protected horariosDisponiveis: Horario[] = [];

  protected servicoSelecionado: Servico | null = null;
  protected horarioSelecionado: Horario | null = null;

  protected carregando = true;
  protected comErro = false;
  protected excluindo = false;
  protected agendando = false;

  private nomesBarbeiros = new Map<number, string>();
  private todosHorarios: Horario[] = [];
  private perfilCarregadoId: number | null = null;
  private requisicaoEmAndamento = false;
  // Agendamentos já feitos: escondem horários ocupados (o backend não marca `disponivel = false`).
  private agendamentosExistentes: Agendamento[] = [];

  constructor() {
    addIcons({
      'arrow-forward-outline': arrowForwardOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'location-outline': locationOutline,
      'cut-outline': cutOutline,
      'call-outline': callOutline,
      'people-outline': peopleOutline,
      'time-outline': timeOutline,
      'calendar-outline': calendarOutline,
      'person-outline': personOutline,
      'information-circle-outline': informationCircleOutline,
    });
  }

  private get barbeariaId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  protected get ehDono(): boolean {
    const sessao = this.loginService.getSessao();
    return !!this.barbearia && sessao?.tipo === 'barbearia' && sessao.id === this.barbearia.barbearia_id;
  }

  protected get ehCliente(): boolean {
    return this.loginService.getSessao()?.tipo === 'cliente';
  }

  protected get ehVisitante(): boolean {
    return !this.loginService.getSessao();
  }

  protected get podeIniciarAgendamento(): boolean {
    return this.ehVisitante || this.ehCliente;
  }

  protected get podeConfirmarAgendamento(): boolean {
    return this.ehCliente && !!this.servicoSelecionado && !!this.horarioSelecionado && !this.agendando;
  }

  protected get podeContinuarAgendamento(): boolean {
    return (
      this.podeIniciarAgendamento &&
      !!this.servicoSelecionado &&
      !!this.horarioSelecionado &&
      !this.agendando
    );
  }

  protected get etapaAgendamento(): number {
    if (!this.servicoSelecionado) return 1;
    if (!this.horarioSelecionado) return 2;
    return 3;
  }

  protected get rotuloProgressoAgendamento(): string {
    const etapa = this.etapaAgendamento;
    return etapa === 3
      ? 'Tudo pronto: confirme seu agendamento.'
      : `Etapa ${etapa} de 3: ${etapa === 1 ? 'escolha um serviço.' : 'escolha um horário.'}`;
  }

  public ionViewWillEnter() {
    if (!this.barbeariaId) {
      this.carregando = false;
      this.comErro = true;
      return;
    }
    if (this.perfilCarregadoId === this.barbeariaId && !this.comErro) {
      if (this.barbearia) {
        this.restaurarSelecaoAgendamento();
      }
      return;
    }
    this.carregarDados();
  }

  protected atualizar(evento: any) {
    if (this.barbeariaId) {
      this.carregarDados(() => evento.target.complete());
    } else {
      evento.target.complete();
    }
  }

  protected buscarNovamente() {
    if (this.barbeariaId) {
      this.carregarDados();
    }
  }

  protected obterNomeBarbeiro(barbeiro_id: number): string {
    return this.nomesBarbeiros.get(Number(barbeiro_id)) || 'Profissional';
  }

  protected selecionarServico(servico: Servico) {
    this.servicoSelecionado = servico;
    this.horarioSelecionado = null;
    this.atualizarHorarios();
    this.rolarAte(this.elementoAgendamento);
  }

  protected selecionarHorario(horario: Horario) {
    this.horarioSelecionado = horario;
  }

  protected iniciarAgendamento() {
    this.rolarAte(this.elementoServicos);
  }

  protected irParaLogin() {
    const queryParams: Record<string, number> = {};
    if (this.servicoSelecionado) {
      queryParams['servico_id'] = this.servicoSelecionado.servico_id;
    }
    if (this.horarioSelecionado) {
      queryParams['horario_id'] = this.horarioSelecionado.horario_id;
    }

    const returnUrl = this.router.serializeUrl(
      this.router.createUrlTree(['/barbearia', this.barbeariaId], { queryParams })
    );
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }

  protected continuarAgendamento() {
    if (!this.podeContinuarAgendamento) return;

    if (this.ehVisitante) {
      this.irParaLogin();
      return;
    }

    this.solicitarConfirmacaoAgendamento();
  }

  protected async solicitarConfirmacaoAgendamento() {
    if (!this.podeConfirmarAgendamento || !this.servicoSelecionado || !this.horarioSelecionado) return;

    const { nome_servico, barbeiro_id } = this.servicoSelecionado;
    const alerta = await this.alertController.create({
      header: 'Confirmar agendamento',
      message: `Deseja agendar "${nome_servico}" com ${this.obterNomeBarbeiro(barbeiro_id)} no horário ${this.horarioSelecionado.horario}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Confirmar', handler: () => this.executarAgendamento() },
      ],
    });
    await alerta.present();
  }

  protected async confirmarExclusao() {
    if (!this.ehDono) return;

    const alerta = await this.alertController.create({
      header: 'Excluir conta',
      message: 'Esta ação não pode ser desfeita. Digite sua senha para confirmar.',
      inputs: [{
        name: 'senha',
        type: 'password',
        placeholder: 'Sua senha',
        attributes: { pattern: '\\S*' },
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: (dados: { senha?: string }) => {
            if (!dados.senha || /\s/.test(dados.senha)) return false;
            this.excluir(dados.senha);
            return true;
          },
        },
      ],
    });
    await alerta.present();
  }

  private carregarDados(aoFinalizar?: () => void) {
    const barbearia_id = this.barbeariaId;
    if (this.requisicaoEmAndamento) {
      aoFinalizar?.();
      return;
    }
    this.requisicaoEmAndamento = true;
    this.carregando = true;
    this.comErro = false;
    this.servicoSelecionado = null;
    this.horarioSelecionado = null;

    forkJoin({
      barbearia: this.barbeariaService.getBarbeariaById(barbearia_id),
      servicos: listaOuVazia(this.servicoService.getServicos()),
      barbeiros: this.barbeiroService.getBarbeiros(),
      horarios: listaOuVazia(this.horarioService.getHorariosPorBarbearia(barbearia_id)),
      agendamentos:
        this.loginService.getSessao()?.tipo === 'cliente'
          ? listaOuVazia(this.agendamentoService.getAgendamentos())
          : of([] as Agendamento[]),
    }).subscribe({
      next: ({ barbearia, servicos, barbeiros, horarios, agendamentos }) => {
        this.carregando = false;
        this.requisicaoEmAndamento = false;
        this.comErro = false;
        this.barbearia = barbearia;

        if (barbearia) {
          this.barbeiros = barbeiros
            .filter((barbeiro) => Number(barbeiro.barbearia_id) === barbearia_id)
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
          const idsBarbeiros = new Set(this.barbeiros.map((barbeiro) => Number(barbeiro.id_barbeiro)));
          this.servicos = servicos.filter(
            (servico) =>
              Number(servico.barbearia_id) === barbearia_id &&
              idsBarbeiros.has(Number(servico.barbeiro_id))
          );
          this.nomesBarbeiros = new Map(
            this.barbeiros.map((barbeiro) => [Number(barbeiro.id_barbeiro), barbeiro.nome])
          );
          this.todosHorarios = horarios;
          this.agendamentosExistentes = Array.isArray(agendamentos) ? agendamentos : [];
          this.perfilCarregadoId = barbearia_id;
          this.atualizarHorarios();
          this.restaurarSelecaoAgendamento();
        } else {
          this.barbeiros = [];
          this.servicos = [];
          this.perfilCarregadoId = barbearia_id;
        }
        aoFinalizar?.();
      },
      error: (err) => {
        console.error('Falha ao carregar dados da barbearia', err);
        this.carregando = false;
        this.requisicaoEmAndamento = false;
        this.comErro = true;
        this.barbearia = null;
        this.perfilCarregadoId = null;
        aoFinalizar?.();
      },
    });
  }

  private async rolarAte(elemento?: ElementRef<HTMLElement>) {
    const conteudo = this.conteudo;
    const alvo = elemento?.nativeElement;
    if (!conteudo || !alvo) return;

    const areaRolagem = await conteudo.getScrollElement();
    const distancia = alvo.getBoundingClientRect().top - areaRolagem.getBoundingClientRect().top;
    await conteudo.scrollToPoint(0, areaRolagem.scrollTop + distancia - 12, 300);
  }

  private restaurarSelecaoAgendamento() {
    const servicoId = this.route.snapshot.queryParamMap.get('servico_id');
    const horarioId = this.route.snapshot.queryParamMap.get('horario_id');
    if (!servicoId || !horarioId) return;

    const servico = this.servicos.find((item) => Number(item.servico_id) === Number(servicoId));
    if (!servico) return;

    this.servicoSelecionado = servico;
    this.atualizarHorarios();
    this.horarioSelecionado =
      this.horariosDisponiveis.find((item) => Number(item.horario_id) === Number(horarioId)) ?? null;
  }

  /** Horários livres do barbeiro do serviço escolhido: marcados como disponíveis e sem agendamento. */
  private atualizarHorarios() {
    const servico = this.servicoSelecionado;
    if (!servico) {
      this.horariosDisponiveis = [];
      return;
    }

    const chave = (barbeiro: number, barbearia: number, horario: string) =>
      `${Number(barbeiro)}|${Number(barbearia)}|${horario}`;
    const ocupados = new Set(
      this.agendamentosExistentes.map((a) => chave(a.barbeiro_id, a.barbearia_id, a.horario_agendado))
    );

    this.horariosDisponiveis = this.todosHorarios.filter(
      (h) =>
        Number(h.barbeiro_id) === Number(servico.barbeiro_id) &&
        !!h.disponivel &&
        !ocupados.has(chave(h.barbeiro_id, h.barbearia_id, h.horario))
    );
  }

  private executarAgendamento() {
    const sessao = this.loginService.getSessao();
    const servico = this.servicoSelecionado;
    const horario = this.horarioSelecionado;

    if (sessao?.tipo !== 'cliente' || !this.barbearia?.barbearia_id || !servico || !horario) {
      this.aviso.mostrar('Você precisa estar conectado como cliente para agendar.');
      return;
    }

    const dados: AgendamentoCriacao = {
      cliente_id: sessao.id,
      servico_id: servico.servico_id,
      barbeiro_id: servico.barbeiro_id,
      barbearia_id: this.barbearia.barbearia_id,
      horario_agendado: horario.horario,
    };

    this.agendando = true;
    this.agendamentoService.criarAgendamento(dados).subscribe({
      next: (criado) => {
        this.agendando = false;
        // Guarda o agendamento criado: o horário continua escondido mesmo após recarregar a lista.
        this.agendamentosExistentes = [...this.agendamentosExistentes, criado];
        this.horarioSelecionado = null;
        this.atualizarHorarios();
        this.aviso.mostrar('Agendamento confirmado com sucesso!');
      },
      error: (erro) => {
        this.agendando = false;
        this.horarioSelecionado = null;
        this.recarregarAgendamentos();
        // P2002 = valor duplicado: pode ser horário já reservado ou conflito de registro.
        this.aviso.mostrar(
          mensagemDeErro(
            erro,
            'Não foi possível concluir o agendamento. Tente novamente.',
            'Não foi possível reservar este horário porque ele já está ocupado. Escolha outro.'
          )
        );
      },
    });
  }

  /** Busca de novo os agendamentos para refletir o que mudou no servidor. */
  private recarregarAgendamentos() {
    this.agendamentoService.getAgendamentos().subscribe({
      next: (lista) => {
        this.agendamentosExistentes = Array.isArray(lista) ? lista : [];
        this.atualizarHorarios();
      },
      error: () => {
        // sem rede: mantém o que já estava na tela
      },
    });
  }

  private excluir(senha: string) {
    const barbearia = this.barbearia;
    if (!this.ehDono || !barbearia?.barbearia_id || !barbearia.email) {
      this.aviso.mostrar('Não foi possível identificar a conta para excluir.');
      return;
    }

    this.excluindo = true;
    this.barbeariaService.deleteBarbearia(barbearia.barbearia_id, { email: barbearia.email, senha }).subscribe({
      next: () => {
        this.excluindo = false;
        this.loginService.logout();
        this.router.navigate(['/login'], { replaceUrl: true });
        this.aviso.mostrar('Conta excluída.');
      },
      error: (erro) => {
        this.excluindo = false;
        this.aviso.mostrar(this.traduzirErroExclusao(erro));
      },
    });
  }

  private traduzirErroExclusao(erro: unknown): string {
    const { name, status } = (erro ?? {}) as { name?: string; status?: number };
    // O backend não responde quando a senha está errada, então o tempo limite estoura.
    if (name === 'TimeoutError') {
      return 'Senha incorreta ou servidor sem resposta. Confira a senha e tente de novo.';
    }
    if (status === 0) return MSG_SEM_CONEXAO;
    return 'Não foi possível excluir a conta. Se o estabelecimento tiver serviços ou horários cadastrados, remova-os antes.';
  }
}
