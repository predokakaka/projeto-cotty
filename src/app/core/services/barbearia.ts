import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import {
  Barbearia,
  BarbeariaAtualizacao,
  BarbeariaCriacao,
  BarbeariaCredenciais,
} from '../../shared/models/modelo.barbearia';

@Injectable({
  providedIn: 'root',
})
export class BarbeariaService {
  private api = inject(ApiService);

  getBarbearias(): Observable<Barbearia[]> {
    return this.api.get<Barbearia[]>('barbearia');
  }

  getBarbeariaById(barbearia_id: number): Observable<Barbearia | null> {
    return this.api.get<Barbearia | null>(`barbearia/${barbearia_id}`);
  }

  createBarbearia(barbearia: BarbeariaCriacao): Observable<Barbearia> {
    return this.api.post<Barbearia>('barbearia', barbearia);
  }

  updateBarbearia(barbearia_id: number, barbearia: BarbeariaAtualizacao): Observable<Barbearia> {
    return this.api.put<Barbearia>(`barbearia/${barbearia_id}`, barbearia);
  }

  /**
   * O backend confere e-mail e senha antes de excluir, mas NÃO responde nada quando
   * as credenciais estão erradas — a requisição ficaria pendente para sempre.
   * Por isso o tempo limite: estourar o prazo (TimeoutError) indica credencial inválida.
   */
  deleteBarbearia(
    barbearia_id: number,
    credenciais: BarbeariaCredenciais
  ): Observable<Barbearia> {
    return this.api
      .delete<Barbearia>(`barbearia/${barbearia_id}`, credenciais)
      .pipe(timeout(8000));
  }
}
