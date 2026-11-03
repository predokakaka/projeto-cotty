export interface Barbearia {
  barbearia_id: number;
  nomeFantasia: string;
  telefone: string;
  endereco: string;
  status: string;
  descricao: string;
  email: string;
  qtdProfissionais: number;
  foto: string | null;
}

export interface BarbeariaCriacao {
  nomeFantasia: string;
  telefone: string;
  email: string;
  endereco: string;
  status: string;
  descricao: string;
  qtdProfissionais: number;
  senha: string;
}

export type BarbeariaAtualizacao = BarbeariaCriacao;

export interface BarbeariaCredenciais {
  email: string;
  senha: string;
}
