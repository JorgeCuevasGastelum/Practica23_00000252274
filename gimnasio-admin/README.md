# Practica 23 — El panel del gimnasio: el buscador con RxJS
## Jorge Cuevas Gastelum - 00000252274
## Topico de Aplicaciones Web 7:30 - 9:00 P:M

El catalogo del panel ya tiene buscador: mientras escribes, le pregunta a la
API con GET /clases?q=…, pero espera a que dejes de teclear y cancela las
peticiones que ya no sirven. Todo con operadores de RxJS.

Lo nuevo esta en:

- src/app/servicios/clases-api.ts: el metodo buscar(q), con el parametro q.
- src/app/catalogo.ts: el httpResource se cambio por un BehaviorSubject con
  switchMap, catchError, startWith y scan, convertido en signal con toSignal.
  Se conservo recargar(), que usa el formulario despues de guardar o borrar.
- src/app/paginas/lista-clases/: la caja de busqueda con un FormControl,
  debounceTime, distinctUntilChanged y takeUntilDestroyed, y el mensaje
  cuando ninguna clase coincide.

Los botones «Vaciar catalogo» y «Restaurar catalogo» de las practicas 19 a 21
se quitaron. Eran para ver @empty con datos locales, y ahora las clases son
de la API.

Para correrlo:

1. En Practica15_Gimnasio_Backend-main: `npx prisma db seed` y luego
   `npm run start:dev`, en http://localhost:3000.
2. En gimnasio-admin/: `npm install` y `npm start`.
3. Abrir http://localhost:4200 y entrar con admin@itson.mx / gimnasio2026.

Para ver las peticiones canceladas, en el .env del backend se quita el # de
`RETARDO_MS=600` y se reinicia el backend. Despues se vuelve a poner el #,
porque hace lento todo, hasta el login.

Necesita Node 22.22.3, 24.15 o mas nuevo.

Las capturas estan en la carpeta evidencias/.


## Preguntas — Ejercicio 1

### 1. ¿Que diferencia hay entre un signal y un Observable?

Un **signal** es un valor: siempre tiene uno, y se lee en el momento
llamandolo, como clases(). Angular sabe solo quien lo lee y le avisa cuando
cambia. No hay que suscribirse ni desuscribirse, y no tiene nocion de
"error" ni de "ya termine". Sirve para el **estado**: lo que hay ahorita.

Un **Observable** es una corriente de valores en el tiempo: pueden llegar
muchos, ninguno, o un error. Es perezoso: no hace nada hasta que alguien le
hace subscribe(), y hay que desuscribirse para que no se quede escuchando. Su
fuerza esta en los operadores para manejar el tiempo: esperar
(debounceTime), descartar repetidos (distinctUntilChanged) o cancelar lo
viejo cuando llega algo nuevo (switchMap). Sirve para **eventos**: teclas,
peticiones, cosas que pasan.

En el catalogo se usan los dos: el tubo de la busqueda es un Observable,
porque se trata de tiempo y cancelaciones, y al final toSignal lo convierte
en signal. Asi los templates y los computed() lo siguen leyendo igual que
antes, sin subscribe().


## Preguntas — Ejercicio 2

### 1. ¿Que problema evita switchMap y que pasaria con mergeMap?

switchMap evita que **una respuesta vieja pise a una nueva**. Cada que llega
un texto nuevo, switchMap cancela la peticion que seguia en camino y se
queda solo con la ultima. En la pestaña Red, con RETARDO_MS, se ve: al
escribir "cami" despacio, q=c, q=ca y q=cam salen como canceladas y solo
q=cami responde 200. Ademas el servidor deja de trabajar en respuestas que ya
nadie va a usar.

Con **mergeMap** no se cancela nada: las cuatro peticiones corren al mismo
tiempo y cada una pinta su resultado cuando llega. Como el servidor no
siempre contesta en orden, si q=ca tardara mas que q=cami, llegaria al final y
la pantalla diria "cami" en la caja pero enseñaria los resultados de "ca". Es
una condicion de carrera: falla a veces, depende de la red y es dificil de
reproducir. Tambien se mandarian todas las peticiones completas, aunque solo
importe la ultima.

### 2. ¿Que pasa si se quita catchError y la API se apaga?

Un error en RxJS **termina** el Observable. Sin catchError, el error de la
peticion sale del switchMap y mata todo el tubo de busqueda:

- toSignal guarda el error, y al leer clases() desde el template lo vuelve a
  lanzar. La pagina truena con un error en la consola en lugar de enseñar un
  aviso.
- El BehaviorSubject queda sin nadie escuchando. Aunque la API se vuelva a
  prender y la persona escriba otra cosa, ya no se manda ninguna peticion:
  el buscador queda muerto hasta recargar la pagina.

Con el catchError **adentro** del switchMap, el error solo termina esa
peticion: se convierte en un valor normal ({ error: "No se pudo contactar la
API…" }) y el tubo de afuera sigue vivo. Se probo asi: con la API apagada sale
el aviso con Reintentar, y al prenderla, la siguiente busqueda ("kettle")
funciono normal.


## El error NG0203

takeUntilDestroyed() necesita saber cual componente se va a destruir, y eso
lo busca con inject(). Por eso solo funciona en un **contexto de
inyeccion**: el constructor o la declaracion de una propiedad. Si el tubo de
la caja de busqueda se mueve del constructor a ngOnInit(), Angular truena
con:

```
NG0203: takeUntilDestroyed() can only be used within an injection context such as a constructor, a factory function, a field initializer, or a function used with `runInInjectionContext`.
```

Si de verdad hiciera falta en ngOnInit, se le puede pasar el DestroyRef a
mano: `takeUntilDestroyed(this.destroyRef)`, con el destroyRef pedido con
inject() en una propiedad.
