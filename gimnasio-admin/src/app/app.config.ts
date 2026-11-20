import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { alFallar, conToken } from './sesion/interceptores';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: los parámetros de la URL (:id) llegan al
    // componente como input().
    provideRouter(routes, withComponentInputBinding()),
    // Toda petición de HttpClient (y de httpResource) pasa por los interceptores:
    // conToken le pone el Authorization y alFallar cierra la sesión con un 401.
    provideHttpClient(withInterceptors([conToken, alFallar])),
  ],
};
