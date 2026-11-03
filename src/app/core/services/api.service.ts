import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  get<T>(path: string): Observable<T> {
    return this.registrarErro('GET', path, this.http.get<T>(this.url(path)));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.registrarErro('POST', path, this.http.post<T>(this.url(path), body));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.registrarErro('PUT', path, this.http.put<T>(this.url(path), body));
  }

  // Alguns DELETE do backend (ex.: barbearia) exigem e-mail e senha no body.
  delete<T>(path: string, body?: unknown): Observable<T> {
    const opcoes = body !== undefined ? { body } : {};
    return this.registrarErro('DELETE', path, this.http.delete<T>(this.url(path), opcoes));
  }

  private url(path: string): string {
    const base = environment.api.replace(/\/+$/, '');
    const recurso = path.replace(/^\/+/, '');
    return `${base}/${recurso}`;
  }

  private registrarErro<T>(metodo: string, path: string, requisicao: Observable<T>): Observable<T> {
    return requisicao.pipe(
      catchError((err) => {
        const status =
          typeof err === 'object' && err !== null && 'status' in err
            ? (err as { status?: unknown }).status
            : undefined;
        console.error(`${metodo} ${path} failed`, {
          status: typeof status === 'number' ? status : 'unknown',
        });
        return throwError(() => err);
      })
    );
  }
}
