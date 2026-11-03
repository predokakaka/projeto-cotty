import { HttpErrorResponse } from '@angular/common/http';

export const MSG_SEM_CONEXAO = 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.';

function detalheDoBackend(erro: HttpErrorResponse): string {
  const corpo = erro.error as unknown;
  if (typeof corpo === 'string') return corpo.toLocaleLowerCase('pt-BR');

  if (corpo && typeof corpo === 'object') {
    const resposta = corpo as {
      message?: unknown;
      messsage?: unknown;
      error?: { code?: unknown; meta?: { target?: unknown; field_name?: unknown } };
    };
    const mensagem =
      typeof resposta.messsage === 'string'
        ? resposta.messsage
        : typeof resposta.message === 'string'
          ? resposta.message
          : '';
    const codigo = resposta.error?.code;
    const alvos = resposta.error?.meta?.target;
    const campo = resposta.error?.meta?.field_name;
    const valores: unknown[] = [mensagem, codigo, campo];
    if (Array.isArray(alvos)) {
      valores.push(...alvos);
    } else {
      valores.push(alvos);
    }
    return valores
      .filter((valor): valor is string => typeof valor === 'string')
      .join(' ')
      .toLocaleLowerCase('pt-BR');
  }
  return '';
}

function mensagemDeCampo(detalhe: string): string | null {
  if (/e-?mail|email/.test(detalhe)) return 'Este e-mail já está sendo utilizado.';
  if (/telefone|celular|phone/.test(detalhe)) return 'Este telefone já está sendo utilizado.';
  if (/hor[aá]rio|horario/.test(detalhe)) return 'Este horário já está cadastrado.';
  if (/barbearia|estabelecimento/.test(detalhe)) {
    return 'O estabelecimento informado não foi encontrado.';
  }
  if (/barbeiro|profissional/.test(detalhe)) {
    return 'O profissional informado não foi encontrado.';
  }
  if (/servi[cç]o|servico/.test(detalhe)) return 'O serviço informado não foi encontrado.';
  return null;
}

/**
 * Converte respostas de erro do backend em mensagens adequadas à interface, sem expor
 * mensagens técnicas, SQL, stack traces ou dados enviados na requisição.
 */
export function mensagemDeErro(
  erro: unknown,
  padrao: string,
  duplicado = 'Já existe um registro com esses dados.'
): string {
  if (!(erro instanceof HttpErrorResponse)) return padrao;
  if (erro.status === 0) return MSG_SEM_CONEXAO;

  const detalhe = detalheDoBackend(erro);
  if (
    /p2002|unique constraint|duplicate|duplicad|j[aá] existe|j[aá] cadastrad|already exists|already in use|already registered/.test(
      detalhe
    )
  ) {
    return mensagemDeCampo(detalhe) ?? duplicado;
  }
  if (
    /p2003|p2025|foreign key|constraint failed|not found|n[aã]o encontrad|n[aã]o existe|inexistente|does not exist/.test(
      detalhe
    )
  ) {
    return mensagemDeCampo(detalhe) ?? padrao;
  }
  return padrao;
}
