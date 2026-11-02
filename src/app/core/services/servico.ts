import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Servico, ServicoCriacao } from '../../shared/models/modelo.servico';

@Injectable({
  providedIn: 'root',
})
export class ServicoService {
  private api = inject(ApiService);

  getServicos(): Observable<Servico[]> {
    return this.api.get<Servico[]>('servico');
  }

  createServico(servico: ServicoCriacao): Observable<Servico> {
    return this.api.post<Servico>('servico', servico);
  }

  // O backend lê barbearia_id do body para checar nome duplicado, então ele precisa ir junto.
  updateServico(
    servico_id: number,
    dados: { nome_servico: string; descricao_servico?: string | null; barbearia_id: number }
  ): Observable<Servico> {
    return this.api.put<Servico>(`servico/${servico_id}`, dados);
  }

  deleteServico(servico_id: number): Observable<Servico> {
    return this.api.delete<Servico>(`servico/${servico_id}`);
  }
}
