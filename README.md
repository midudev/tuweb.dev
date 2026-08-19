# tuweb.dev

**Una web que la construye quien la visita.** La gente propone qué quiere que
tenga, cada 30 minutos se cierra la votación, y una IA implementa la idea más
repetida, la despliega y la sube a este repositorio. Sin nadie tocando nada.

Si el cambio rompe la web, vuelve atrás sola.

---

## Cómo funciona

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

## Stack

Poca cosa a propósito: cuanta menos superficie, menos cosas que puede romper la
IA sin que nadie mire.

| Pieza | Qué se usa |
|---|---|
| Framework | Astro 7 en modo servidor, con el adapter de Node |
| Estilos | Tailwind 4, sin build extra (plugin de Vite) |
| Base de datos | SQLite con `node:sqlite`, el módulo nativo de Node 24 — cero dependencias |
| Sesión | Cookie firmada, sin librería de auth |
| Moderación | Heurística propia + un modelo por HTTP, opcional |
| Proceso | pm2 (o systemd), nginx por delante |

Dependencias de producción: Astro, su adapter de Node, Tailwind y los iconos.
Nada más.

**Requiere Node >= 24** por `node:sqlite`.

---

## Arrancarlo en local

```bash
git clone git@github.com:midudev/tuweb.dev.git
cd tuweb.dev
pnpm install                                     # instala dependencias
cp .env.example .env                             # copia la plantilla de variables
pnpm dev                                         # http://localhost:4321
```

Con el `.env` de ejemplo tal cual ya funciona: la base de datos se crea sola en
`local.db` y, si no hay OAuth App configurada, el login usa tu sesión de
`gh auth` para no obligarte a registrar nada.

Lo único que querrás poner de verdad:

- `OPENAI_API_KEY` — sin ella la moderación se queda solo con la heurística.
- `ANTHROPIC_API_KEY` — solo si vas a probar el ciclo completo con la IA.

---

## Comandos

```bash
pnpm dev                                         # servidor de desarrollo
pnpm build                                       # compila a dist/
pnpm start                                       # arranca lo compilado, leyendo .env

pnpm process                                     # cierra la ventana: agrupa ideas y elige ganadora
pnpm iterate                                     # el ciclo entero: ventana + IA + verificación + push
pnpm release -- --pull                           # despliega los cambios del remoto, con vuelta atrás
pnpm rollback                                    # vuelve al último commit que estuvo vivo y sano
pnpm ideas:clear                                 # borra todas las ideas, previa confirmación
```

`pnpm iterate` coge un candado (`.iterate.lock`) para que dos iteraciones no se
pisen. En producción lo lanza un proceso de pm2 cada 30 minutos.

---

## Estructura

```
src/
├── components/          piezas de la interfaz
├── layouts/
├── lib/
│   ├── db/              esquema SQL, cliente y consultas
│   ├── auth.ts          sesión y OAuth de GitHub
│   ├── moderation*.ts   los dos filtros de las propuestas
│   ├── process-cycle.ts cierre de ventana: agrupar y elegir
│   ├── releases.ts      estado del despliegue
│   └── window.ts        duración de la ventana y formato
├── middleware.ts        CSP y cabeceras de seguridad
└── pages/
    ├── api/             auth, prompts, cron, health, releases
    ├── index.astro      proponer + lo que ya funciona
    ├── ideas.astro      las ideas de esta ventana
    └── changelog.astro  lo que la IA ha ido implementando

scripts/
├── iterate.mjs          el ciclo completo con la IA
├── release.mjs          despliegue con verificación y vuelta atrás
├── rollback.mjs
└── lib/guards.mjs       la revisión del diff
```

---

## Seguridad

Todo lo que escribe la gente es texto de desconocidos que acaba cerca de una IA
con permiso de escritura en el repositorio. Por eso hay cuatro filtros en
cadena, no uno:

1. **Heurística** al enviar (`src/lib/moderation.ts`).
2. **Modelo** que clasifica lo que la heurística no pilla
   (`src/lib/moderation-llm.ts`), con el razonamiento al máximo: es la puerta de
   entrada.
3. **Vallado del prompt**: la idea llega a la IA como dato, y el prompt del
   sistema dice explícitamente que no obedezca lo que venga dentro.
4. **Revisión del diff** antes de publicar (`scripts/lib/guards.mjs`): rutas
   permitidas, tope de líneas y ninguna línea nueva con secretos.

La IA tiene esos ficheros y `src/middleware.ts` en su lista negra: no puede
editarlos. **Si tocas esa parte, no le quites las defensas.**

Además: la web escucha solo en `127.0.0.1` detrás de nginx, el `.env` es `600` y
nunca entra en git, `CRON_SECRET` protege los endpoints internos, y el proceso
corre con un usuario sin privilegios.

---

## Despliegue

En un VPS con Ubuntu: nginx delante, la web con pm2 escuchando solo en local, y
HTTPS con Let's Encrypt. Los despliegues van con `pnpm release`, que verifica que
la web responde de verdad antes de dar el cambio por bueno y deshace solo si no.

El repositorio trae la configuración de pm2 (`ecosystem.config.cjs`) y las
unidades de systemd (`deploy/`) por si prefieres ese camino. Usa uno o el otro,
no los dos.

---

## Licencia

[Apache 2.0](LICENSE). Puedes usarlo, modificarlo y distribuirlo, también en
proyectos comerciales, siempre que mantengas el aviso de copyright y digas qué
has cambiado. Incluye una concesión expresa de patentes.
