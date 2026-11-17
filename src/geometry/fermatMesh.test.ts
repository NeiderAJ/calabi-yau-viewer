import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { generateFermatMesh, geometryHasOnlyFiniteValues } from './fermatMesh';
import type { ProjectionId } from './projections';

function triangleAreaSquared(position: THREE.BufferAttribute, index: number): number {
  const a = new THREE.Vector3().fromBufferAttribute(position, index);
  const b = new THREE.Vector3().fromBufferAttribute(position, index + 1);
  const c = new THREE.Vector3().fromBufferAttribute(position, index + 2);
  return b.sub(a).cross(c.sub(a)).lengthSq();
}

describe('malla de la sección de Fermat', () => {
  const projections: ProjectionId[] = ['orthographic', 'balanced', 'hopf'];

  for (const projection of projections) {
    it(`produce buffers finitos y triángulos no degenerados con ${projection}`, () => {
      const result = generateFermatMesh({
        resolution: 18,
        radiusMax: 1.4,
        angularCoverage: 1,
        projection,
      });
      const position = result.geometry.getAttribute('position') as THREE.BufferAttribute;

      expect(position.count).toBeGreaterThan(1_000);
      expect(position.count % 3).toBe(0);
      expect(geometryHasOnlyFiniteValues(result.geometry)).toBe(true);
      expect(result.statistics.omittedBranchCells).toBeGreaterThanOrEqual(5);
      expect(result.statistics.maxEquationResidual).toBeLessThan(1e-9);
      for (let index = 0; index < position.count; index += 3) {
        expect(triangleAreaSquared(position, index)).toBeGreaterThan(1e-14);
      }

      result.geometry.dispose();
    });
  }
});
