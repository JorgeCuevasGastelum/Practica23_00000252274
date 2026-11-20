// app.routes.ts — el mapa de rutas del panel.
// Angular revisa las rutas EN ORDEN y se queda con la primera que coincide.
import { Routes } from '@angular/router';
import { confirmarSalida } from './guardas/confirmar-salida';
import { Horarios } from './paginas/horarios/horarios';
import { ListaClases } from './paginas/lista-clases/lista-clases';
import { Login } from './paginas/login/login';
import { Miembros } from './paginas/miembros/miembros';
import { Panel } from './paginas/panel/panel';
import { soloAdmin } from './sesion/solo-admin';

// loadComponent: el formulario y el detalle se bajan hasta que se visitan.
const formulario = () =>
  import('./paginas/formulario-clase/formulario-clase').then((m) => m.FormularioClase);

export const routes: Routes = [
  { path: 'login', component: Login },

  // El panel es el marco (la barra y su <router-outlet>). Sus páginas son
  // rutas HIJAS: se pintan adentro, y el guardia las protege a todas juntas.
  {
    path: '',
    component: Panel,
    canActivate: [soloAdmin],
    children: [
      // pathMatch: 'full': sólo cuando la URL está vacía de verdad.
      { path: '', redirectTo: 'clases', pathMatch: 'full' },
      { path: 'clases', component: ListaClases },
      // 'nueva' va ANTES que ':id': si no, ':id' se quedaría con «nueva».
      { path: 'clases/nueva', loadComponent: formulario, canDeactivate: [confirmarSalida] },
      { path: 'clases/:id/editar', loadComponent: formulario, canDeactivate: [confirmarSalida] },
      {
        path: 'clases/:id',
        loadComponent: () =>
          import('./paginas/detalle-clase/detalle-clase').then((m) => m.DetalleClase),
      },
      { path: 'horarios', component: Horarios },
      { path: 'miembros', component: Miembros },
    ],
  },

  // El comodín coincide con cualquier cosa: por eso va al final.
  { path: '**', redirectTo: '' },
];
