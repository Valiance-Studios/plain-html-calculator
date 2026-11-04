export type AngleUnit = 'deg' | 'rad';

export type ScientificFunction
  = | 'sin' | 'cos' | 'tan'
    | 'asin' | 'acos' | 'atan'
    | 'ln' | 'log'
    | 'sqrt' | 'cbrt' | 'square';

export type ScientificConstant = 'pi' | 'e';

const toRadians = (angle: number, unit: AngleUnit): number => unit === 'deg' ? angle * Math.PI / 180 : angle;
const fromRadians = (angle: number, unit: AngleUnit): number => unit === 'deg' ? angle * 180 / Math.PI : angle;

/** Floating point leaves sin(180°) at 1.2e-16 rather than 0, and tan(90°) huge rather than undefined. */
const snapToZero = (value: number): number => Math.abs(value) < 1e-12 ? 0 : value;

const sine = (angle: number, unit: AngleUnit): number => snapToZero(Math.sin(toRadians(angle, unit)));
const cosine = (angle: number, unit: AngleUnit): number => snapToZero(Math.cos(toRadians(angle, unit)));

/** Results may be non-finite where a function is undefined, such as √-1 or ln 0. */
export const SCIENTIFIC_FUNCTIONS: Record<ScientificFunction, (value: number, unit: AngleUnit) => number> = {
  sin: sine,
  cos: cosine,
  tan: (value, unit) => sine(value, unit) / cosine(value, unit),
  asin: (value, unit) => fromRadians(Math.asin(value), unit),
  acos: (value, unit) => fromRadians(Math.acos(value), unit),
  atan: (value, unit) => fromRadians(Math.atan(value), unit),
  ln: (value) => Math.log(value),
  log: (value) => Math.log10(value),
  sqrt: (value) => Math.sqrt(value),
  cbrt: (value) => Math.cbrt(value),
  square: (value) => value * value,
};

export const SCIENTIFIC_CONSTANTS: Record<ScientificConstant, number> = {
  pi: Math.PI,
  e: Math.E,
};
