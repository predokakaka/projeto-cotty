import { somenteDigitos } from './documento';

export const LIMITE_CURTO = 45; // tamanho das colunas VarChar(45) do banco

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Telefone ou celular brasileiro com DDD (10 ou 11 dígitos). */
export function celularValido(valor: string): boolean {
  const total = somenteDigitos(valor).length;
  return total >= 10 && total <= 11;
}

/** Nome precisa ter pelo menos nome e sobrenome (duas palavras). */
export function nomeCompletoValido(nome: string): boolean {
  const partes = nome.trim().split(/\s+/).filter(p => p.length >= 2);
  return partes.length >= 2;
}

/**
 * Aplica máscara de telefone brasileiro enquanto o usuário digita.
 * (11) 91234-5678  →  celular (11 dígitos)
 * (11) 1234-5678   →  fixo (10 dígitos)
 */
export function formatarTelefone(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);

  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
