// servicios/clases-api.ts — buscar, crear, obtener, editar y eliminar clases.
// Cada método regresa un Observable que no hace nada hasta que alguien le
// hace subscribe(). La búsqueda la usa el tubo de RxJS del Catalogo.
// El token no se pone aquí: lo agrega el interceptor conToken a cada petición.
import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { API_URL } from '../config';
import type { Clase, ClaseConHorarios, ClaseNueva, Sobre } from '../modelos/clase';

@Service()
export class ClasesApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/clases`;

  // GET /clases?q=texto → las clases cuyo nombre contiene el texto (pública).
  // Sin texto se manda GET /clases a secas: todas.
  buscar(q: string): Observable<Clase[]> {
    const params: Record<string, string> = q ? { q } : {};
    return this.http.get<Sobre<Clase[]>>(this.url, { params }).pipe(map((r) => r.data));
  }

  // POST /clases → 201 con la clase creada (sólo admin)
  crear(clase: ClaseNueva): Observable<Clase> {
    return this.http.post<Sobre<Clase>>(this.url, clase).pipe(map((r) => r.data));
  }

  // GET /clases/:id → la clase con sus horarios (pública)
  obtener(id: number): Observable<ClaseConHorarios> {
    return this.http.get<Sobre<ClaseConHorarios>>(`${this.url}/${id}`).pipe(map((r) => r.data));
  }

  // PATCH /clases/:id → la clase con los cambios (sólo admin)
  actualizar(id: number, cambios: Partial<ClaseNueva>): Observable<Clase> {
    return this.http.patch<Sobre<Clase>>(`${this.url}/${id}`, cambios).pipe(map((r) => r.data));
  }

  // DELETE /clases/:id → la clase borrada, con sus horarios e inscripciones (sólo admin)
  eliminar(id: number): Observable<Clase> {
    return this.http.delete<Sobre<Clase>>(`${this.url}/${id}`).pipe(map((r) => r.data));
  }
}
