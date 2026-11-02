export interface Servico {
  servico_id: number;
  barbeiro_id: number;
  barbearia_id: number;
  nome_servico: string;
  descricao_servico: string | null;
}

export interface ServicoCriacao {
  barbeiro_id: number;
  barbearia_id: number;
  nome_servico: string;
  descricao_servico?: string | null;
}
