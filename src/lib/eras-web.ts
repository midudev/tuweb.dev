/**
 * Las épocas del diseño web, de la primera página del CERN a las container
 * queries. Cada una lleva su año, lo que la marcó y un trozo de código escrito
 * como se escribía entonces: etiquetas en mayúsculas, tablas para maquetar o
 * variables CSS, según toque. Son recreaciones, no copias de webs reales, y no
 * cargan nada de fuera: el ejemplo se pinta tal cual dentro de un iframe sin
 * scripts.
 */

export interface Era {
	/** El año, que es también su ancla en el enlace. */
	year: number;
	title: string;
	/** Una línea para el resumen. */
	line: string;
	/** Lo que la define, en tres o cuatro rasgos. */
	traits: string[];
	/** El código de la época, HTML con su CSS dentro si lo había. */
	code: string;
}

export const ERAS: Era[] = [
	{
		year: 1991,
		title: 'Solo texto',
		line: 'La primera web: texto, enlaces y nada más. El navegador decidía cómo se veía.',
		traits: ['HTML sin CSS', 'Enlaces como novedad', 'Etiquetas en mayúsculas'],
		code: `<HTML>
<HEADER>
<TITLE>El proyecto World Wide Web</TITLE>
</HEADER>
<BODY>
<H1>World Wide Web</H1>
La WorldWideWeb (W3) es una iniciativa de recuperación
de información hipertextual para dar acceso universal
a un gran universo de documentos.
<P>
Todo lo que hay sobre el proyecto está enlazado
desde aquí, incluido un <A HREF="#">resumen</A>,
la <A HREF="#">gente</A> que lo hace y cómo
<A HREF="#">conseguir el código</A>.
<DL>
<DT><A HREF="#">Qué hay aquí</A>
<DD>Una lista de servidores por tema.
<DT><A HREF="#">Ayuda</A>
<DD>Sobre el programa que estás usando.
</DL>
</BODY>
</HTML>`,
	},
	{
		year: 1996,
		title: 'Páginas personales',
		line: 'GeoCities y compañía: todo el mundo tiene su página, y se nota.',
		traits: ['<font> y bgcolor', 'Texto que se mueve', 'Contador de visitas', 'En construcción'],
		code: `<HTML>
<BODY BGCOLOR="#000080" TEXT="#FFFF00" LINK="#00FFFF">
<CENTER>
<FONT FACE="Comic Sans MS" SIZE="6" COLOR="#FF00FF">
Bienvenidos a mi página!!!
</FONT>
<MARQUEE BGCOLOR="#FF0000">*** Página en construcción ***</MARQUEE>
<HR>
<FONT SIZE="4">Aquí hablo de mis grupos favoritos,
mis juegos y mi perro.</FONT>
<P>
<TABLE BORDER="3" BGCOLOR="#C0C0C0">
<TR><TD><FONT COLOR="#000000">Eres el visitante número</FONT></TD></TR>
<TR><TD ALIGN="CENTER"><FONT FACE="Courier" SIZE="5" COLOR="#00AA00">000417</FONT></TD></TR>
</TABLE>
<P>
<A HREF="#">Firma mi libro de visitas</A>
<HR>
<FONT SIZE="2">Mejor visto con Netscape a 800x600</FONT>
</CENTER>
</BODY>
</HTML>`,
	},
	{
		year: 1999,
		title: 'Maquetar con tablas',
		line: 'El diseño entra a la fuerza: tablas anidadas, columnas fijas y gifs transparentes.',
		traits: ['Layout con <table>', 'Ancho fijo', 'Menú a la izquierda', 'Imágenes cortadas'],
		code: `<html>
<body bgcolor="#ffffff" topmargin="0" leftmargin="0">
<table width="760" border="0" cellpadding="0" cellspacing="0" align="center">
  <tr>
    <td colspan="2" bgcolor="#003366" height="60">
      <font face="Verdana" size="5" color="#ffffff">&nbsp;MiEmpresa.com</font>
    </td>
  </tr>
  <tr>
    <td width="150" bgcolor="#e0e8f0" valign="top">
      <font face="Verdana" size="2">
      <br>&nbsp;<a href="#">Inicio</a>
      <br>&nbsp;<a href="#">Productos</a>
      <br>&nbsp;<a href="#">Contacto</a>
      </font>
    </td>
    <td width="610" valign="top">
      <table width="100%" cellpadding="10"><tr><td>
        <font face="Verdana" size="2">
        <b>Novedades</b><br>
        Ya puede comprar en nuestra tienda online.
        </font>
      </td></tr></table>
    </td>
  </tr>
</table>
</body>
</html>`,
	},
	{
		year: 2003,
		title: 'Estándares y CSS',
		line: 'El contenido en HTML y el aspecto en CSS. Los divs con float sustituyen a las tablas.',
		traits: ['XHTML estricto', 'Layout con float', 'Separar contenido y estilo'],
		code: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN">
<html>
<head>
<style type="text/css">
  body { font: 13px Georgia, serif; background: #eee; margin: 0; }
  #contenedor { width: 700px; margin: 0 auto; background: #fff; }
  #cabecera { padding: 20px; border-bottom: 4px solid #8a2; }
  #menu { float: left; width: 160px; padding: 20px; }
  #menu li { list-style: none; margin-bottom: 6px; }
  #contenido { margin-left: 200px; padding: 20px; }
  #pie { clear: both; padding: 10px 20px; font-size: 11px; color: #777; }
</style>
</head>
<body>
<div id="contenedor">
  <div id="cabecera"><h1>Jardín de CSS</h1></div>
  <ul id="menu"><li><a href="#">Inicio</a></li><li><a href="#">Diseños</a></li></ul>
  <div id="contenido">
    <p>El mismo HTML, mil diseños distintos. Solo cambia la hoja de estilos.</p>
  </div>
  <div id="pie">XHTML y CSS válidos</div>
</div>
</body>
</html>`,
	},
	{
		year: 2006,
		title: 'Web 2.0',
		line: 'Degradados, brillos, reflejos y la palabra beta pegada a todo.',
		traits: ['Degradados brillantes', 'Sello de beta', 'Letras grandes', 'Colores vivos'],
		code: `<html>
<head>
<style>
  body { font-family: "Lucida Grande", Arial, sans-serif; background: #f0f7e8; margin: 0; }
  .cabecera { background: linear-gradient(#9cd33a, #5a9a10); padding: 24px; color: #fff;
    text-shadow: 0 -1px 0 #3d6b0a; }
  .logo { font-size: 36px; font-weight: bold; letter-spacing: -2px; }
  .beta { background: #ff6c00; font-size: 11px; padding: 2px 6px; vertical-align: top; }
  .caja { margin: 24px; padding: 20px; background: #fff; border: 1px solid #cde4b0; }
  .boton { display: inline-block; padding: 12px 24px; color: #fff; font-size: 18px;
    background: linear-gradient(#ffb347 50%, #ff8c00 50%); border: 1px solid #d07000;
    box-shadow: 0 2px 4px rgba(0,0,0,.3); text-decoration: none; }
</style>
</head>
<body>
  <div class="cabecera"><span class="logo">compartr</span> <span class="beta">BETA</span></div>
  <div class="caja">
    <h2>Comparte tus fotos con tus amigos</h2>
    <p>Etiquetas, comentarios y feeds RSS. Social.</p>
    <a class="boton" href="#">Regístrate gratis</a>
  </div>
</body>
</html>`,
	},
	{
		year: 2010,
		title: 'Diseño responsivo',
		line: 'Llega el móvil: rejillas fluidas y media queries para que una web sirva en cualquier pantalla.',
		traits: ['Media queries', 'Rejilla fluida en %', 'Meta viewport', 'Móvil primero'],
		code: `<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: Helvetica, Arial, sans-serif; margin: 0; color: #333; }
  header { background: #2c3e50; color: #fff; padding: 1em 4%; }
  .columna { float: left; width: 29.33%; margin: 2%; padding: 1em 0; }
  .columna h3 { margin-top: 0; color: #c0392b; }
  @media (max-width: 600px) {
    .columna { float: none; width: auto; margin: 0 4%; border-bottom: 1px solid #ddd; }
    header { text-align: center; }
  }
</style>
</head>
<body>
  <header><h1>Responsive</h1></header>
  <div class="columna"><h3>Fluido</h3><p>Anchos en porcentaje.</p></div>
  <div class="columna"><h3>Flexible</h3><p>Imágenes con max-width.</p></div>
  <div class="columna"><h3>Adaptable</h3><p>Prueba la vista de móvil.</p></div>
</body>
</html>`,
	},
	{
		year: 2013,
		title: 'Diseño plano',
		line: 'Fuera brillos y texturas: colores planos, mucho aire y la portada con su gran titular.',
		traits: ['Colores planos', 'Hero a pantalla completa', 'Tarjetas', 'Tipografía web'],
		code: `<html>
<head>
<style>
  body { font-family: "Helvetica Neue", Arial, sans-serif; margin: 0; color: #34495e; }
  .hero { background: #1abc9c; color: #fff; text-align: center; padding: 60px 20px; }
  .hero h1 { font-weight: 300; font-size: 40px; margin: 0 0 20px; }
  .btn { background: #e74c3c; color: #fff; padding: 14px 28px; text-decoration: none; }
  .tarjetas { display: table; width: 100%; border-spacing: 20px; }
  .tarjeta { display: table-cell; background: #ecf0f1; padding: 20px; }
  .tarjeta h3 { color: #3498db; margin-top: 0; }
</style>
</head>
<body>
  <div class="hero">
    <h1>Una app. Cero distracciones.</h1>
    <a class="btn" href="#">Empezar</a>
  </div>
  <div class="tarjetas">
    <div class="tarjeta"><h3>Rápida</h3>Sin sombras ni brillos.</div>
    <div class="tarjeta"><h3>Clara</h3>Solo lo que hace falta.</div>
    <div class="tarjeta"><h3>Plana</h3>Color y tipografía.</div>
  </div>
</body>
</html>`,
	},
	{
		year: 2017,
		title: 'Flexbox y Grid',
		line: 'CSS por fin sabe maquetar: rejillas de verdad, sin floats ni trucos.',
		traits: ['display: grid', 'Áreas con nombre', 'gap', 'Centrar sin sufrir'],
		code: `<html>
<head>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; }
  .pagina {
    display: grid;
    grid-template-areas: "cab cab" "menu main" "pie pie";
    grid-template-columns: 180px 1fr;
    grid-template-rows: auto 1fr auto;
    gap: 12px; min-height: 100vh; padding: 12px; box-sizing: border-box;
  }
  .pagina > * { background: #f3f0ff; padding: 16px; }
  header { grid-area: cab; background: #5b3cc4 !important; color: #fff; }
  nav { grid-area: menu; display: flex; flex-direction: column; gap: 8px; }
  main { grid-area: main; display: flex; align-items: center; justify-content: center; }
  footer { grid-area: pie; text-align: center; }
</style>
</head>
<body>
  <div class="pagina">
    <header>Grid</header>
    <nav><a href="#">Uno</a><a href="#">Dos</a><a href="#">Tres</a></nav>
    <main>Centrado, por fin.</main>
    <footer>Sin un solo float</footer>
  </div>
</body>
</html>`,
	},
	{
		year: 2020,
		title: 'Variables y modo oscuro',
		line: 'Los colores pasan a variables, el sistema dice si es de día o de noche y la letra crece con la pantalla.',
		traits: ['Custom properties', 'prefers-color-scheme', 'clamp()', 'system-ui'],
		code: `<html>
<head>
<style>
  :root {
    --fondo: #ffffff; --texto: #1a1a1a; --acento: #0066ff;
    color-scheme: light dark;
  }
  @media (prefers-color-scheme: dark) {
    :root { --fondo: #121212; --texto: #eaeaea; --acento: #66a3ff; }
  }
  body {
    background: var(--fondo); color: var(--texto);
    font: clamp(1rem, 0.8rem + 1vw, 1.25rem) / 1.6 system-ui, sans-serif;
    max-width: 60ch; margin: 0 auto; padding: 2rem;
  }
  h1 { font-size: clamp(1.8rem, 1rem + 4vw, 3rem); }
  a { color: var(--acento); }
</style>
</head>
<body>
  <h1>Hola, sistema</h1>
  <p>Cambia el modo oscuro de tu equipo y esta página lo sigue sola.
  Todo sale de tres <a href="#">variables</a>.</p>
</body>
</html>`,
	},
	{
		year: 2024,
		title: 'CSS que se adapta solo',
		line: 'Los componentes miran su propio ancho, CSS anida como Sass y :has elige padres.',
		traits: ['Container queries', 'CSS anidado', ':has()', 'oklch()'],
		code: `<html>
<head>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 1rem;
    display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; }
  .hueco { container-type: inline-size; }
  .tarjeta {
    display: grid; gap: 0.75rem; padding: 1rem;
    background: oklch(95% 0.03 250);
    & h3 { margin: 0; color: oklch(45% 0.2 250); }
    & .marca { background: oklch(70% 0.15 160); min-height: 4rem; }
    &:has(input:checked) { outline: 3px solid oklch(65% 0.2 30); }
  }
  @container (min-width: 320px) {
    .tarjeta { grid-template-columns: 6rem 1fr; }
  }
</style>
</head>
<body>
  <div class="hueco"><div class="tarjeta"><div class="marca"></div>
    <div><h3>Ancha</h3><label><input type="checkbox"> Marcar</label></div></div></div>
  <div class="hueco"><div class="tarjeta"><div class="marca"></div>
    <div><h3>Estrecha</h3><label><input type="checkbox"> Marcar</label></div></div></div>
</body>
</html>`,
	},
];
