import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  ServicoAutonomo,
  ServicoAutonomoAtualizacao,
  ServicoAutonomoCriacao,
} from '../../shared/models/modelo.servico-autonomo';

/**
 * Serviços que o barbeiro oferece por conta própria (sem vínculo com barbearia).
 * As rotas existem no backend, mas ainda não são montadas no src/index.ts.
 */
@Injectable({
  providedIn: 'root',
})
export class ServicoAutonomoService {
  private api = inject(ApiService);

  getServicosAutonomos(): Observable<ServicoAutonomo[]> {
    return this.api.get<ServicoAutonomo[]>('servico-autonomo');
  }

  // Filtra no front porque a rota GET /servico-autonomo/barbeiro/:id ainda não existe no backend.
  getServicosAutonomosPorBarbeiro(barbeiro_id: number): Observable<ServicoAutonomo[]> {
    return this.getServicosAutonomos().pipe(
      map((lista) => lista.filter((s) => Number(s.barbeiro_id) === Number(barbeiro_id)))
    );
  }

  getServicoAutonomoById(idServico_autonomo: number): Observable<ServicoAutonomo> {
    return this.api.get<ServicoAutonomo>(`servico-autonomo/${idServico_autonomo}`);
  }

  createServicoAutonomo(servico: ServicoAutonomoCriacao): Observable<ServicoAutonomo> {
    return this.api.post<ServicoAutonomo>('servico-autonomo', servico);
  }

  updateServicoAutonomo(idServico_autonomo: number, dados: ServicoAutonomoAtualizacao): Observable<ServicoAutonomo> {
    return this.api.put<ServicoAutonomo>(`servico-autonomo/${idServico_autonomo}`, dados);
  }

  deleteServicoAutonomo(idServico_autonomo: number): Observable<ServicoAutonomo> {
    return this.api.delete<ServicoAutonomo>(`servico-autonomo/${idServico_autonomo}`);
  }
}
