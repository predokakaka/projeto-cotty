export interface ServicoAutonomoCriacao {
  barbeiro_id: number;
  nome_servico: string;
  descricao_servico?: string | null;
}

export interface ServicoAutonomo extends ServicoAutonomoCriacao {
  idServico_autonomo: number;
  descricao_servico: string | null;
}

export interface ServicoAutonomoAtualizacao {
  nome_servico: string;
  descricao_servico?: string | null;
}
