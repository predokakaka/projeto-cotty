export interface Horario {
  horario_id: number;
  barbeiro_id: number;
  barbearia_id: number;
  horario: string;
  disponivel: boolean;
}

export interface HorarioCriacao {
  barbeiro_id: number;
  barbearia_id: number;
  horario: string;
  disponivel: boolean;
}
