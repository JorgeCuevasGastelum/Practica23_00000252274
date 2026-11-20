// guardas/confirmar-salida.ts — la guarda de salida del formulario.
// canDeactivate corre cuando el router está por SALIR de la ruta: si regresa
// false, la navegación se cancela y la persona se queda en el formulario.
import type { CanDeactivateFn } from '@angular/router';

/** Lo que tiene que saber responder un componente que usa esta guarda. */
export interface ConCambios {
  tieneCambiosSinGuardar(): boolean;
}

export const confirmarSalida: CanDeactivateFn<ConCambios> = (componente) =>
  !componente.tieneCambiosSinGuardar() ||
  confirm('Tienes cambios sin guardar. ¿Salir de todos modos?');
