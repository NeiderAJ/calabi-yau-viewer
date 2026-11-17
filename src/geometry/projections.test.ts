import { describe, expect, it } from 'vitest';
import { complex } from '../math/complex';
import { PROJECTIONS } from './projections';

describe('proyecciones R4 a R3', () => {
  it('implementa literalmente la proyección de coordenadas', () => {
    expect(PROJECTIONS.orthographic.project(complex(1, 2), complex(3, 4))).toEqual({
      x: 1,
      y: 2,
      z: 3,
    });
  });

  it('implementa el mapa de Hopf con la convención documentada', () => {
    const result = PROJECTIONS.hopf.project(complex(1, 2), complex(3, 4));
    expect(result.x).toBe(22);
    expect(result.y).toBe(4);
    expect(result.z).toBe(-20);
  });

  it('usa tres filas ortonormales en la proyección equilibrada', () => {
    const basis = [
      PROJECTIONS.balanced.project(complex(1, 0), complex(0, 0)),
      PROJECTIONS.balanced.project(complex(0, 1), complex(0, 0)),
      PROJECTIONS.balanced.project(complex(0, 0), complex(1, 0)),
      PROJECTIONS.balanced.project(complex(0, 0), complex(0, 1)),
    ];
    const rows = [
      basis.map((point) => point.x),
      basis.map((point) => point.y),
      basis.map((point) => point.z),
    ];
    for (let i = 0; i < rows.length; i += 1) {
      for (let j = 0; j < rows.length; j += 1) {
        const dot = (rows[i] ?? []).reduce(
          (sum, value, component) => sum + value * ((rows[j] ?? [])[component] ?? 0),
          0,
        );
        expect(dot).toBeCloseTo(i === j ? 1 : 0, 12);
      }
    }
  });
});
