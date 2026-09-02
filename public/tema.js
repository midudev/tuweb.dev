/*
 * Lo único que corre antes de pintar. Si esta visita eligió el modo oscuro, el
 * <html> ya sale marcado y la web no parpadea en claro un instante. Lo demás
 * —acento y fondo— lo pone src/lib/theme.ts en cuanto carga.
 *
 * Va en un fichero suelto y no en un script de la cabecera porque la CSP es
 * script-src 'self': nada en línea. La clave es la misma que usa theme.ts.
 */
(function () {
	try {
		if (localStorage.getItem('tuweb:modo') === 'oscuro') {
			document.documentElement.dataset.tema = 'oscuro';
		}
	} catch (error) {
		// Sin localStorage (modo privado o permisos): el claro de siempre.
	}
})();
