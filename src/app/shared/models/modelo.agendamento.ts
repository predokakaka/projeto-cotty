export interface AgendamentoCriacao {
  cliente_id: number;
  servico_id: number;
  barbeiro_id: number;
  barbearia_id: number;
  horario_agendado: string;
}

// O backend devolve a chave primária como "idAgendamento" (e não "agendamento_id").
export interface Agendamento extends AgendamentoCriacao {
  idAgendamento: number;
}

export type AgendamentoAtualizacao = AgendamentoCriacao;
