import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { ClienteService } from './cliente';
import { BarbeiroService } from './barbeiro';
import { ServicoService } from './servico';
import { HorarioService } from './horario';
import { BarbeariaService } from './barbearia';

describe('serviços HTTP para recursos do backend', () => {
  let http: HttpTestingController;
  let cliente: ClienteService;
  let barbeiro: BarbeiroService;
  let servico: ServicoService;
  let horario: HorarioService;
  let barbearia: BarbeariaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ClienteService,
        BarbeiroService,
        ServicoService,
        HorarioService,
        BarbeariaService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    cliente = TestBed.inject(ClienteService);
    barbeiro = TestBed.inject(BarbeiroService);
    servico = TestBed.inject(ServicoService);
    horario = TestBed.inject(HorarioService);
    barbearia = TestBed.inject(BarbeariaService);
  });

  afterEach(() => http.verify());

  it('envia somente o contrato de criação de cliente', () => {
    const body = {
      nome: 'Cliente',
      email: 'cliente@example.com',
      senha: 'senha-segura',
      celular: '11999999999',
    };
    cliente.createCliente(body).subscribe();

    const requisicao = http.expectOne(`${environment.api}/cliente`);
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual(body);
    requisicao.flush({ cliente_id: 1, nome: body.nome, email: body.email, celular: body.celular });
  });

  it('exige o estabelecimento no contrato de criação de profissional', () => {
    const body = {
      nome: 'Profissional',
      email: 'profissional@example.com',
      senha: 'senha-segura',
      foto: null,
      modalidade_atendimento: 'presencial',
      barbearia_id: 8,
    };
    barbeiro.createBarbeiro(body).subscribe();

    const requisicao = http.expectOne(`${environment.api}/barbeiro`);
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual(body);
    requisicao.flush({ id_barbeiro: 3, ...body });
  });

  it('envia apenas os campos aceitos na atualização de cliente e profissional', () => {
    const clienteBody = { nome: 'Novo nome', email: 'novo@example.com', celular: '11999999999' };
    cliente.updateCliente(1, clienteBody).subscribe();
    const requisicaoCliente = http.expectOne(`${environment.api}/cliente/1`);
    expect(requisicaoCliente.request.method).toBe('PUT');
    expect(requisicaoCliente.request.body).toEqual(clienteBody);
    requisicaoCliente.flush({});

    const barbeiroBody = {
      nome: 'Profissional atualizado',
      email: 'profissional@example.com',
      senha: 'nova-senha',
      foto: null,
    };
    barbeiro.updateBarbeiro(3, barbeiroBody).subscribe();
    const requisicaoBarbeiro = http.expectOne(`${environment.api}/barbeiro/3`);
    expect(requisicaoBarbeiro.request.method).toBe('PUT');
    expect(requisicaoBarbeiro.request.body).toEqual(barbeiroBody);
    requisicaoBarbeiro.flush({});
  });

  it('envia somente os campos contratuais de serviço e horário nas atualizações', () => {
    const servicoBody = {
      nome_servico: 'Corte',
      descricao_servico: 'Descrição',
      barbearia_id: 8,
    };
    servico.updateServico(4, servicoBody).subscribe();
    const requisicaoServico = http.expectOne(`${environment.api}/servico/4`);
    expect(requisicaoServico.request.method).toBe('PUT');
    expect(requisicaoServico.request.body).toEqual(servicoBody);
    requisicaoServico.flush({});

    const horarioBody = {
      horario: '09:00',
      disponivel: true,
      barbeiro_id: 3,
      barbearia_id: 8,
    };
    horario.updateHorario(5, horarioBody).subscribe();
    const requisicaoHorario = http.expectOne(`${environment.api}/horario/5`);
    expect(requisicaoHorario.request.method).toBe('PUT');
    expect(requisicaoHorario.request.body).toEqual(horarioBody);
    requisicaoHorario.flush({});
  });

  it('usa os identificadores nas exclusões e envia credenciais exigidas pelo DELETE de barbearia', () => {
    cliente.deleteCliente(1).subscribe();
    const requisicaoCliente = http.expectOne(`${environment.api}/cliente/1`);
    expect(requisicaoCliente.request.method).toBe('DELETE');
    requisicaoCliente.flush({});

    barbeiro.deleteBarbeiro(3).subscribe();
    const requisicaoBarbeiro = http.expectOne(`${environment.api}/barbeiro/3`);
    expect(requisicaoBarbeiro.request.method).toBe('DELETE');
    requisicaoBarbeiro.flush({});

    servico.deleteServico(4).subscribe();
    const requisicaoServico = http.expectOne(`${environment.api}/servico/4`);
    expect(requisicaoServico.request.method).toBe('DELETE');
    requisicaoServico.flush({});

    horario.deleteHorario(5).subscribe();
    const requisicaoHorario = http.expectOne(`${environment.api}/horario/5`);
    expect(requisicaoHorario.request.method).toBe('DELETE');
    requisicaoHorario.flush({});

    const credenciais = { email: 'barbearia@example.com', senha: 'senha-segura' };
    barbearia.deleteBarbearia(8, credenciais).subscribe();
    const requisicaoBarbearia = http.expectOne(`${environment.api}/barbearia/8`);
    expect(requisicaoBarbearia.request.method).toBe('DELETE');
    expect(requisicaoBarbearia.request.body).toEqual(credenciais);
    requisicaoBarbearia.flush({});
  });
});
