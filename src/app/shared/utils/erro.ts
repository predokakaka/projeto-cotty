import { HttpErrorResponse } from '@angular/common/http';

export const MSG_SEM_CONEXAO = 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.';

/**
 * Texto de erro que o backend manda no corpo da resposta. Os controllers respondem de três
 * jeitos: string pura, { message } ou { messsage } (com três "s", typo que existe em vários catch).
 */
function textoDoBackend(erro: HttpErrorResponse): string | null {
  const corpo = erro.error as unknown;
  if (typeof corpo === 'string') return corpo.trim() || null;

  if (corpo && typeof corpo === 'object') {
    const { message, messsage } = corpo as { message?: unknown; messsage?: unknown };
    const texto = typeof messsage === 'string' ? messsage : typeof message === 'string' ? message : '';
    return texto.trim() || null;
  }
  return null;
}

/** Código do Prisma repassado pelo backend em { error: { code } } (P2002 = valor duplicado). */
function codigoPrisma(erro: HttpErrorResponse): string | null {
  const codigo = (erro.error as { error?: { code?: unknown } } | null)?.error?.code;
  return typeof codigo === 'string' ? codigo : null;
}

/** "não foi possível excluir" -> "Não foi possível excluir." */
function comoFrase(texto: string): string {
  const frase = texto.charAt(0).toUpperCase() + texto.slice(1);
  return /[.!?]$/.test(frase) ? frase : `${frase}.`;
}

/**
 * Mensagem amigável para um erro de requisição, na ordem:
 * sem conexão -> valor duplicado -> texto enviado pelo backend -> `padrao`.
 */
export function mensagemDeErro(
  erro: unknown,
  padrao: string,
  duplicado = 'Já existe um registro com esses dados.'
): string {
  if (!(erro instanceof HttpErrorResponse)) return padrao;
  if (erro.status === 0) return MSG_SEM_CONEXAO;
  if (codigoPrisma(erro) === 'P2002') return duplicado;

  const texto = textoDoBackend(erro);
  return texto ? comoFrase(texto) : padrao;
}
