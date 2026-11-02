import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Cliente } from '../../shared/models/modelo.cliente';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private api = inject(ApiService);

  getClientes(): Observable<Cliente[]> {
    return this.api.get<Cliente[]>('cliente');
  }

  getClienteById(cliente_id: number): Observable<Cliente | { error: boolean; message: string } | null> {
    return this.api.get<Cliente>(`cliente/${cliente_id}`);
  }

  createCliente(cliente: Cliente): Observable<Cliente> {
    return this.api.post<Cliente>('cliente', cliente);
  }

  updateCliente(cliente_id: number, cliente: Partial<Cliente>): Observable<Cliente> {
    const payload = { ...cliente };
    delete payload.cliente_id;
    return this.api.put<Cliente>(`cliente/${cliente_id}`, payload);
  }

  deleteCliente(cliente_id: number): Observable<Cliente> {
    return this.api.delete<Cliente>(`cliente/${cliente_id}`);
  }
}
