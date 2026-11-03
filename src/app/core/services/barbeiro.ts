import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import {
  Barbeiro,
  BarbeiroAtualizacao,
  BarbeiroCriacao,
} from '../../shared/models/modelo.barbeiro';

@Injectable({
  providedIn: 'root',
})
export class BarbeiroService {
  private api = inject(ApiService);

  getBarbeiros(): Observable<Barbeiro[]> {
    return this.api.get<Barbeiro[]>('barbeiro');
  }

  createBarbeiro(barbeiro: BarbeiroCriacao): Observable<Barbeiro> {
    return this.api.post<Barbeiro>('barbeiro', barbeiro);
  }

  updateBarbeiro(id_barbeiro: number, barbeiro: BarbeiroAtualizacao): Observable<Barbeiro> {
    return this.api.put<Barbeiro>(`barbeiro/${id_barbeiro}`, barbeiro);
  }

  deleteBarbeiro(id_barbeiro: number): Observable<Barbeiro> {
    return this.api.delete<Barbeiro>(`barbeiro/${id_barbeiro}`);
  }
}
