// catalogo.ts — el servicio con el estado del tablero.
// @Service(): Angular crea UNA sola instancia para toda la app y se la da a
// quien la pida con inject(Catalogo). Así el tablero y el filtro ven lo mismo.
//
// Práctica 23: el httpResource se cambió por un TUBO de RxJS. El texto que se
// busca entra a un BehaviorSubject y cada valor nuevo pide GET /clases?q=…
// Al final, toSignal convierte el tubo en signal, así que hacia afuera el
// servicio se sigue viendo igual: clases(), cargando() y error() son signals.
import { Service, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, map, of, scan, startWith, switchMap } from 'rxjs';
import { ClasesApi } from './servicios/clases-api';
import { mensajeDeApi } from './servicios/errores';
import type { Categoria, Clase } from './modelos/clase';

interface EstadoCatalogo {
  clases: Clase[];
  cargando: boolean;
  error: string | null;
}

const INICIAL: EstadoCatalogo = { clases: [], cargando: true, error: null };

@Service()
export class Catalogo {
  private readonly api = inject(ClasesApi);

  // --- la búsqueda: el principio del tubo ----------------------------------
  // BehaviorSubject: guarda el último texto buscado y se lo da al que llega.
  // Empieza en '' (todas las clases).
  private readonly busqueda$ = new BehaviorSubject<string>('');
  readonly termino = signal(''); // el texto actual, para la caja y el mensaje

  private readonly estado = toSignal(
    this.busqueda$.pipe(
      // switchMap: por cada texto, una petición. Si llega otro texto antes de
      // que responda, la petición anterior se CANCELA (sale como «canceled»).
      switchMap((q) =>
        this.api.buscar(q).pipe(
          map((clases): Partial<EstadoCatalogo> => ({ clases, cargando: false, error: null })),
          // catchError adentro del switchMap: un error mata sólo ESTA petición,
          // no el tubo. La siguiente búsqueda funciona normal.
          catchError((e: unknown) =>
            of<Partial<EstadoCatalogo>>({ clases: [], cargando: false, error: mensajeDeApi(e) }),
          ),
          // startWith: antes de la respuesta, avisa que está cargando.
          startWith<Partial<EstadoCatalogo>>({ cargando: true, error: null }),
        ),
      ),
      // scan junta cada pedazo con el estado anterior: mientras busca, las
      // clases de antes se quedan en pantalla en lugar de desaparecer.
      scan((anterior, cambio) => ({ ...anterior, ...cambio }), INICIAL),
    ),
    { initialValue: INICIAL },
  );

  // --- el estado: signals ---------------------------------------------------
  readonly clases = computed(() => this.estado().clases);
  readonly cargando = computed(() => this.estado().cargando);
  readonly error = computed(() => this.estado().error);
  readonly categoria = signal<Categoria | null>(null); // null = todas

  // --- lo que se calcula: computed() se recalcula solo cuando cambia lo que lee
  readonly visibles = computed(() => {
    const categoria = this.categoria();
    return categoria ? this.clases().filter((c) => c.categoria === categoria) : this.clases();
  });
  readonly minutos = computed(() => this.visibles().reduce((suma, c) => suma + c.duracionMin, 0));
  readonly deUnaHora = computed(() => this.visibles().filter((c) => c.duracionMin >= 60).length);

  // La clase elegida. linkedSignal es una signal que se puede escribir (al
  // dar clic en una tarjeta) pero que además se vuelve a calcular cada vez
  // que cambian las visibles: si la elegida ya no está entre ellas (otro
  // filtro, otra búsqueda o se borró), se suelta sola. Se toma la versión
  // NUEVA de la lista (find) para que después de editar se vean los cambios.
  readonly seleccionada = linkedSignal<Clase[], Clase | null>({
    source: this.visibles,
    computation: (visibles, anterior) => {
      const elegida = anterior?.value;
      return elegida ? (visibles.find((c) => c.id === elegida.id) ?? null) : null;
    },
  });

  // --- las acciones --------------------------------------------------------
  // La caja de búsqueda llama esto (ya con debounceTime y distinctUntilChanged).
  buscar(texto: string) {
    this.termino.set(texto);
    this.busqueda$.next(texto);
  }

  // Vuelve a pedir la búsqueda actual. Lo usa el formulario después de
  // guardar o borrar, y el botón Reintentar después de un error.
  recargar() {
    this.busqueda$.next(this.busqueda$.value);
  }

  elegirCategoria(categoria: Categoria | null) {
    this.categoria.set(categoria);
  }

  // Clic en una tarjeta: la elige; clic en la que ya estaba elegida: la suelta.
  elegir(clase: Clase) {
    this.seleccionada.update((actual) => (actual?.id === clase.id ? null : clase));
  }
}
