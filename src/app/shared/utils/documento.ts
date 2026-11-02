// Utilitários para CPF e CNPJ: máscara e validação dos dígitos verificadores.

export function somenteDigitos(valor: string): string {
  return (valor ?? '').replace(/\D/g, '');
}

export function formatarCep(valor: string): string {
  const digitos = somenteDigitos(valor).slice(0, 8);
  return digitos.length > 5
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : digitos;
}

export function cepValido(valor: string): boolean {
  return /^\d{8}$/.test(somenteDigitos(valor));
}

export type TipoDocumento = 'cpf' | 'cnpj';

/** Aplica a máscara de CPF ou CNPJ durante a digitação. */
export function formatarDocumento(valor: string, tipo?: TipoDocumento): string {
  const digitos = somenteDigitos(valor);
  const tamanho = tipo === 'cpf' ? 11 : 14;
  const d = digitos.slice(0, tamanho);

  if (tipo === 'cpf' || (!tipo && d.length <= 11)) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function validarCpf(valor: string): boolean {
  const d = somenteDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  const digito = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(d[i]) * (tamanho + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

const PESOS_CNPJ_12 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CNPJ_13 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function validarCnpj(valor: string): boolean {
  const d = somenteDigitos(valor);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;

  const digito = (tamanho: number, pesos: number[]) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(d[i]) * pesos[i];
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return digito(12, PESOS_CNPJ_12) === Number(d[12]) && digito(13, PESOS_CNPJ_13) === Number(d[13]);
}

/** Valida CPF ou CNPJ pelos dígitos verificadores. */
export function validarDocumento(valor: string, tipo?: TipoDocumento): boolean {
  const tamanho = somenteDigitos(valor).length;
  if ((!tipo || tipo === 'cpf') && tamanho === 11) return validarCpf(valor);
  if ((!tipo || tipo === 'cnpj') && tamanho === 14) return validarCnpj(valor);
  return false;
}
