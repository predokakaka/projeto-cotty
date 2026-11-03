import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Cliente, ClienteAtualizacao, ClienteCriacao } from '../../shared/models/modelo.cliente';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private api = inject(ApiService);

  getClientes(): Observable<Cliente[]> {
    return this.api.get<Cliente[]>('cliente');
  }

  getClienteById(cliente_id: number): Observable<Cliente> {
    return this.api.get<Cliente>(`cliente/${cliente_id}`);
  }

  createCliente(cliente: ClienteCriacao): Observable<Cliente> {
    return this.api.post<Cliente>('cliente', cliente);
  }

  updateCliente(cliente_id: number, cliente: ClienteAtualizacao): Observable<Cliente> {
    return this.api.put<Cliente>(`cliente/${cliente_id}`, cliente);
  }

  deleteCliente(cliente_id: number): Observable<Cliente> {
    return this.api.delete<Cliente>(`cliente/${cliente_id}`);
  }
}
