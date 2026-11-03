import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonSpinner,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  cutOutline,
  personOutline,
  storefrontOutline,
  timeOutline,
} from 'ionicons/icons';
import { forkJoin, of } from 'rxjs';
import { Agendamento } from '../../shared/models/modelo.agendamento';
import { Cliente } from '../../shared/models/modelo.cliente';
import { Sessao, TipoConta } from '../../shared/models/modelo.login';
import { AgendamentoService } from '../../core/services/agendamento';
import { ServicoService } from '../../core/services/servico';
import { BarbeiroService } from '../../core/services/barbeiro';
import { BarbeariaService } from '../../core/services/barbearia';
import { ClienteService } from '../../core/services/cliente';
import { LoginService } from '../../core/services/login.service';
import { AvisoService } from '../../core/services/aviso.service';
import { listaOuVazia } from '../../shared/utils/rx';
import { mensagemDeErro } from '../../shared/utils/erro';
import type { RefresherCustomEvent } from '@ionic/core';

const TITULOS: Record<TipoConta, string> = {
  cliente: 'Meus agendamentos',
  barbeiro: 'Minha agenda',
  barbearia: 'Agenda do estabelecimento',
};

interface AgendamentoItem {
  idAgendamento: number;
  servico: string;
  barbeiro: string;
  barbearia: string;
  cliente: string;
  horario: string;
}

/**
 * Lista de agendamentos de quem está logado:
 *  - cliente: os agendamentos que ele fez (pode cancelar);
 *  - barbeiro: a agenda dele;
 *  - barbearia: os agendamentos recebidos.
 * O backend devolve todos os agendamentos em GET /agendamento, então o filtro é feito aqui.
 */
@Component({
  selector: 'app-agendamentos',
  templateUrl: 'agendamentos.page.html',
  styleUrls: ['agendamentos.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonSpinner,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class AgendamentosPage {
  private agendamentoService = inject(AgendamentoService);
  private servicoService = inject(ServicoService);
  private barbeiroService = inject(BarbeiroService);
  private barbeariaService = inject(BarbeariaService);
  private clienteService = inject(ClienteService);
  private loginService = inject(LoginService);
  private alertController = inject(AlertController);
  private aviso = inject(AvisoService);
  private router = inject(Router);

  protected sessao: Sessao | null = null;
  protected itens: AgendamentoItem[] = [];
  protected carregando = true;
  protected comErro = false;
  protected mensagemErro = 'Não foi possível carregar os agendamentos agora.';
  protected cancelandoId: number | null = null;

  constructor() {
    addIcons({
      'calendar-outline': calendarOutline,
      'cut-outline': cutOutline,
      'person-outline': personOutline,
      'storefront-outline': storefrontOutline,
      'time-outline': timeOutline,
    });
  }

  public ionViewWillEnter() {
    this.carregar();
  }

  protected atualizar(evento: RefresherCustomEvent) {
    this.carregar(() => evento.target.complete());
  }

  protected get titulo(): string {
    return TITULOS[this.tipo ?? 'cliente'];
  }

  protected get tipo() {
    return this.sessao?.tipo;
  }

  protected irParaLogin() {
    this.router.navigate(['/login']);
  }

  protected irParaBarbearias() {
    this.router.navigate(['/tabs/barbearias']);
  }

  protected async cancelar(item: AgendamentoItem) {
    const alerta = await this.alertController.create({
      header: 'Cancelar agendamento',
      message: `Deseja cancelar "${item.servico}" às ${item.horario}?`,
      buttons: [
        { text: 'Voltar', role: 'cancel' },
        {
          text: 'Cancelar agendamento',
          role: 'destructive',
          handler: () => {
            this.executarCancelamento(item);
          },
        },
      ],
    });
    await alerta.present();
  }

  private executarCancelamento(item: AgendamentoItem) {
    this.cancelandoId = item.idAgendamento;
    this.agendamentoService.excluirAgendamento(item.idAgendamento).subscribe({
      next: () => {
        this.cancelandoId = null;
        this.itens = this.itens.filter((i) => i.idAgendamento !== item.idAgendamento);
        this.aviso.mostrar('Agendamento cancelado.');
      },
      error: (erro) => {
        this.cancelandoId = null;
        this.aviso.mostrar(
          mensagemDeErro(erro, 'Não foi possível cancelar o agendamento. Tente novamente.')
        );
      },
    });
  }

  private carregar(aoFinalizar?: () => void) {
    const sessao = this.loginService.getSessao();
    this.sessao = sessao;

    if (!sessao) {
      this.itens = [];
      this.carregando = false;
      this.comErro = false;
      aoFinalizar?.();
      return;
    }

    this.carregando = true;
    this.comErro = false;
    this.mensagemErro = 'Não foi possível carregar os agendamentos agora.';

    forkJoin({
      agendamentos: this.agendamentoService.getAgendamentos(),
      servicos: listaOuVazia(this.servicoService.getServicos()),
      barbeiros: listaOuVazia(this.barbeiroService.getBarbeiros()),
      barbearias: listaOuVazia(this.barbeariaService.getBarbearias()),
      // O cliente só vê os próprios agendamentos, então não precisa da lista de clientes.
      clientes:
        sessao.tipo === 'cliente' ? of([] as Cliente[]) : listaOuVazia(this.clienteService.getClientes()),
    }).subscribe({
      next: ({ agendamentos, servicos, barbeiros, barbearias, clientes }) => {
        if (!Array.isArray(agendamentos)) {
          this.itens = [];
          this.comErro = true;
          this.mensagemErro = 'O servidor retornou uma resposta inesperada para os agendamentos.';
          this.carregando = false;
          aoFinalizar?.();
          return;
        }

        if (!agendamentos.every((agendamento) => this.agendamentoValido(agendamento))) {
          this.itens = [];
          this.comErro = true;
          this.mensagemErro = 'O servidor retornou uma resposta inesperada para os agendamentos.';
          this.carregando = false;
          aoFinalizar?.();
          return;
        }

        const servicosPorChave = new Map(
          servicos.map((servico) => [
            `${Number(servico.servico_id)}:${Number(servico.barbeiro_id)}:${Number(servico.barbearia_id)}`,
            servico.nome_servico,
          ])
        );
        const barbeirosPorChave = new Map(
          barbeiros.map((barbeiro) => [
            `${Number(barbeiro.id_barbeiro)}:${Number(barbeiro.barbearia_id)}`,
            barbeiro.nome,
          ])
        );
        const barbeariasPorId = new Map(
          barbearias.map((barbearia) => [Number(barbearia.barbearia_id), barbearia.nomeFantasia])
        );
        const clientesPorId = new Map(
          clientes.map((cliente) => [Number(cliente.cliente_id), cliente.nome])
        );

        this.itens = agendamentos
          .filter((a) => this.pertenceASessao(a, sessao))
          .map((a) => ({
            idAgendamento: a.idAgendamento,
            servico:
              servicosPorChave.get(`${a.servico_id}:${a.barbeiro_id}:${a.barbearia_id}`) ??
              'Serviço',
            barbeiro: barbeirosPorChave.get(`${a.barbeiro_id}:${a.barbearia_id}`) ?? 'Profissional',
            barbearia: barbeariasPorId.get(a.barbearia_id) ?? 'Estabelecimento',
            cliente: clientesPorId.get(a.cliente_id) ?? 'Cliente',
            horario: a.horario_agendado,
          }))
          .sort((x, y) => x.horario.localeCompare(y.horario, 'pt-BR', { numeric: true }));

        this.carregando = false;
        aoFinalizar?.();
      },
      error: (err) => {
        this.comErro = true;
        this.mensagemErro = mensagemDeErro(
          err,
          'Não foi possível carregar os agendamentos agora. Tente novamente.'
        );
        this.carregando = false;
        aoFinalizar?.();
      },
    });
  }

  private agendamentoValido(agendamento: Agendamento): boolean {
    return (
      !!agendamento &&
      Number.isSafeInteger(agendamento.idAgendamento) &&
      agendamento.idAgendamento > 0 &&
      Number.isSafeInteger(agendamento.cliente_id) &&
      agendamento.cliente_id > 0 &&
      Number.isSafeInteger(agendamento.servico_id) &&
      agendamento.servico_id > 0 &&
      Number.isSafeInteger(agendamento.barbeiro_id) &&
      agendamento.barbeiro_id > 0 &&
      Number.isSafeInteger(agendamento.barbearia_id) &&
      agendamento.barbearia_id > 0 &&
      typeof agendamento.horario_agendado === 'string'
    );
  }

  private pertenceASessao(a: Agendamento, sessao: Sessao): boolean {
    switch (sessao.tipo) {
      case 'cliente':
        return a.cliente_id === sessao.id;
      case 'barbeiro':
        return a.barbeiro_id === sessao.id;
      case 'barbearia':
        return a.barbearia_id === sessao.id;
    }
  }
}
