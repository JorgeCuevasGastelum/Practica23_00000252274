// <app-formulario-clase> — crear Y editar una clase con el mismo formulario.
//   /clases/nueva        → sin id → POST /clases
//   /clases/:id/editar   → con id → se llena con patchValue y guarda con PATCH
// El id llega de la URL como input() gracias a withComponentInputBinding().
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Catalogo } from '../../catalogo';
import type { ConCambios } from '../../guardas/confirmar-salida';
import { CATEGORIAS, type Categoria, type ClaseNueva } from '../../modelos/clase';
import { ClasesApi } from '../../servicios/clases-api';
import { mensajeDeApi, mensajesDelCuerpo } from '../../servicios/errores';
import { bloquesDe5 } from '../../validadores/bloques-de-5';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-formulario-clase',
  styleUrl: './formulario-clase.css',
  templateUrl: './formulario-clase.html',
})
export class FormularioClase implements OnInit, ConCambios {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ClasesApi);
  private readonly catalogo = inject(Catalogo);
  private readonly router = inject(Router);
  protected readonly categorias = CATEGORIAS;

  // El :id de la URL. En /clases/nueva no hay, y queda undefined.
  readonly id = input<string>();
  protected readonly esEdicion = computed(() => this.id() !== undefined);

  // Las mismas reglas que valida la API (CrearClaseDto), más el bloque de 5 minutos.
  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    categoria: ['' as Categoria | '', Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(255)]],
    duracionMin: [null as number | null, [Validators.required, Validators.min(10), Validators.max(180), bloquesDe5]],
    imagen: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/^\/img\/.+\.(jpg|jpeg|png|webp)$/)]],
  });

  protected readonly cargando = signal(false); // trayendo la clase para editarla
  protected readonly enviando = signal(false); // el botón se deshabilita mientras guarda
  protected readonly erroresServidor = signal<string[]>([]);

  ngOnInit() {
    const id = this.id();
    if (!id) return;
    this.cargando.set(true);
    this.api.obtener(Number(id)).subscribe({
      next: (clase) => {
        // patchValue llena los campos que se le pasan. No marca el formulario
        // como modificado: la guarda de salida no pregunta si nadie ha tocado nada.
        this.formulario.patchValue({
          nombre: clase.nombre,
          categoria: clase.categoria,
          descripcion: clase.descripcion,
          duracionMin: clase.duracionMin,
          imagen: clase.imagen,
        });
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.erroresServidor.set([mensajeDeApi(e)]);
        this.cargando.set(false);
      },
    });
  }

  // Para la guarda canDeactivate.
  tieneCambiosSinGuardar(): boolean {
    return this.formulario.dirty;
  }

  // ¿Enseñar los errores de este campo? Sólo si ya lo tocaron.
  protected mostrarErrores(campo: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
  }

  // La MISMA función para crear y editar: lo único que cambia es la petición.
  protected guardar() {
    if (this.formulario.invalid) {
      // Se marcan todos como tocados para que salgan todos los mensajes en rojo.
      this.formulario.markAllAsTouched();
      return;
    }
    const valor = this.formulario.getRawValue();
    const datos: ClaseNueva = {
      nombre: valor.nombre.trim(),
      categoria: valor.categoria as Categoria,
      descripcion: valor.descripcion.trim(),
      duracionMin: Number(valor.duracionMin),
      imagen: valor.imagen.trim(),
    };

    const id = this.id();
    const peticion = id ? this.api.actualizar(Number(id), datos) : this.api.crear(datos);

    this.enviando.set(true);
    this.erroresServidor.set([]);
    // Sin subscribe() la petición NO sale: el Observable sólo describe qué hacer.
    peticion.subscribe({
      next: () => this.terminar(),
      error: (e: unknown) => {
        this.enviando.set(false);
        // 400: el ValidationPipe manda un mensaje por regla; se enseñan todos.
        const delServidor =
          e instanceof HttpErrorResponse && e.status === 400 ? mensajesDelCuerpo(e.error) : [];
        this.erroresServidor.set(delServidor.length ? delServidor : [mensajeDeApi(e)]);
      },
    });
  }

  protected eliminar() {
    const id = this.id();
    const nombre = this.formulario.controls.nombre.value;
    if (!id || !confirm(`¿Eliminar «${nombre}»? También se borran sus horarios e inscripciones.`)) {
      return;
    }
    this.enviando.set(true);
    this.erroresServidor.set([]);
    this.api.eliminar(Number(id)).subscribe({
      next: () => this.terminar(),
      error: (e: unknown) => {
        this.enviando.set(false);
        this.erroresServidor.set([mensajeDeApi(e)]);
      },
    });
  }

  // Después de guardar o eliminar: el catálogo se vuelve a pedir y se regresa a /clases.
  private terminar() {
    this.formulario.markAsPristine(); // ya se guardó: la guarda de salida no debe preguntar
    this.catalogo.recargar();
    this.router.navigate(['/clases']);
  }
}
