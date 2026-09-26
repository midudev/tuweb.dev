/**
 * Efectos de sonido al usar la web: uno al hacer clic y otro al desplazarse.
 * Todo se sintetiza con Web Audio en el navegador, sin ficheros de audio. El
 * ajuste vive en el localStorage de quien lo elige y viene apagado de serie.
 */

type Onda = OscillatorType | 'ruido';

/** Un golpe corto: de qué frecuencia a cuál resbala, cuánto dura y con qué onda. */
type Golpe = { onda: Onda; desde: number; hasta: number; ms: number; peso?: number };

export const SONIDOS_CLIC: Record<string, { label: string; golpe?: Golpe }> = {
	ninguno: { label: 'Ninguno' },
	tic: { label: 'Tic', golpe: { onda: 'square', desde: 1800, hasta: 1200, ms: 25, peso: 0.35 } },
	clac: { label: 'Clac', golpe: { onda: 'ruido', desde: 2600, hasta: 2600, ms: 35 } },
	pop: { label: 'Pop', golpe: { onda: 'sine', desde: 380, hasta: 900, ms: 60 } },
	gota: { label: 'Gota', golpe: { onda: 'sine', desde: 1300, hasta: 450, ms: 90 } },
	madera: { label: 'Madera', golpe: { onda: 'triangle', desde: 720, hasta: 640, ms: 45 } },
};

// «Tono» no tiene frecuencia fija: sube y baja según lo abajo que estés.
export const SONIDOS_SCROLL: Record<string, { label: string; golpe?: Golpe }> = {
	ninguno: { label: 'Ninguno' },
	rueda: { label: 'Rueda', golpe: { onda: 'square', desde: 2400, hasta: 2200, ms: 10, peso: 0.3 } },
	roce: { label: 'Roce', golpe: { onda: 'ruido', desde: 5000, hasta: 5000, ms: 25, peso: 0.6 } },
	burbuja: { label: 'Burbuja', golpe: { onda: 'sine', desde: 300, hasta: 620, ms: 45 } },
	tono: { label: 'Tono', golpe: { onda: 'sine', desde: 0, hasta: 0, ms: 50, peso: 0.7 } },
};

export type Efectos = { activo: boolean; clic: string; scroll: string; volumen: number; paso: number };

export const EFECTOS_INICIAL: Efectos = { activo: false, clic: 'tic', scroll: 'ninguno', volumen: 40, paso: 120 };
export const VOLUMEN: [number, number] = [0, 100];
export const PASO: [number, number] = [40, 400];

const KEY = 'tuweb:efectos';

const limitar = (v: unknown, [min, max]: [number, number], d: number) =>
	typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(Math.round(v), min), max) : d;

/** Lo guardado, revisado campo a campo: lo que no cuadre, va el de serie. */
export function limpiarEfectos(g: unknown): Efectos {
	const o = (g && typeof g === 'object' ? g : {}) as Record<string, unknown>;
	const de = EFECTOS_INICIAL;
	return {
		activo: o.activo === true,
		clic: typeof o.clic === 'string' && Object.hasOwn(SONIDOS_CLIC, o.clic) ? o.clic : de.clic,
		scroll: typeof o.scroll === 'string' && Object.hasOwn(SONIDOS_SCROLL, o.scroll) ? o.scroll : de.scroll,
		volumen: limitar(o.volumen, VOLUMEN, de.volumen),
		paso: limitar(o.paso, PASO, de.paso),
	};
}

export function readEfectos(): Efectos {
	try {
		return limpiarEfectos(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
	} catch {
		// Sin localStorage, o con basura dentro: en silencio.
		return { ...EFECTOS_INICIAL };
	}
}

/** Guarda y avisa, para que la web entera cambie sin recargar. */
export function saveEfectos(efectos: Efectos) {
	try {
		localStorage.setItem(KEY, JSON.stringify(efectos));
	} catch {
		// Si no deja guardar, el ajuste dura la visita.
	}
	document.dispatchEvent(new CustomEvent('tuweb:efectos', { detail: efectos }));
}

// Un solo contexto para toda la página: los navegadores limitan cuántos hay.
let contexto: AudioContext | null = null;
let ruido: AudioBuffer | null = null;

/**
 * Sin un clic antes, el navegador no deja sonar nada. Por eso el contexto solo
 * se crea desde un gesto; el scroll, si llega primero, se queda callado.
 */
function audio(conGesto: boolean) {
	if (!contexto) {
		if (!conGesto) return null;
		try {
			contexto = new AudioContext();
		} catch {
			return null;
		}
	}
	if (contexto.state === 'suspended') {
		if (!conGesto) return null;
		contexto.resume().catch(() => {});
	}
	return contexto;
}

/** Para llamar desde un gesto: deja el audio listo sin que suene nada. */
export function despertarAudio() {
	audio(true);
}

function bufferRuido(ctx: AudioContext) {
	if (ruido) return ruido;
	ruido = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.1), ctx.sampleRate);
	const datos = ruido.getChannelData(0);
	for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
	return ruido;
}

/** Suena un golpe. `tono` (0 a 1) solo cuenta para el sonido «Tono» del scroll. */
export function sonar(golpe: Golpe | undefined, volumen: number, conGesto: boolean, tono = 0.5) {
	if (!golpe || volumen <= 0) return;
	const ctx = audio(conGesto);
	if (!ctx) return;

	const t0 = ctx.currentTime + 0.005;
	const t1 = t0 + golpe.ms / 1000;
	const pico = (volumen / 100) * (golpe.peso ?? 1) * 0.5;
	const gan = ctx.createGain();
	gan.gain.setValueAtTime(0, t0);
	gan.gain.linearRampToValueAtTime(pico, t0 + Math.min(0.003, golpe.ms / 4000));
	gan.gain.exponentialRampToValueAtTime(0.0001, t1);
	gan.connect(ctx.destination);

	let fuente: AudioScheduledSourceNode;
	if (golpe.onda === 'ruido') {
		const src = ctx.createBufferSource();
		src.buffer = bufferRuido(ctx);
		const filtro = ctx.createBiquadFilter();
		filtro.type = 'bandpass';
		filtro.frequency.value = golpe.desde;
		src.connect(filtro).connect(gan);
		fuente = src;
	} else {
		const osc = ctx.createOscillator();
		osc.type = golpe.onda;
		const desde = golpe.desde || 300 + tono * 600;
		const hasta = golpe.hasta || desde;
		osc.frequency.setValueAtTime(desde, t0);
		osc.frequency.exponentialRampToValueAtTime(hasta, t1);
		osc.connect(gan);
		fuente = osc;
	}
	fuente.start(t0);
	fuente.stop(t1 + 0.01);
}

/** Lo que haya dentro de [data-efectos-mudo] no suena solo: ya suena a mano. */
const mudo = (objetivo: EventTarget | null) =>
	objetivo instanceof Element && objetivo.closest('[data-efectos-mudo]') !== null;

/** Engancha los sonidos a toda la página. Se llama una vez, desde el layout. */
export function watchEfectos() {
	let efectos = readEfectos();
	let ultimoY = 0;
	let ultimoSonido = 0;

	document.addEventListener('tuweb:efectos', (e) => {
		efectos = limpiarEfectos((e as CustomEvent).detail);
	});

	document.addEventListener(
		'click',
		(e) => {
			if (!efectos.activo || mudo(e.target)) return;
			sonar(SONIDOS_CLIC[efectos.clic]?.golpe, efectos.volumen, true);
		},
		{ capture: true },
	);

	// Un sonido cada `paso` píxeles, y nunca más de uno cada 40 ms: una rueda
	// rápida no debería sonar a ametralladora.
	window.addEventListener(
		'scroll',
		() => {
			const y = window.scrollY;
			if (!efectos.activo || Math.abs(y - ultimoY) < efectos.paso) return;
			ultimoY = y;
			const ahora = performance.now();
			if (ahora - ultimoSonido < 40) return;
			ultimoSonido = ahora;
			const alto = document.documentElement.scrollHeight - window.innerHeight;
			const tono = alto > 0 ? 1 - y / alto : 0.5;
			sonar(SONIDOS_SCROLL[efectos.scroll]?.golpe, efectos.volumen, false, tono);
		},
		{ passive: true },
	);
}
