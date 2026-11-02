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

  protected atualizar(evento: any) {
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
      error: () => {
        this.cancelandoId = null;
        this.aviso.mostrar('Não foi possível cancelar o agendamento. Tente novamente.');
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
        const lista = Array.isArray(agendamentos) ? agendamentos : [];

        this.itens = lista
          .filter((a) => this.pertenceASessao(a, sessao))
          .map((a) => ({
            idAgendamento: a.idAgendamento,
            servico:
              servicos.find((s) => Number(s.servico_id) === Number(a.servico_id))?.nome_servico ??
              'Serviço',
            barbeiro:
              barbeiros.find((b) => Number(b.id_barbeiro) === Number(a.barbeiro_id))?.nome ??
              'Profissional',
            barbearia:
              barbearias.find((b) => Number(b.barbearia_id) === Number(a.barbearia_id))
                ?.nomeFantasia ?? 'Estabelecimento',
            cliente:
              clientes.find((c) => Number(c.cliente_id) === Number(a.cliente_id))?.nome ?? 'Cliente',
            horario: a.horario_agendado,
          }))
          .sort((x, y) => x.horario.localeCompare(y.horario, 'pt-BR', { numeric: true }));

        this.carregando = false;
        aoFinalizar?.();
      },
      error: (err) => {
        console.error('Falha ao carregar agendamentos', err);
        this.comErro = true;
        this.carregando = false;
        aoFinalizar?.();
      },
    });
  }

  private pertenceASessao(a: Agendamento, sessao: Sessao): boolean {
    switch (sessao.tipo) {
      case 'cliente':
        return Number(a.cliente_id) === sessao.id;
      case 'barbeiro':
        return Number(a.barbeiro_id) === sessao.id;
      case 'barbearia':
        return Number(a.barbearia_id) === sessao.id;
    }
  }
}
