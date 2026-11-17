import { describe, expect, it } from 'vitest';
import { magnitude, powInt } from './complex';
import {
  branchPointsX,
  fermatResidualMagnitude,
  sampleFermatCurve,
} from './fermat';

describe('curva de Fermat', () => {
  it('genera cinco puntos que satisfacen x^5 + y^5 + 1 = 0', () => {
    const parameters = [
      [0.15, 0.1],
      [0.82, 2.4],
      [1.35, 5.7],
      [2.1, 3.2],
    ] as const;

    for (const [radius, theta] of parameters) {
      const sample = sampleFermatCurve(radius, theta);
      expect(sample.roots).toHaveLength(5);
      for (const root of sample.roots) {
        expect(fermatResidualMagnitude(sample.x, root)).toBeLessThan(1e-10);
      }
    }
  });

  it('localiza los cinco puntos de ramificación x^5 = -1', () => {
    const points = branchPointsX();
    expect(points).toHaveLength(5);
    for (const point of points) {
      const fifth = powInt(point, 5);
      expect(magnitude({ re: fifth.re + 1, im: fifth.im })).toBeLessThan(1e-12);
      const sample = sampleFermatCurve(1, Math.atan2(point.im, point.re));
      expect(magnitude(sample.w)).toBeLessThan(1e-12);
      expect(sample.roots.every((root) => magnitude(root) < 1e-3)).toBe(true);
    }
  });
});
