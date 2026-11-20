// <app-lista-clases> — la página /clases: el tablero con el buscador.
// Lee todo del servicio Catalogo, que trae las clases de la API.
import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { Catalogo } from '../../catalogo';
import { API_URL } from '../../config';
import { FiltroCategoria } from '../../filtro-categoria/filtro-categoria';
import { TarjetaClase } from '../../tarjeta-clase/tarjeta-clase';

@Component({
  imports: [TarjetaClase, FiltroCategoria, RouterLink, ReactiveFormsModule],
  selector: 'app-lista-clases',
  styleUrl: './lista-clases.css',
  templateUrl: './lista-clases.html',
})
export class ListaClases {
  protected readonly catalogo = inject(Catalogo);

  // La caja de búsqueda. Arranca con lo que ya se había buscado, por si se
  // regresa a la página después de editar una clase.
  protected readonly busqueda = new FormControl(this.catalogo.termino(), { nonNullable: true });

  constructor() {
    // valueChanges es un Observable con cada tecla. Antes de buscar:
    this.busqueda.valueChanges
      .pipe(
        map((texto) => texto.trim()),
        debounceTime(300), // espera a que la persona deje de teclear 300 ms
        distinctUntilChanged(), // si el texto quedó igual («yoga» → «yogaa» → «yoga»), no busca
        // Se desuscribe solo cuando la página se destruye. Tiene que ir aquí,
        // en el constructor (contexto de inyección): en ngOnInit da NG0203.
        takeUntilDestroyed(),
      )
      .subscribe((texto) => this.catalogo.buscar(texto));
  }

  // La imagen del detalle también la sirve la API.
  protected readonly imagenElegida = computed(() => {
    const clase = this.catalogo.seleccionada();
    return clase ? `${API_URL}${clase.imagen}` : '';
  });
}
