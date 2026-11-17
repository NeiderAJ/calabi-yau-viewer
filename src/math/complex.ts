/** Número complejo inmutable y operaciones necesarias para la parametrización. */
export interface Complex {
  readonly re: number;
  readonly im: number;
}

export const complex = (re: number, im = 0): Complex => ({ re, im });

export const add = (a: Complex, b: Complex): Complex =>
  complex(a.re + b.re, a.im + b.im);

export const subtract = (a: Complex, b: Complex): Complex =>
  complex(a.re - b.re, a.im - b.im);

export const multiply = (a: Complex, b: Complex): Complex =>
  complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);

export const conjugate = (z: Complex): Complex => complex(z.re, -z.im);

export const magnitudeSquared = (z: Complex): number => z.re * z.re + z.im * z.im;

export const magnitude = (z: Complex): number => Math.hypot(z.re, z.im);

export const argument = (z: Complex): number => Math.atan2(z.im, z.re);

export const fromPolar = (radius: number, angle: number): Complex =>
  complex(radius * Math.cos(angle), radius * Math.sin(angle));

export function powInt(z: Complex, exponent: number): Complex {
  if (!Number.isInteger(exponent) || exponent < 0) {
    throw new RangeError('powInt requiere un exponente entero no negativo.');
  }

  let result = complex(1);
  let base = z;
  let power = exponent;
  while (power > 0) {
    if (power % 2 === 1) result = multiply(result, base);
    base = multiply(base, base);
    power = Math.floor(power / 2);
  }
  return result;
}

/**
 * Devuelve las n raíces en orden angular. Para z = 0 todas coinciden en 0,
 * que es precisamente el comportamiento en un punto de ramificación.
 */
export function nthRoots(z: Complex, degree: number): Complex[] {
  if (!Number.isInteger(degree) || degree <= 0) {
    throw new RangeError('El grado de la raíz debe ser un entero positivo.');
  }

  if (magnitudeSquared(z) === 0) {
    return Array.from({ length: degree }, () => complex(0));
  }

  const rootRadius = magnitude(z) ** (1 / degree);
  const baseAngle = argument(z) / degree;
  return Array.from({ length: degree }, (_, branch) =>
    fromPolar(rootRadius, baseAngle + (2 * Math.PI * branch) / degree),
  );
}

export const distanceSquared = (a: Complex, b: Complex): number => {
  const re = a.re - b.re;
  const im = a.im - b.im;
  return re * re + im * im;
};

export const isFiniteComplex = (z: Complex): boolean =>
  Number.isFinite(z.re) && Number.isFinite(z.im);
