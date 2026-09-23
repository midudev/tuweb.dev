/**
 * El laboratorio de animaciones CSS. Aquí están los efectos de la casa, los
 * mandos que se pueden tocar y el CSS que sale de todo eso. La vista previa usa
 * los mismos fotogramas con la Web Animations API, así que lo que se ve es lo
 * que se copia.
 */

export type EffectId = 'fade' | 'slide' | 'rotate' | 'scale' | 'bounce' | 'pulse' | 'shake';
export type Side = 'left' | 'right' | 'top' | 'bottom';
export type Direction = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
export type Fill = 'none' | 'forwards' | 'backwards' | 'both';

/** Un fotograma: en qué punto va (0 a 1) y lo que cambia ahí. */
export interface Frame {
	offset: number;
	props: Record<string, string>;
}

export interface AnimationOptions {
	effect: EffectId;
	side: Side;
	/** En milisegundos. */
	duration: number;
	delay: number;
	/** 0 es para siempre. */
	iterations: number;
	direction: Direction;
	timing: string;
	fill: Fill;
	selector: string;
}

export const DURATION = { min: 100, max: 5000, step: 50 };
export const DELAY = { min: 0, max: 3000, step: 50 };
export const ITERATIONS_MAX = 10;
export const SELECTOR_MAX = 30;

export const EFFECTS: readonly { id: EffectId; label: string; icon: string; name: string }[] = [
	{ id: 'fade', label: 'Desvanecer', icon: 'brightness-half', name: 'desvanecer' },
	{ id: 'slide', label: 'Deslizar', icon: 'transition-right', name: 'deslizar' },
	{ id: 'rotate', label: 'Rotar', icon: 'rotate', name: 'rotar' },
	{ id: 'scale', label: 'Escalar', icon: 'arrows-maximize', name: 'escalar' },
	{ id: 'bounce', label: 'Rebotar', icon: 'arrow-bounce', name: 'rebotar' },
	{ id: 'pulse', label: 'Latir', icon: 'heartbeat', name: 'latir' },
	{ id: 'shake', label: 'Sacudir', icon: 'wave-sine', name: 'sacudir' },
];

export const SIDES: readonly { id: Side; label: string; icon: string }[] = [
	{ id: 'left', label: 'Izquierda', icon: 'arrow-right' },
	{ id: 'right', label: 'Derecha', icon: 'arrow-left' },
	{ id: 'top', label: 'Arriba', icon: 'arrow-down' },
	{ id: 'bottom', label: 'Abajo', icon: 'arrow-up' },
];

export const DIRECTIONS: readonly { id: Direction; label: string }[] = [
	{ id: 'normal', label: 'Normal' },
	{ id: 'reverse', label: 'Al revés' },
	{ id: 'alternate', label: 'Ida y vuelta' },
	{ id: 'alternate-reverse', label: 'Vuelta e ida' },
];

export const FILLS: readonly { id: Fill; label: string }[] = [
	{ id: 'none', label: 'Nada' },
	{ id: 'forwards', label: 'El final' },
	{ id: 'backwards', label: 'El principio' },
	{ id: 'both', label: 'Los dos' },
];

export const TIMINGS: readonly { id: string; label: string }[] = [
	{ id: 'linear', label: 'linear' },
	{ id: 'ease', label: 'ease' },
	{ id: 'ease-in', label: 'ease-in' },
	{ id: 'ease-out', label: 'ease-out' },
	{ id: 'ease-in-out', label: 'ease-in-out' },
	{ id: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)', label: 'con muelle' },
	{ id: 'steps(5, end)', label: 'a saltos' },
];

export const DEFAULT_OPTIONS: AnimationOptions = {
	effect: 'bounce',
	side: 'left',
	duration: 1000,
	delay: 0,
	iterations: 0,
	direction: 'normal',
	timing: 'ease-in-out',
	fill: 'both',
	selector: 'caja',
};

const KEY = 'tuweb:animaciones';

const SLIDE_FROM: Record<Side, string> = {
	left: 'translateX(-120%)',
	right: 'translateX(120%)',
	top: 'translateY(-120%)',
	bottom: 'translateY(120%)',
};

/** Varios puntos con lo mismo, que en los rebotes se repite mucho. */
function at(offsets: number[], props: Record<string, string>): Frame[] {
	return offsets.map((offset) => ({ offset, props }));
}

export function framesOf(effect: EffectId, side: Side): Frame[] {
	switch (effect) {
		case 'fade':
			return [
				{ offset: 0, props: { opacity: '0' } },
				{ offset: 1, props: { opacity: '1' } },
			];
		case 'slide':
			return [
				{ offset: 0, props: { transform: SLIDE_FROM[side], opacity: '0' } },
				{ offset: 1, props: { transform: 'translate(0, 0)', opacity: '1' } },
			];
		case 'rotate':
			return [
				{ offset: 0, props: { transform: 'rotate(0deg)' } },
				{ offset: 1, props: { transform: 'rotate(360deg)' } },
			];
		case 'scale':
			return [
				{ offset: 0, props: { transform: 'scale(0)', opacity: '0' } },
				{ offset: 1, props: { transform: 'scale(1)', opacity: '1' } },
			];
		case 'bounce':
			return [
				...at([0, 0.2, 0.5, 0.8, 1], { transform: 'translateY(0)' }),
				{ offset: 0.4, props: { transform: 'translateY(-30px)' } },
				{ offset: 0.6, props: { transform: 'translateY(-15px)' } },
			].sort((a, b) => a.offset - b.offset);
		case 'pulse':
			return [
				...at([0, 1], { transform: 'scale(1)' }),
				{ offset: 0.5, props: { transform: 'scale(1.15)' } },
			].sort((a, b) => a.offset - b.offset);
		case 'shake':
			return [
				...at([0, 1], { transform: 'translateX(0)' }),
				...at([0.1, 0.3, 0.5, 0.7, 0.9], { transform: 'translateX(-8px)' }),
				...at([0.2, 0.4, 0.6, 0.8], { transform: 'translateX(8px)' }),
			].sort((a, b) => a.offset - b.offset);
	}
}

/** El nombre de los @keyframes: el del efecto, y el lado si desliza. */
export function animationName(options: AnimationOptions) {
	const effect = EFFECTS.find((item) => item.id === options.effect) ?? EFFECTS[0];
	if (options.effect !== 'slide') return effect.name;
	const side = SIDES.find((item) => item.id === options.side) ?? SIDES[0];
	return `${effect.name}-${side.label.toLowerCase()}`;
}

function offsetLabel(offset: number) {
	if (offset === 0) return 'from';
	if (offset === 1) return 'to';
	return `${Math.round(offset * 100)}%`;
}

function propsText(props: Record<string, string>) {
	return Object.entries(props)
		.map(([key, value]) => `${key}: ${value};`)
		.join(' ');
}

/** Junta los puntos que llevan lo mismo, como se escribiría a mano. */
function keyframesText(frames: Frame[]) {
	const groups = new Map<string, number[]>();
	for (const frame of frames) {
		const body = propsText(frame.props);
		groups.set(body, [...(groups.get(body) ?? []), frame.offset]);
	}
	return [...groups.entries()]
		.sort(([, a], [, b]) => a[0] - b[0])
		.map(([body, offsets]) => `  ${offsets.map(offsetLabel).join(', ')} { ${body} }`)
		.join('\n');
}

function ms(value: number) {
	return value % 1000 === 0 ? `${value / 1000}s` : `${value}ms`;
}

export function animationShorthand(options: AnimationOptions) {
	const iterations = options.iterations === 0 ? 'infinite' : String(options.iterations);
	return [
		animationName(options),
		ms(options.duration),
		options.timing,
		ms(options.delay),
		iterations,
		options.direction,
		options.fill,
	].join(' ');
}

/** El CSS entero, listo para pegar: los @keyframes y la regla con animation. */
export function cssOf(options: AnimationOptions) {
	const frames = framesOf(options.effect, options.side);
	return [
		`@keyframes ${animationName(options)} {`,
		keyframesText(frames),
		'}',
		'',
		`.${options.selector || DEFAULT_OPTIONS.selector} {`,
		`  animation: ${animationShorthand(options)};`,
		'}',
		'',
	].join('\n');
}

/** Los fotogramas en el formato que pide element.animate(). */
export function webFrames(options: AnimationOptions): Keyframe[] {
	return framesOf(options.effect, options.side).map((frame) => ({ offset: frame.offset, ...frame.props }));
}

export function webTiming(options: AnimationOptions): KeyframeAnimationOptions {
	return {
		duration: options.duration,
		delay: options.delay,
		iterations: options.iterations === 0 ? Infinity : options.iterations,
		direction: options.direction,
		easing: options.timing,
		fill: options.fill,
	};
}

/** Un nombre de clase que se pueda pegar tal cual: letras, números y guiones. */
export function cleanSelector(value: string) {
	return value
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, '-')
		.replace(/^[^a-z_]+/, '')
		.slice(0, SELECTOR_MAX);
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
	const number = Number(value);
	if (!Number.isFinite(number)) return fallback;
	return Math.min(max, Math.max(min, Math.round(number)));
}

function pick<T extends string>(value: unknown, items: readonly { id: T }[], fallback: T): T {
	return items.find((item) => item.id === value)?.id ?? fallback;
}

/** Lo que llegue —del localStorage o de un campo— pasado por los topes. */
export function toOptions(data: Partial<Record<keyof AnimationOptions, unknown>>): AnimationOptions {
	return {
		effect: pick(data.effect, EFFECTS, DEFAULT_OPTIONS.effect),
		side: pick(data.side, SIDES, DEFAULT_OPTIONS.side),
		duration: clamp(data.duration, DURATION.min, DURATION.max, DEFAULT_OPTIONS.duration),
		delay: clamp(data.delay, DELAY.min, DELAY.max, DEFAULT_OPTIONS.delay),
		iterations: clamp(data.iterations, 0, ITERATIONS_MAX, DEFAULT_OPTIONS.iterations),
		direction: pick(data.direction, DIRECTIONS, DEFAULT_OPTIONS.direction),
		timing: pick(data.timing, TIMINGS, DEFAULT_OPTIONS.timing),
		fill: pick(data.fill, FILLS, DEFAULT_OPTIONS.fill),
		selector: cleanSelector(typeof data.selector === 'string' ? data.selector : '') || DEFAULT_OPTIONS.selector,
	};
}

export function loadOptions(): AnimationOptions {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...DEFAULT_OPTIONS };
		return toOptions(JSON.parse(raw) as Record<string, unknown>);
	} catch {
		return { ...DEFAULT_OPTIONS };
	}
}

export function saveOptions(options: AnimationOptions) {
	try {
		localStorage.setItem(KEY, JSON.stringify(options));
		return true;
	} catch {
		return false;
	}
}
