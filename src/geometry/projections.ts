import type { Complex } from '../math/complex';

export type ProjectionId = 'orthographic' | 'balanced' | 'hopf';

export interface Point3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface ProjectionDefinition {
  readonly id: ProjectionId;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly formula: string;
  readonly project: (x: Complex, y: Complex) => Point3;
}

const INV_SQRT_TWO = 1 / Math.sqrt(2);

export const PROJECTIONS: Record<ProjectionId, ProjectionDefinition> = {
  orthographic: {
    id: 'orthographic',
    label: 'Coordenadas (Re x, Im x, Re y)',
    shortLabel: 'Coordenadas',
    description:
      'Proyección lineal que conserva el plano complejo de x y descarta Im(y).',
    formula: String.raw`P_{\mathrm{coord}}(a,b,c,d)=(a,b,c)`,
    project: (x, y) => ({ x: x.re, y: x.im, z: y.re }),
  },
  balanced: {
    id: 'balanced',
    label: 'Oblicua ortonormal equilibrada',
    shortLabel: 'Oblicua',
    description:
      'Proyección lineal sobre tres vectores ortonormales de R⁴; mezcla por igual las coordenadas de x e y.',
    formula: String.raw`P_{\mathrm{obl}}(a,b,c,d)=\left(\frac{a-c}{\sqrt2},\frac{b-d}{\sqrt2},\frac{a+b+c+d}{2}\right)`,
    project: (x, y) => ({
      x: (x.re - y.re) * INV_SQRT_TWO,
      y: (x.im - y.im) * INV_SQRT_TWO,
      z: (x.re + x.im + y.re + y.im) / 2,
    }),
  },
  hopf: {
    id: 'hopf',
    label: 'Mapa de Hopf (no lineal)',
    shortLabel: 'Hopf',
    description:
      'Mapa cuadrático C² → R³. No es una proyección lineal y realza las relaciones de fase entre x e y.',
    formula: String.raw`H(x,y)=\left(2\operatorname{Re}(x\bar y),2\operatorname{Im}(x\bar y),|x|^2-|y|^2\right)`,
    project: (x, y) => ({
      x: 2 * (x.re * y.re + x.im * y.im),
      y: 2 * (x.im * y.re - x.re * y.im),
      z: x.re * x.re + x.im * x.im - y.re * y.re - y.im * y.im,
    }),
  },
};

export function getProjection(id: ProjectionId): ProjectionDefinition {
  return PROJECTIONS[id];
}
