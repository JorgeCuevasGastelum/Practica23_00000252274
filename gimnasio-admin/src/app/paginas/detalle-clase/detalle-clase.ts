// <app-detalle-clase> — la página /clases/:id: la clase con sus horarios.
// Es para LEER, así que va con httpResource. La URL depende del id: si el id
// cambia, el recurso vuelve a pedir la clase solo.
import { httpResource } from '@angular/common/http';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_URL } from '../../config';
import type { ClaseConHorarios, Sobre } from '../../modelos/clase';
import { mensajeDeApi } from '../../servicios/errores';

@Component({
  imports: [RouterLink],
  selector: 'app-detalle-clase',
  styleUrl: './detalle-clase.css',
  templateUrl: './detalle-clase.html',
})
export class DetalleClase {
  // El :id de la URL, como input (withComponentInputBinding).
  readonly id = input.required<string>();

  protected readonly recurso = httpResource<ClaseConHorarios>(
    () => `${API_URL}/clases/${this.id()}`,
    { parse: (cuerpo) => (cuerpo as Sobre<ClaseConHorarios>).data },
  );

  protected readonly clase = computed(() => (this.recurso.hasValue() ? this.recurso.value() : null));
  protected readonly error = computed(() => {
    const error = this.recurso.error();
    return error ? mensajeDeApi(error) : null;
  });
  protected readonly imagen = computed(() => {
    const clase = this.clase();
    return clase ? `${API_URL}${clase.imagen}` : '';
  });
}
