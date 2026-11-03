import { HttpErrorResponse } from '@angular/common/http';
import { mensagemDeErro, MSG_SEM_CONEXAO } from './erro';

describe('mensagemDeErro', () => {
  it('identifica e-mail duplicado sem exibir a mensagem técnica do backend', () => {
    const erro = new HttpErrorResponse({
      status: 409,
      error: {
        message: 'Unique constraint failed',
        error: { code: 'P2002', meta: { target: ['email'] } },
      },
    });

    expect(mensagemDeErro(erro, 'Erro inesperado.')).toBe(
      'Este e-mail já está sendo utilizado.'
    );
  });

  it('identifica telefone duplicado e horários já cadastrados', () => {
    const erroTelefone = new HttpErrorResponse({
      status: 409,
      error: { error: { code: 'P2002', meta: { target: ['telefone'] } } },
    });
    const erroHorario = new HttpErrorResponse({
      status: 409,
      error: { message: 'Horario ja cadastrado' },
    });

    expect(mensagemDeErro(erroTelefone, 'Erro inesperado.')).toBe(
      'Este telefone já está sendo utilizado.'
    );
    expect(mensagemDeErro(erroHorario, 'Erro inesperado.')).toBe(
      'Este horário já está cadastrado.'
    );
  });

  it('traduz chaves estrangeiras de estabelecimento, profissional e serviço inexistentes', () => {
    const criarErro = (campo: string) =>
      new HttpErrorResponse({
        status: 500,
        error: {
          error: { code: 'P2003', meta: { field_name: `${campo}_id` } },
        },
      });

    expect(mensagemDeErro(criarErro('barbearia'), 'Erro inesperado.')).toBe(
      'O estabelecimento informado não foi encontrado.'
    );
    expect(mensagemDeErro(criarErro('barbeiro'), 'Erro inesperado.')).toBe(
      'O profissional informado não foi encontrado.'
    );
    expect(mensagemDeErro(criarErro('servico'), 'Erro inesperado.')).toBe(
      'O serviço informado não foi encontrado.'
    );
  });

  it('trata conexão e erro desconhecido sem vazar texto técnico', () => {
    const offline = new HttpErrorResponse({ status: 0 });
    const inesperado = new HttpErrorResponse({
      status: 500,
      error: 'Internal Server Error: secret trace',
    });

    expect(mensagemDeErro(offline, 'Erro inesperado.')).toBe(MSG_SEM_CONEXAO);
    expect(mensagemDeErro(inesperado, 'Erro inesperado.')).toBe('Erro inesperado.');
  });
});
