import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Horario, HorarioCriacao } from '../../shared/models/modelo.horario';

@Injectable({
  providedIn: 'root',
})
export class HorarioService {
  private api = inject(ApiService);

  getHorarios(): Observable<Horario[]> {
    return this.api.get<Horario[]>('horario');
  }

  getHorariosPorBarbearia(barbearia_id: number): Observable<Horario[]> {
    return this.api.get<Horario[]>(`horario/barbearia/${barbearia_id}`);
  }

  getHorariosPorBarbeiro(barbeiro_id: number): Observable<Horario[]> {
    return this.api.get<Horario[]>(`horario/barbeiro/${barbeiro_id}`);
  }

  createHorario(horario: HorarioCriacao): Observable<Horario> {
    return this.api.post<Horario>('horario', horario);
  }

  updateHorario(
    horario_id: number,
    dados: { horario: string; disponivel: boolean; barbeiro_id: number; barbearia_id: number }
  ): Observable<Horario> {
    return this.api.put<Horario>(`horario/${horario_id}`, dados);
  }

  deleteHorario(horario_id: number): Observable<Horario> {
    return this.api.delete<Horario>(`horario/${horario_id}`);
  }
}
