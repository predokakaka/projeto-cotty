import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Agendamento, AgendamentoCriacao } from '../../shared/models/modelo.agendamento';

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

  excluirAgendamento(idAgendamento: number): Observable<Agendamento> {
    return this.api.delete<Agendamento>(`agendamento/${idAgendamento}`);
  }
}
