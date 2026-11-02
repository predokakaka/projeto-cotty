// Credenciais de cliente, barbeiro ou barbearia (mesmo formato do login do frontend 14/09)
export interface Login {
  nome?: string;
  email: string;
  password: string;
}

export type TipoConta = 'cliente' | 'barbeiro' | 'barbearia';

export interface Sessao {
  tipo: TipoConta;
  id: number;
  nome: string;
}
