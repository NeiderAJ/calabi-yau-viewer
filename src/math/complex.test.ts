import { describe, expect, it } from 'vitest';
import { complex, magnitude, nthRoots, powInt, subtract } from './complex';

describe('aritmética compleja', () => {
  it('calcula potencias enteras sin perder la parte imaginaria', () => {
    const value = powInt(complex(1, 1), 5);
    expect(value.re).toBeCloseTo(-4, 12);
    expect(value.im).toBeCloseTo(-4, 12);
  });

  it('devuelve las cinco raíces complejas correctas', () => {
    const value = complex(-2.3, 1.7);
    const roots = nthRoots(value, 5);
    expect(roots).toHaveLength(5);
    for (const root of roots) {
      expect(magnitude(subtract(powInt(root, 5), value))).toBeLessThan(1e-11);
    }
    const rounded = new Set(roots.map((root) => `${root.re.toFixed(9)},${root.im.toFixed(9)}`));
    expect(rounded.size).toBe(5);
  });

  it('trata z = 0 como una raíz múltiple en la ramificación', () => {
    const roots = nthRoots(complex(0), 5);
    expect(roots).toHaveLength(5);
    expect(roots.every((root) => root.re === 0 && root.im === 0)).toBe(true);
  });
});
