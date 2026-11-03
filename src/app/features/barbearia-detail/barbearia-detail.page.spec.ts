import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { of, throwError } from 'rxjs';
import { AgendamentoService } from '../../core/services/agendamento';
import { AvisoService } from '../../core/services/aviso.service';
import { BarbeariaService } from '../../core/services/barbearia';
import { BarbeiroService } from '../../core/services/barbeiro';
import { HorarioService } from '../../core/services/horario';
import { LoginService } from '../../core/services/login.service';
import { ServicoService } from '../../core/services/servico';
import { Barbearia } from '../../shared/models/modelo.barbearia';
import { Barbeiro } from '../../shared/models/modelo.barbeiro';
import { Horario } from '../../shared/models/modelo.horario';
import { Servico } from '../../shared/models/modelo.servico';
import { Agendamento } from '../../shared/models/modelo.agendamento';
import { Sessao } from '../../shared/models/modelo.login';
import { BarbeariaDetailPage } from './barbearia-detail.page';

describe('BarbeariaDetailPage - serviços e horários', () => {
  const barbearia: Barbearia = {
    barbearia_id: 10,
    nomeFantasia: 'Barbearia Central',
    telefone: '',
    endereco: '',
    status: '',
    descricao: '',
    email: '',
    qtdProfissionais: 3,
    foto: null,
  };
  const barbeiros: Barbeiro[] = [
    { id_barbeiro: 100, barbearia_id: 10, nome: 'Ana', email: '', foto: null, modalidade_atendimento: '' },
    { id_barbeiro: 101, barbearia_id: 10, nome: 'Beto', email: '', foto: null, modalidade_atendimento: '' },
    { id_barbeiro: 102, barbearia_id: 10, nome: 'Caio', email: '', foto: null, modalidade_atendimento: '' },
    { id_barbeiro: 200, barbearia_id: 20, nome: 'Dora', email: '', foto: null, modalidade_atendimento: '' },
  ];
  const servicos: Servico[] = [
    { servico_id: 1, barbeiro_id: 100, barbearia_id: 10, nome_servico: 'Corte Ana', descricao_servico: null },
    { servico_id: 2, barbeiro_id: 101, barbearia_id: 10, nome_servico: 'Corte Beto', descricao_servico: null },
    { servico_id: 3, barbeiro_id: 200, barbearia_id: 20, nome_servico: 'Corte Dora', descricao_servico: null },
    { servico_id: 4, barbeiro_id: 999, barbearia_id: 10, nome_servico: 'Sem profissional', descricao_servico: null },
  ];
  const horarios: Horario[] = [
    { horario_id: 11, barbeiro_id: 100, barbearia_id: 10, horario: '09:00', disponivel: true },
    { horario_id: 12, barbeiro_id: 100, barbearia_id: 10, horario: '10:00', disponivel: false },
    { horario_id: 13, barbeiro_id: 101, barbearia_id: 10, horario: '11:00', disponivel: true },
    { horario_id: 14, barbeiro_id: 100, barbearia_id: 20, horario: '12:00', disponivel: true },
  ];

  let servicoService: jasmine.SpyObj<ServicoService>;
  let horarioService: jasmine.SpyObj<HorarioService>;
  let barbeiroService: jasmine.SpyObj<BarbeiroService>;
  let agendamentoService: jasmine.SpyObj<AgendamentoService>;
  let avisoService: jasmine.SpyObj<AvisoService>;
  let sessaoAtiva: Sessao | null;
  let confirmarAgendamento: (() => unknown) | null;

  beforeEach(() => {
    sessaoAtiva = null;
    confirmarAgendamento = null;
    servicoService = jasmine.createSpyObj('ServicoService', ['getServicos']);
    servicoService.getServicos.and.returnValue(of(servicos));
    horarioService = jasmine.createSpyObj('HorarioService', ['getHorariosPorBarbearia']);
    horarioService.getHorariosPorBarbearia.and.returnValue(of(horarios));
    barbeiroService = jasmine.createSpyObj('BarbeiroService', ['getBarbeiros']);
    barbeiroService.getBarbeiros.and.returnValue(of(barbeiros));
    agendamentoService = jasmine.createSpyObj('AgendamentoService', ['criarAgendamento']);
    agendamentoService.criarAgendamento.and.returnValue(
      of({
        idAgendamento: 501,
        cliente_id: 7,
        servico_id: 1,
        barbeiro_id: 100,
        barbearia_id: 10,
        horario_agendado: '09:00',
      })
    );
    avisoService = jasmine.createSpyObj('AvisoService', ['mostrar']);

    TestBed.configureTestingModule({
      imports: [BarbeariaDetailPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '10' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        {
          provide: BarbeariaService,
          useValue: { getBarbeariaById: () => of(barbearia) },
        },
        { provide: ServicoService, useValue: servicoService },
        { provide: BarbeiroService, useValue: barbeiroService },
        { provide: HorarioService, useValue: horarioService },
        {
          provide: AgendamentoService,
          useValue: agendamentoService,
        },
        { provide: LoginService, useValue: { getSessao: () => sessaoAtiva } },
        { provide: AvisoService, useValue: avisoService },
        {
          provide: AlertController,
          useValue: {
            create: (config: unknown) => {
              const botoes = (config as { buttons?: { text?: string; handler?: () => unknown }[] })
                .buttons;
              confirmarAgendamento =
                botoes?.find((botao) => botao.text === 'Confirmar')?.handler ?? null;
              return Promise.resolve({ present: () => Promise.resolve() });
            },
          },
        },
      ],
    });
  });

  function carregarPagina(): ComponentFixture<BarbeariaDetailPage> {
    const fixture = TestBed.createComponent(BarbeariaDetailPage);
    fixture.detectChanges();
    fixture.componentInstance.ionViewWillEnter();
    fixture.detectChanges();
    return fixture;
  }

  function clicarServico(fixture: ComponentFixture<BarbeariaDetailPage>, nome: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const botoes = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.cartao-servico')
    );
    botoes.find((botao) => botao.textContent?.includes(nome))?.click();
    fixture.detectChanges();
  }

  function selecionarHorario(fixture: ComponentFixture<BarbeariaDetailPage>, horario: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const botao = Array.from(root.querySelectorAll<HTMLButtonElement>('.botao-horario')).find(
      (item) => item.textContent?.includes(horario)
    );
    botao?.click();
    fixture.detectChanges();
  }

  it('associa serviços por IDs, separa profissionais e não mistura estabelecimentos', () => {
    const fixture = carregarPagina();
    const texto = fixture.nativeElement.textContent as string;
    const botoes = fixture.nativeElement.querySelectorAll('.cartao-servico');

    expect(texto).toContain('Ana');
    expect(texto).toContain('Beto');
    expect(texto).toContain('Caio');
    expect(botoes.length).toBe(2);
    expect(texto).not.toContain('Corte Dora');
    expect(texto).not.toContain('Sem profissional');
    expect(texto).not.toContain('Dora');
  });

  it('preserva a tela quando um profissional não possui serviços', () => {
    servicoService.getServicos.and.returnValue(of([]));

    const fixture = carregarPagina();
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Caio');
    expect(texto).toContain('Este estabelecimento ainda não cadastrou serviços.');
    expect(fixture.nativeElement.querySelectorAll('.cartao-servico').length).toBe(0);
  });

  it('mostra disponibilidade, seleção e indisponibilidade apenas para o profissional selecionado', () => {
    const fixture = carregarPagina();
    clicarServico(fixture, 'Corte Ana');
    const root = fixture.nativeElement as HTMLElement;

    let botoes = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.botao-horario')
    );
    expect(botoes.length).toBe(2);
    expect(botoes[0].textContent).toContain('Disponível');
    expect(botoes[1].textContent).toContain('Indisponível');
    expect(botoes[1].disabled).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('não garante que o horário ainda esteja livre');

    botoes[0].click();
    fixture.detectChanges();
    expect(botoes[0].textContent).toContain('Selecionado');
    expect(botoes[0].classList).toContain('selecionado');

    clicarServico(fixture, 'Corte Beto');
    botoes = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.botao-horario')
    );
    expect(botoes.length).toBe(1);
    expect(botoes[0].textContent).toContain('11:00');
    expect(botoes[0].textContent).toContain('Disponível');
  });

  it('cria agendamento com os IDs reais e o valor textual do horário selecionado', async () => {
    sessaoAtiva = { tipo: 'cliente', id: 7, nome: 'Cliente teste' };
    const fixture = carregarPagina();
    clicarServico(fixture, 'Corte Ana');
    selecionarHorario(fixture, '09:00');

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLElement>('.btn-principal')?.click();
    await fixture.whenStable();
    confirmarAgendamento?.();

    expect(agendamentoService.criarAgendamento).toHaveBeenCalledOnceWith({
      cliente_id: 7,
      servico_id: 1,
      barbeiro_id: 100,
      barbearia_id: 10,
      horario_agendado: '09:00',
    });
    expect(avisoService.mostrar).toHaveBeenCalledWith('Agendamento confirmado com sucesso!');
  });

  it('mantém o horário selecionado e informa falha na criação', async () => {
    sessaoAtiva = { tipo: 'cliente', id: 7, nome: 'Cliente teste' };
    agendamentoService.criarAgendamento.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0 }))
    );
    const fixture = carregarPagina();
    clicarServico(fixture, 'Corte Ana');
    selecionarHorario(fixture, '09:00');

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLElement>('.btn-principal')?.click();
    await fixture.whenStable();
    confirmarAgendamento?.();
    fixture.detectChanges();

    expect(root.querySelector('.botao-horario.selecionado')).not.toBeNull();
    expect(avisoService.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/Não foi possível concluir o agendamento/)
    );
  });

  it('não informa sucesso quando a API retorna um agendamento incompatível', async () => {
    sessaoAtiva = { tipo: 'cliente', id: 7, nome: 'Cliente teste' };
    const respostaInesperada: Agendamento = {
      idAgendamento: 501,
      cliente_id: 7,
      servico_id: 2,
      barbeiro_id: 101,
      barbearia_id: 10,
      horario_agendado: '11:00',
    };
    agendamentoService.criarAgendamento.and.returnValue(of(respostaInesperada));
    const fixture = carregarPagina();
    clicarServico(fixture, 'Corte Ana');
    selecionarHorario(fixture, '09:00');

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLElement>('.btn-principal')?.click();
    await fixture.whenStable();
    confirmarAgendamento?.();
    fixture.detectChanges();

    expect(avisoService.mostrar).not.toHaveBeenCalledWith(
      'Agendamento confirmado com sucesso!'
    );
    expect(root.querySelector('.botao-horario.selecionado')).not.toBeNull();
  });

  it('não permite selecionar ou enviar horário marcado como indisponível', () => {
    sessaoAtiva = { tipo: 'cliente', id: 7, nome: 'Cliente teste' };
    const fixture = carregarPagina();
    clicarServico(fixture, 'Corte Ana');
    selecionarHorario(fixture, '10:00');

    expect(fixture.nativeElement.querySelector('.botao-horario.selecionado')).toBeNull();
    expect(agendamentoService.criarAgendamento).not.toHaveBeenCalled();
  });

  it('preserva estabelecimento, serviço e horário selecionados ao encaminhar visitante ao login', () => {
    const fixture = carregarPagina();
    clicarServico(fixture, 'Corte Ana');
    selecionarHorario(fixture, '09:00');
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLElement>('.btn-principal')?.click();

    const navegacao = (router.navigate as jasmine.Spy).calls.mostRecent().args;
    const returnUrl = navegacao[1]?.queryParams?.returnUrl as string;
    expect(navegacao[0]).toEqual(['/login']);
    expect(returnUrl).toContain('/barbearia/10?');
    expect(returnUrl).toContain('servico_id=1');
    expect(returnUrl).toContain('horario_id=11');
  });

  it('mostra estado vazio quando o profissional não possui horários', () => {
    horarioService.getHorariosPorBarbearia.and.returnValue(of([]));

    const fixture = carregarPagina();
    clicarServico(fixture, 'Corte Ana');

    expect(fixture.nativeElement.textContent).toContain(
      'Nenhum horário cadastrado para este profissional neste estabelecimento.'
    );
  });

  it('exibe erro e oferece nova tentativa quando o serviço de serviços falha', () => {
    servicoService.getServicos.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' }))
    );
    spyOn(console, 'error');

    const fixture = carregarPagina();
    expect(fixture.nativeElement.textContent).toContain(
      'Verifique sua conexão'
    );
    expect(fixture.nativeElement.querySelector('ion-button')).not.toBeNull();
  });

  it('exibe erro e oferece nova tentativa quando o serviço de horários falha', () => {
    horarioService.getHorariosPorBarbearia.and.returnValue(
      throwError(() => new Error('offline'))
    );
    spyOn(console, 'error');

    const fixture = carregarPagina();
    expect(fixture.nativeElement.textContent).toContain(
      'Não foi possível carregar os dados deste estabelecimento.'
    );
    expect(fixture.nativeElement.querySelector('ion-button')).not.toBeNull();
  });
});
