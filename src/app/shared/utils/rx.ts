import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Se a lista falhar ao carregar, segue com uma lista vazia em vez de derrubar a tela inteira. */
export function listaOuVazia<T>(origem: Observable<T[]>): Observable<T[]> {
  return origem.pipe(catchError(() => of([] as T[])));
}
