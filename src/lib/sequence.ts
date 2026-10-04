/**
 * Secuencias de animaciones CSS: varios efectos del laboratorio (src/lib/animation.ts)
 * uno detrás de otro, cada uno con su duración. Todo se junta en un solo
 * @keyframes repartiendo el tiempo, así que el CSS que sale es una única regla
 * animation y la vista previa usa exactamente esos fotogramas.
 */
import { DURATION, EFFECTS, type EffectId, type Frame, SIDES, type Side, TIMINGS, cleanSelector, framesOf } from './animation';

export type StepEffect = EffectId | 'pause';

export interface Step {
	effect: StepEffect;
	side: Side;
	/** En milisegundos. */
	duration: number;
	/** La curva de este paso; vacía, la de toda la secuencia. */
	timing: string;
	/** Cuánto se mueve, en tanto por ciento: 100 es el efecto tal cual. */
	intensity: number;
}

/** Un fotograma con la curva que le toca hasta el siguiente, si no es la general. */
type StepFrame = Frame & { easing?: string };

export const INTENSITY = { min: 25, max: 200, step: 25 };

/** Los efectos en los que la intensidad cambia algo. */
export function hasIntensity(effect: StepEffect) {
	return effect !== 'pause' && effect !== 'fade';
}

export interface SequenceOptions {
	steps: Step[];
	timing: string;
	loop: boolean;
	selector: string;
}

export const STEPS_MAX = 8;

export const STEP_EFFECTS: readonly { id: StepEffect; label: string; name: string }[] = [
	...EFFECTS.map(({ id, label, name }) => ({ id, label, name })),
	{ id: 'pause', label: 'Pausa', name: 'pausa' },
];

export const DEFAULT_SEQUENCE: SequenceOptions = {
	steps: [
		{ effect: 'slide', side: 'left', duration: 600, timing: 'ease-out', intensity: 100 },
		{ effect: 'bounce', side: 'left', duration: 800, timing: '', intensity: 150 },
		{ effect: 'pause', side: 'left', duration: 400, timing: '', intensity: 100 },
		{ effect: 'shake', side: 'left', duration: 500, timing: '', intensity: 100 },
	],
	timing: 'ease-in-out',
	loop: true,
	selector: 'caja',
};

const KEY = 'tuweb:secuencias';

/** Lo que no toca un paso se queda en reposo, para que no se arrastre al siguiente. */
const REST = { transform: 'none', opacity: '1' };

/** Separación mínima entre el final de un paso y el principio del siguiente. */
const GAP = 0.0001;

export function totalDuration(options: SequenceOptions) {
	return options.steps.reduce((sum, step) => sum + step.duration, 0);
}

function round(offset: number) {
	return Math.round(offset * 10000) / 10000;
}

function same(a: Record<string, string>, b: Record<string, string>) {
	return a.transform === b.transform && a.opacity === b.opacity;
}

/**
 * Estira o encoge los números de un transform: las distancias y los giros se
 * multiplican, y las escalas se alejan o se acercan a 1.
 */
function scaleTransform(value: string, factor: number) {
	if (factor === 1) return value;
	return value.replace(/(translate[XY]?|rotate|scale)\(([^)]*)\)/g, (_, fn: string, args: string) => {
		const scaled = args.split(',').map((arg) => {
			const match = arg.trim().match(/^(-?\d*\.?\d+)([a-z%]*)$/);
			if (!match) return arg.trim();
			const number = Number(match[1]);
			const next = fn === 'scale' ? Math.max(0, 1 + (number - 1) * factor) : number * factor;
			return `${Number(next.toFixed(2))}${match[2]}`;
		});
		return `${fn}(${scaled.join(', ')})`;
	});
}

function stepFrames(step: Step): Frame[] {
	if (step.effect === 'pause') {
		return [
			{ offset: 0, props: {} },
			{ offset: 1, props: {} },
		];
	}
	const factor = step.intensity / 100;
	return framesOf(step.effect, step.side).map((frame) => {
		const props = { ...frame.props };
		if (props.transform) props.transform = scaleTransform(props.transform, factor);
		return { offset: frame.offset, props };
	});
}

/** Los fotogramas de todos los pasos, colocados en su trozo de la línea de tiempo. */
export function sequenceFrames(options: SequenceOptions): StepFrame[] {
	const total = totalDuration(options) || 1;
	const frames: StepFrame[] = [];
	let start = 0;
	for (const step of options.steps) {
		const easing = step.timing || undefined;
		stepFrames(step).forEach((frame, index) => {
			const props = { ...REST, ...frame.props };
			let offset = round((start + frame.offset * step.duration) / total);
			const last = frames.at(-1);
			if (index === 0 && last) {
				// El paso empieza donde acabó el anterior: si todo sigue igual sobra el
				// fotograma —y el tramo que sigue ya va con la curva de este paso—, y si
				// no, va un pelo después para que el salto se vea.
				if (same(last.props, props)) {
					last.easing = easing;
					return;
				}
				offset = Math.max(offset, round(last.offset + GAP));
			}
			frames.push({ offset: Math.min(offset, 1), props, easing });
		});
		start += step.duration;
	}
	return frames;
}

function percent(offset: number) {
	return `${Number((offset * 100).toFixed(2))}%`;
}

function ms(value: number) {
	return value % 1000 === 0 ? `${value / 1000}s` : `${value}ms`;
}

export function stepLabel(step: Step) {
	const effect = STEP_EFFECTS.find((item) => item.id === step.effect) ?? STEP_EFFECTS[0];
	let label = effect.name;
	if (step.effect === 'slide') {
		const side = SIDES.find((item) => item.id === step.side) ?? SIDES[0];
		label = `${label} desde ${side.label.toLowerCase()}`;
	}
	if (hasIntensity(step.effect) && step.intensity !== 100) label = `${label} al ${step.intensity}%`;
	if (step.timing && step.effect !== 'pause') {
		label = `${label}, ${TIMINGS.find((item) => item.id === step.timing)?.label ?? step.timing}`;
	}
	return label;
}

/** El CSS entero: un comentario con los pasos, los @keyframes y la regla. */
export function sequenceCss(options: SequenceOptions) {
	const groups = new Map<string, number[]>();
	for (const frame of sequenceFrames(options)) {
		const props = frame.easing ? { ...frame.props, 'animation-timing-function': frame.easing } : frame.props;
		const body = Object.entries(props)
			.map(([key, value]) => `${key}: ${value};`)
			.join(' ');
		groups.set(body, [...(groups.get(body) ?? []), frame.offset]);
	}
	const keyframes = [...groups.entries()]
		.sort(([, a], [, b]) => a[0] - b[0])
		.map(([body, offsets]) => `  ${offsets.map(percent).join(', ')} { ${body} }`);
	const steps = options.steps.map((step, index) => `${index + 1}. ${stepLabel(step)} (${ms(step.duration)})`);
	const iterations = options.loop ? 'infinite' : '1';
	return [
		`/* ${steps.join(' · ')} */`,
		'@keyframes secuencia {',
		...keyframes,
		'}',
		'',
		`.${options.selector || DEFAULT_SEQUENCE.selector} {`,
		`  animation: secuencia ${ms(totalDuration(options))} ${options.timing} ${iterations} both;`,
		'}',
		'',
	].join('\n');
}

/**
 * Para element.animate(): la curva va en cada fotograma, que es como la aplica
 * el CSS (tramo a tramo) y no sobre la animación entera.
 */
export function sequenceWebFrames(options: SequenceOptions): Keyframe[] {
	return sequenceFrames(options).map((frame) => ({
		offset: frame.offset,
		easing: frame.easing ?? options.timing,
		...frame.props,
	}));
}

export function sequenceWebTiming(options: SequenceOptions): KeyframeAnimationOptions {
	return {
		duration: totalDuration(options),
		iterations: options.loop ? Infinity : 1,
		fill: 'both',
	};
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
	const number = Number(value);
	if (!Number.isFinite(number)) return fallback;
	return Math.min(max, Math.max(min, Math.round(number)));
}

function pick<T extends string>(value: unknown, items: readonly { id: T }[], fallback: T): T {
	return items.find((item) => item.id === value)?.id ?? fallback;
}

export function toStep(data: unknown): Step {
	const raw = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
	return {
		effect: pick(raw.effect, STEP_EFFECTS, 'fade'),
		side: pick(raw.side, SIDES, 'left'),
		duration: clamp(raw.duration, DURATION.min, DURATION.max, 600),
		timing: pick(raw.timing, TIMINGS, ''),
		intensity: clamp(raw.intensity, INTENSITY.min, INTENSITY.max, 100),
	};
}

/** Lo que llegue —del localStorage o de los mandos— pasado por los topes. */
export function toSequence(data: Partial<Record<keyof SequenceOptions, unknown>>): SequenceOptions {
	const steps = Array.isArray(data.steps) ? data.steps.slice(0, STEPS_MAX).map(toStep) : [];
	return {
		steps: steps.length ? steps : DEFAULT_SEQUENCE.steps.map((step) => ({ ...step })),
		timing: pick(data.timing, TIMINGS, DEFAULT_SEQUENCE.timing),
		loop: typeof data.loop === 'boolean' ? data.loop : DEFAULT_SEQUENCE.loop,
		selector: cleanSelector(typeof data.selector === 'string' ? data.selector : '') || DEFAULT_SEQUENCE.selector,
	};
}

export function loadSequence(): SequenceOptions {
	try {
		const raw = localStorage.getItem(KEY);
		return toSequence(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
	} catch {
		return toSequence({});
	}
}

export function saveSequence(options: SequenceOptions) {
	try {
		localStorage.setItem(KEY, JSON.stringify(options));
		return true;
	} catch {
		return false;
	}
}
