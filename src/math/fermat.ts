import {
  add,
  complex,
  fromPolar,
  magnitude,
  nthRoots,
  powInt,
  type Complex,
} from './complex';

export const FERMAT_DEGREE = 5;

export interface FermatSample {
  readonly x: Complex;
  readonly w: Complex;
  readonly roots: readonly Complex[];
}

/** Construye x = r exp(i theta), w = -1 - x^5 e y^5 = w. */
export function sampleFermatCurve(radius: number, theta: number): FermatSample {
  const x = fromPolar(radius, theta);
  const xFifth = powInt(x, FERMAT_DEGREE);
  const w = complex(-1 - xFifth.re, -xFifth.im);
  return { x, w, roots: nthRoots(w, FERMAT_DEGREE) };
}

/** Evalúa F(x,y) = x^5 + y^5 + 1. */
export function fermatResidual(x: Complex, y: Complex): Complex {
  return add(add(powInt(x, FERMAT_DEGREE), powInt(y, FERMAT_DEGREE)), complex(1));
}

export function fermatResidualMagnitude(x: Complex, y: Complex): number {
  return magnitude(fermatResidual(x, y));
}

/** Los cinco puntos x^5 = -1 donde la proyección (x,y) -> x se ramifica. */
export function branchPointsX(): Complex[] {
  return Array.from({ length: FERMAT_DEGREE }, (_, index) =>
    fromPolar(1, (Math.PI + 2 * Math.PI * index) / FERMAT_DEGREE),
  );
}

export function branchAngles(): number[] {
  return Array.from(
    { length: FERMAT_DEGREE },
    (_, index) => (Math.PI + 2 * Math.PI * index) / FERMAT_DEGREE,
  );
}
