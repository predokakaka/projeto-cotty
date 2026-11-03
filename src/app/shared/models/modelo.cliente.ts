export interface Cliente {
  cliente_id: number;
  nome: string;
  email: string;
  celular: string;
}

export interface ClienteCriacao {
  nome: string;
  email: string;
  senha: string;
  celular: string;
}

export type ClienteAtualizacao = Partial<Pick<Cliente, 'nome' | 'email' | 'celular'>>;
