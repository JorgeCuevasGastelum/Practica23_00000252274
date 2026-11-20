// app.ts — el componente raíz. Ya no tiene barra: sólo el <router-outlet>.
// Ahí el router pinta el login o el panel; la barra vive en el panel.
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
