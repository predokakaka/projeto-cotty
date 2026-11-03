export interface Barbeiro {
  id_barbeiro: number;
  barbearia_id: number;
  nome: string;
  email: string;
  foto: string | null;
  modalidade_atendimento: string;
}

export interface BarbeiroCriacao {
  nome: string;
  email: string;
  senha: string;
  foto: string | null;
  modalidade_atendimento: string;
  barbearia_id: number;
}

export interface BarbeiroAtualizacao {
  nome: string;
  email: string;
  senha?: string;
  foto: string | null;
}
