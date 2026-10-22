# tuweb.dev

> **Experimento terminado.** Hemos parado el experimento. La web sigue en
> [tuweb.dev](https://tuweb.dev) tal y como quedó, para ver cómo fue
> evolucionando, pero ya no se pueden enviar ideas ni la IA toca nada. Pronto
> haremos una segunda versión para llevarlo más lejos.

**Una web que la construía quien la visitaba.** La gente proponía qué quería
que tuviera, se cerraba la votación, y una IA implementaba la idea más
repetida, la desplegaba y la subía a este repositorio. Sin nadie tocando nada.

Si el cambio rompía la web, volvía atrás sola.

---

## Cómo funcionaba

```
   propuestas          ventana de 30 min           IA                producción
 ┌────────────┐      ┌──────────────────┐   ┌──────────────┐   ┌────────────────┐
 │ entras con │      │ se agrupan las   │   │ escribe el   │   │ compila, verifica
 │ GitHub y   │ ───▶ │ ideas parecidas  │──▶│ código de la │──▶│ y despliega    │
 │ pides algo │      │ y gana la más    │   │ idea ganadora│   │ · si falla,    │
 └────────────┘      │ repetida         │   └──────────────┘   │   vuelve atrás │
                     └──────────────────┘                      └────────────────┘
        │                     │                     │                   │
   moderación            ciclo en la DB       revisión del diff     commit + push
```

1. **Propones.** Entras con GitHub y escribes qué quieres, entre 16 y 280
   caracteres. Una idea por persona y ventana.
2. **Se filtra.** Una heurística local descarta lo obvio y un modelo da la
   segunda opinión: spam, cosas peligrosas, fuera de tema, e intentos de colarse
   en el prompt de la IA.
3. **Se cierra la ventana.** Las ideas se agrupan por parecido y gana el grupo
   con más votos. Queda registrado en `cycles`, con lo descartado y por qué.
4. **La IA lo implementa.** Claude Code recibe la idea ganadora **vallada como
   dato**, nunca como instrucción, y sin `Bash`, `WebFetch` ni `WebSearch`.
5. **Se revisa el diff antes de fiarse.** Solo `src/` y `public/`, nunca los
   ficheros de seguridad ni los de despliegue, con un tope de líneas y sin
   ninguna línea nueva que toque secretos.
6. **Se despliega de verdad.** Compila, reinicia y comprueba que la web responde
   y que las páginas traen su contenido. Si falla, la IA tiene varios intentos
   de arreglarlo; si tampoco, se deshace todo y **no se sube nada**.
7. **Solo entonces**, commit del bot y push a `main`. Al repositorio solo entra
   código que arrancó y respondió.

Todo lo que ha ido entrando está en `/changelog`, y las ideas de la ventana
actual en `/ideas`.

---

## La web archivada

Ahora es una web estática en Cloudflare (Workers con static assets). No hay
servidor, ni API, ni base de datos en producción, ni IA:

- **Las páginas** se compilan una vez contra una copia de la base de
  producción (`data/tuweb.db`, fuera de git) que se abre en solo lectura.
- **Lo que la gente compartió** —destacadas, consejos, escaparate, retos y el
  ranking del Snake— queda congelado en ficheros JSON bajo `/api/*.json`. El
  chat no: se escribió para borrarse en un día (o en diez minutos, el anónimo).
- **Al entrar** sale un aviso de que el experimento está parado
  (`src/components/Archivo.astro`), y vuelve a salir si alguien intenta entrar
  con GitHub o enviar algo.
- **Las cabeceras de seguridad** que ponía el middleware van en
  `public/_headers`.

El pipeline de la IA (`scripts/iterate.mjs`, la moderación, el cierre de
ventanas, los despliegues con vuelta atrás) está en el historial de git.

### Compilar y desplegar

```bash
pnpm install
# La copia de la base, sin sesiones y en modo DELETE (no WAL):
cp /ruta/a/la/copia.db data/tuweb.db
pnpm build                                       # genera dist/
pnpm preview                                     # sirve dist/ con wrangler en local
pnpm deploy                                      # build + wrangler deploy
```

Requiere Node >= 24 por `node:sqlite`, que solo se usa al compilar.

---

## Licencia

[Apache 2.0](LICENSE). Puedes usarlo, modificarlo y distribuirlo, también en
proyectos comerciales, siempre que mantengas el aviso de copyright y digas qué
has cambiado. Incluye una concesión expresa de patentes.
