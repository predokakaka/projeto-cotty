import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { Subject, of, throwError } from 'rxjs';
import { AgendamentoService } from '../../core/services/agendamento';
import { AvisoService } from '../../core/services/aviso.service';
import { BarbeariaService } from '../../core/services/barbearia';
import { BarbeiroService } from '../../core/services/barbeiro';
import { ClienteService } from '../../core/services/cliente';
import { LoginService } from '../../core/services/login.service';
import { ServicoService } from '../../core/services/servico';
import { Agendamento } from '../../shared/models/modelo.agendamento';
import { Barbearia } from '../../shared/models/modelo.barbearia';
import { Barbeiro } from '../../shared/models/modelo.barbeiro';
import { Cliente } from '../../shared/models/modelo.cliente';
import { Servico } from '../../shared/models/modelo.servico';
import { Sessao } from '../../shared/models/modelo.login';
import { AgendamentosPage } from './agendamentos.page';

describe('AgendamentosPage', () => {
  const agendamentoCliente: Agendamento = {
    idAgendamento: 501,
    cliente_id: 7,
    servico_id: 1,
    barbeiro_id: 100,
    barbearia_id: 10,
    horario_agendado: '09:00',
  };
  const agendamentoOutroCliente: Agendamento = {
    ...agendamentoCliente,
    idAgendamento: 502,
    cliente_id: 8,
  };
  const servicos: Servico[] = [
    { servico_id: 1, barbeiro_id: 100, barbearia_id: 10, nome_servico: 'Corte', descricao_servico: null },
  ];
  const barbeiros: Barbeiro[] = [
    { id_barbeiro: 100, barbearia_id: 10, nome: 'Ana', email: '', foto: null, modalidade_atendimento: '' },
  ];
  const barbearias: Barbearia[] = [
    {
      barbearia_id: 10,
      nomeFantasia: 'Central',
      telefone: '',
      endereco: '',
      status: '',
      descricao: '',
      email: '',
      qtdProfissionais: 1,
      foto: null,
    },
  ];
  const clientes: Cliente[] = [
    { cliente_id: 8, nome: 'Outro cliente', email: '', celular: '' },
  ];

  let agendamentoService: jasmine.SpyObj<AgendamentoService>;
  let servicoService: jasmine.SpyObj<ServicoService>;
  let barbeiroService: jasmine.SpyObj<BarbeiroService>;
  let barbeariaService: jasmine.SpyObj<BarbeariaService>;
  let clienteService: jasmine.SpyObj<ClienteService>;
  let avisoService: jasmine.SpyObj<AvisoService>;
  let sessaoAtiva: Sessao | null;
  let confirmarCancelamento: (() => unknown) | null;

  beforeEach(() => {
    sessaoAtiva = { tipo: 'cliente', id: 7, nome: 'Cliente teste' };
    confirmarCancelamento = null;
    agendamentoService = jasmine.createSpyObj('AgendamentoService', [
      'getAgendamentos',
      'excluirAgendamento',
    ]);
    agendamentoService.getAgendamentos.and.returnValue(
      of([agendamentoCliente, agendamentoOutroCliente])
    );
    agendamentoService.excluirAgendamento.and.returnValue(of(agendamentoCliente));
    servicoService = jasmine.createSpyObj('ServicoService', ['getServicos']);
    servicoService.getServicos.and.returnValue(of(servicos));
    barbeiroService = jasmine.createSpyObj('BarbeiroService', ['getBarbeiros']);
    barbeiroService.getBarbeiros.and.returnValue(of(barbeiros));
    barbeariaService = jasmine.createSpyObj('BarbeariaService', ['getBarbearias']);
    barbeariaService.getBarbearias.and.returnValue(of(barbearias));
    clienteService = jasmine.createSpyObj('ClienteService', ['getClientes']);
    clienteService.getClientes.and.returnValue(of(clientes));
    avisoService = jasmine.createSpyObj('AvisoService', ['mostrar']);

    TestBed.configureTestingModule({
      imports: [AgendamentosPage],
      providers: [
        provideRouter([]),
        { provide: AgendamentoService, useValue: agendamentoService },
        { provide: ServicoService, useValue: servicoService },
        { provide: BarbeiroService, useValue: barbeiroService },
        { provide: BarbeariaService, useValue: barbeariaService },
        { provide: ClienteService, useValue: clienteService },
        { provide: LoginService, useValue: { getSessao: () => sessaoAtiva } },
        { provide: AvisoService, useValue: avisoService },
        {
          provide: AlertController,
          useValue: {
            create: (config: unknown) => {
              const botoes = (config as { buttons?: { text?: string; handler?: () => unknown }[] })
                .buttons;
              confirmarCancelamento =
                botoes?.find((botao) => botao.text === 'Cancelar agendamento')?.handler ?? null;
              return Promise.resolve({ present: () => Promise.resolve() });
            },
          },
        },
      ],
    });
  });

  function carregarPagina(): ComponentFixture<AgendamentosPage> {
    const fixture = TestBed.createComponent(AgendamentosPage);
    fixture.detectChanges();
    fixture.componentInstance.ionViewWillEnter();
    fixture.detectChanges();
    return fixture;
  }

  it('consulta a API e lista somente agendamentos associados ao ID da sessão', () => {
    const fixture = carregarPagina();
    const root = fixture.nativeElement as HTMLElement;

    expect(agendamentoService.getAgendamentos).toHaveBeenCalled();
    expect(root.textContent).toContain('Corte');
    expect(root.textContent).toContain('09:00');
    expect(root.textContent).not.toContain('Outro cliente');
    expect(root.querySelectorAll('.cartao-agendamento').length).toBe(1);
  });

  it('filtra a agenda pelo ID do profissional autenticado', () => {
    sessaoAtiva = { tipo: 'barbeiro', id: 100, nome: 'Ana' };

    const fixture = carregarPagina();
    expect(fixture.nativeElement.querySelectorAll('.cartao-agendamento').length).toBe(2);
    expect(clienteService.getClientes).toHaveBeenCalled();
  });

  it('mantém o agendamento até a API confirmar a exclusão', async () => {
    const respostaExclusao = new Subject<Agendamento>();
    agendamentoService.excluirAgendamento.and.returnValue(respostaExclusao);
    const fixture = carregarPagina();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLElement>('.btn-cancelar')?.click();
    await fixture.whenStable();
    expect(root.querySelectorAll('.cartao-agendamento').length).toBe(1);

    confirmarCancelamento?.();
    fixture.detectChanges();
    expect(agendamentoService.excluirAgendamento).toHaveBeenCalledOnceWith(501);
    expect(root.querySelectorAll('.cartao-agendamento').length).toBe(1);
    expect(root.querySelector('.btn-cancelar')?.hasAttribute('disabled')).toBeTrue();

    respostaExclusao.next(agendamentoCliente);
    respostaExclusao.complete();
    fixture.detectChanges();
    expect(root.querySelectorAll('.cartao-agendamento').length).toBe(0);
    expect(avisoService.mostrar).toHaveBeenCalledWith('Agendamento cancelado.');
  });

  it('mantém o registro visível e informa erro quando a exclusão falha', async () => {
    agendamentoService.excluirAgendamento.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0 }))
    );
    const fixture = carregarPagina();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLElement>('.btn-cancelar')?.click();
    await fixture.whenStable();
    confirmarCancelamento?.();
    fixture.detectChanges();

    expect(root.querySelectorAll('.cartao-agendamento').length).toBe(1);
    expect(avisoService.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/Não foi possível falar com o servidor/)
    );
  });

  it('não mostra agendamentos quando a API retorna estrutura inesperada', () => {
    agendamentoService.getAgendamentos.and.returnValue(of({} as Agendamento[]));

    const fixture = carregarPagina();
    expect(fixture.nativeElement.textContent).toContain(
      'O servidor retornou uma resposta inesperada para os agendamentos.'
    );
    expect(fixture.nativeElement.querySelectorAll('.cartao-agendamento').length).toBe(0);
  });

  it('mostra erro quando a consulta de agendamentos falha', () => {
    agendamentoService.getAgendamentos.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0 }))
    );
    spyOn(console, 'error');

    const fixture = carregarPagina();
    expect(fixture.nativeElement.textContent).toContain('Verifique sua conexão');
  });
});
