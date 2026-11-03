import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Agendamento,
  AgendamentoAtualizacao,
  AgendamentoCriacao,
} from '../../shared/models/modelo.agendamento';

@Injectable({
  providedIn: 'root',
})
export class AgendamentoService {
  private api = inject(ApiService);

  getAgendamentos(): Observable<Agendamento[]> {
    return this.api.get<Agendamento[]>('agendamento');
  }

  criarAgendamento(dados: AgendamentoCriacao): Observable<Agendamento> {
    return this.api.post<Agendamento>('agendamento', dados);
  }

  atualizarAgendamento(idAgendamento: number, dados: AgendamentoAtualizacao): Observable<Agendamento> {
    return this.api.put<Agendamento>(`agendamento/${idAgendamento}`, dados);
  }

  excluirAgendamento(idAgendamento: number): Observable<Agendamento> {
    return this.api.delete<Agendamento>(`agendamento/${idAgendamento}`);
  }
}
