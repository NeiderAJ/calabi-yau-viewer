import * as THREE from 'three';
import { distanceSquared, type Complex } from '../math/complex';
import {
  branchAngles,
  fermatResidualMagnitude,
  sampleFermatCurve,
  type FermatSample,
} from '../math/fermat';
import { getProjection, type Point3, type ProjectionId } from './projections';

export interface FermatMeshOptions {
  readonly resolution: number;
  readonly radiusMax: number;
  readonly angularCoverage: number;
  readonly projection: ProjectionId;
}

export interface MeshStatistics {
  readonly vertices: number;
  readonly triangles: number;
  readonly omittedBranchCells: number;
  readonly omittedDiscontinuousTriangles: number;
  readonly omittedDegenerateTriangles: number;
  readonly omittedNonFiniteTriangles: number;
  readonly maxEquationResidual: number;
  readonly displayScale: number;
}

export interface FermatMeshResult {
  readonly geometry: THREE.BufferGeometry;
  readonly statistics: MeshStatistics;
}

interface RootedPoint {
  readonly x: Complex;
  readonly y: Complex;
  readonly projected: Point3;
}

const RADIUS_MIN = 0.06;
const ROOT_COUNT = 5;
const TARGET_DISPLAY_RADIUS = 3.2;

function containsBranchPoint(
  radius0: number,
  radius1: number,
  theta0: number,
  theta1: number,
): boolean {
  if (radius0 > 1 || radius1 < 1) return false;
  return branchAngles().some((angle) => angle >= theta0 && angle <= theta1);
}

function closestDistanceSquared(root: Complex, candidates: readonly Complex[]): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    minimum = Math.min(minimum, distanceSquared(root, candidate));
  }
  return minimum;
}

function isNearestContinuation(
  first: Complex,
  second: Complex,
  secondRoots: readonly Complex[],
): boolean {
  const chosen = distanceSquared(first, second);
  const minimum = closestDistanceSquared(first, secondRoots);
  return chosen <= minimum * (1 + 1e-8) + 1e-12;
}

/**
 * Etiqueta una hoja solo dentro de un triángulo. Las etiquetas globales de la
 * raíz principal no son continuas; por eso se eligen las raíces que son
 * continuaciones más cercanas a lo largo de las tres aristas.
 */
function matchTriangleRoots(
  first: FermatSample,
  second: FermatSample,
  third: FermatSample,
  sheet: number,
): readonly [Complex, Complex, Complex] | null {
  const firstRoot = first.roots[sheet];
  if (!firstRoot) return null;

  let best: readonly [Complex, Complex, Complex] | null = null;
  let bestCost = Number.POSITIVE_INFINITY;

  for (const secondRoot of second.roots) {
    if (!isNearestContinuation(firstRoot, secondRoot, second.roots)) continue;

    for (const thirdRoot of third.roots) {
      if (!isNearestContinuation(firstRoot, thirdRoot, third.roots)) continue;
      if (!isNearestContinuation(secondRoot, thirdRoot, third.roots)) continue;
      if (!isNearestContinuation(thirdRoot, secondRoot, second.roots)) continue;

      const cost =
        distanceSquared(firstRoot, secondRoot) +
        distanceSquared(secondRoot, thirdRoot) +
        distanceSquared(thirdRoot, firstRoot);
      if (cost < bestCost) {
        bestCost = cost;
        best = [firstRoot, secondRoot, thirdRoot];
      }
    }
  }

  return best;
}

function triangleAreaSquared(a: Point3, b: Point3, c: Point3): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;
  const acx = c.x - a.x;
  const acy = c.y - a.y;
  const acz = c.z - a.z;
  const crossX = aby * acz - abz * acy;
  const crossY = abz * acx - abx * acz;
  const crossZ = abx * acy - aby * acx;
  return crossX * crossX + crossY * crossY + crossZ * crossZ;
}

function allFinite(points: readonly Point3[]): boolean {
  return points.every(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z),
  );
}

function normalizePositions(positions: number[]): number {
  if (positions.length === 0) return 1;

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < positions.length; index += 3) {
    const x = positions[index] ?? 0;
    const y = positions[index + 1] ?? 0;
    const z = positions[index + 2] ?? 0;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;
  let maximumRadius = 0;

  for (let index = 0; index < positions.length; index += 3) {
    const x = (positions[index] ?? 0) - centerX;
    const y = (positions[index + 1] ?? 0) - centerY;
    const z = (positions[index + 2] ?? 0) - centerZ;
    maximumRadius = Math.max(maximumRadius, Math.hypot(x, y, z));
  }

  const scale = maximumRadius > 0 ? TARGET_DISPLAY_RADIUS / maximumRadius : 1;
  for (let index = 0; index < positions.length; index += 3) {
    positions[index] = ((positions[index] ?? 0) - centerX) * scale;
    positions[index + 1] = ((positions[index + 1] ?? 0) - centerY) * scale;
    positions[index + 2] = ((positions[index + 2] ?? 0) - centerZ) * scale;
  }
  return scale;
}

export function generateFermatMesh(options: FermatMeshOptions): FermatMeshResult {
  const resolution = Math.max(12, Math.round(options.resolution));
  const radiusMax = Math.max(RADIUS_MIN + 0.1, options.radiusMax);
  const angularCoverage = THREE.MathUtils.clamp(options.angularCoverage, 0.1, 1);
  const thetaLimit = Math.PI * 2 * angularCoverage;
  const radialSegments = resolution;
  const angularSegments = Math.max(10, Math.round(resolution * 2 * angularCoverage));
  const projection = getProjection(options.projection);

  const radii = Array.from(
    { length: radialSegments + 1 },
    (_, index) => RADIUS_MIN + ((radiusMax - RADIUS_MIN) * index) / radialSegments,
  );
  const angles = Array.from(
    { length: angularSegments + 1 },
    (_, index) => (thetaLimit * index) / angularSegments,
  );

  let maxEquationResidual = 0;
  const samples: FermatSample[][] = radii.map((radius) =>
    angles.map((theta) => {
      const sample = sampleFermatCurve(radius, theta);
      for (const root of sample.roots) {
        maxEquationResidual = Math.max(
          maxEquationResidual,
          fermatResidualMagnitude(sample.x, root),
        );
      }
      return sample;
    }),
  );

  const positions: number[] = [];
  let omittedBranchCells = 0;
  let omittedDiscontinuousTriangles = 0;
  let omittedDegenerateTriangles = 0;
  let omittedNonFiniteTriangles = 0;

  const appendBaseTriangle = (
    sampleA: FermatSample,
    sampleB: FermatSample,
    sampleC: FermatSample,
  ): void => {
    for (let sheet = 0; sheet < ROOT_COUNT; sheet += 1) {
      const roots = matchTriangleRoots(sampleA, sampleB, sampleC, sheet);
      if (!roots) {
        omittedDiscontinuousTriangles += 1;
        continue;
      }

      const rootedPoints: readonly RootedPoint[] = [
        { x: sampleA.x, y: roots[0], projected: projection.project(sampleA.x, roots[0]) },
        { x: sampleB.x, y: roots[1], projected: projection.project(sampleB.x, roots[1]) },
        { x: sampleC.x, y: roots[2], projected: projection.project(sampleC.x, roots[2]) },
      ];
      const projected = rootedPoints.map((point) => point.projected);

      if (!allFinite(projected)) {
        omittedNonFiniteTriangles += 1;
        continue;
      }
      const first = projected[0];
      const second = projected[1];
      const third = projected[2];
      if (!first || !second || !third || triangleAreaSquared(first, second, third) < 1e-18) {
        omittedDegenerateTriangles += 1;
        continue;
      }

      positions.push(
        first.x,
        first.y,
        first.z,
        second.x,
        second.y,
        second.z,
        third.x,
        third.y,
        third.z,
      );
    }
  };

  for (let radialIndex = 0; radialIndex < radialSegments; radialIndex += 1) {
    const radius0 = radii[radialIndex];
    const radius1 = radii[radialIndex + 1];
    if (radius0 === undefined || radius1 === undefined) continue;

    for (let angularIndex = 0; angularIndex < angularSegments; angularIndex += 1) {
      const theta0 = angles[angularIndex];
      const theta1 = angles[angularIndex + 1];
      if (theta0 === undefined || theta1 === undefined) continue;

      if (containsBranchPoint(radius0, radius1, theta0, theta1)) {
        omittedBranchCells += 1;
        continue;
      }

      const row0 = samples[radialIndex];
      const row1 = samples[radialIndex + 1];
      const a = row0?.[angularIndex];
      const b = row1?.[angularIndex];
      const c = row1?.[angularIndex + 1];
      const d = row0?.[angularIndex + 1];
      if (!a || !b || !c || !d) continue;

      appendBaseTriangle(a, b, c);
      appendBaseTriangle(a, c, d);
    }
  }

  const displayScale = normalizePositions(positions);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return {
    geometry,
    statistics: {
      vertices: positions.length / 3,
      triangles: positions.length / 9,
      omittedBranchCells,
      omittedDiscontinuousTriangles,
      omittedDegenerateTriangles,
      omittedNonFiniteTriangles,
      maxEquationResidual,
      displayScale,
    },
  };
}

export function geometryHasOnlyFiniteValues(geometry: THREE.BufferGeometry): boolean {
  const position = geometry.getAttribute('position');
  if (!position) return false;
  for (let index = 0; index < position.count; index += 1) {
    if (
      !Number.isFinite(position.getX(index)) ||
      !Number.isFinite(position.getY(index)) ||
      !Number.isFinite(position.getZ(index))
    ) {
      return false;
    }
  }
  return true;
}
