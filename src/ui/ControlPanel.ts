import type { FermatMeshOptions } from '../geometry/fermatMesh';
import { PROJECTIONS, type ProjectionId } from '../geometry/projections';
import type { MaterialSettings, RenderMode } from '../rendering/SceneController';

export interface ControlCallbacks {
  readonly onGeometryChange: (settings: FermatMeshOptions) => void;
  readonly onMaterialChange: (settings: MaterialSettings) => void;
  readonly onAutoRotateChange: (enabled: boolean) => void;
  readonly onRotationSpeedChange: (speed: number) => void;
  readonly onAxesChange: (visible: boolean) => void;
  readonly onResetCamera: () => void;
}

export const INITIAL_GEOMETRY_SETTINGS: FermatMeshOptions = {
  resolution: 48,
  radiusMax: 1.72,
  angularCoverage: 1,
  projection: 'balanced',
};

export const INITIAL_MATERIAL_SETTINGS: MaterialSettings = {
  mode: 'combined',
  color: '#dce9f2',
  opacity: 0.72,
};

function inputElement(root: ParentNode, id: string): HTMLInputElement {
  const element = root.querySelector<HTMLInputElement>(`#${id}`);
  if (!element) throw new Error(`Control no encontrado: ${id}`);
  return element;
}

function selectElement(root: ParentNode, id: string): HTMLSelectElement {
  const element = root.querySelector<HTMLSelectElement>(`#${id}`);
  if (!element) throw new Error(`Control no encontrado: ${id}`);
  return element;
}

export class ControlPanel {
  private geometrySettings: FermatMeshOptions = { ...INITIAL_GEOMETRY_SETTINGS };
  private materialSettings: MaterialSettings = { ...INITIAL_MATERIAL_SETTINGS };
  private geometryTimer: number | undefined;

  constructor(
    private readonly root: HTMLElement,
    private readonly callbacks: ControlCallbacks,
  ) {
    this.render();
    this.bindEvents();
  }

  private render(): void {
    const projectionOptions = Object.values(PROJECTIONS)
      .map(
        (projection) =>
          `<option value="${projection.id}" ${projection.id === this.geometrySettings.projection ? 'selected' : ''}>${projection.label}</option>`,
      )
      .join('');

    this.root.innerHTML = `
      <div class="panel-heading">
        <p class="eyebrow">INSTRUMENTOS</p>
        <h2>Exploración</h2>
      </div>

      <section class="control-group">
        <div class="control-group__heading">
          <h3>Vista y material</h3>
          <span class="control-tag">Instantáneo</span>
        </div>

        <label class="control-row control-row--select">
          <span>Representación</span>
          <select id="render-mode">
            <option value="wireframe">Alámbrica</option>
            <option value="surface">Superficie</option>
            <option value="combined" selected>Combinada</option>
          </select>
        </label>

        <label class="control-row control-row--color">
          <span>Color de la malla</span>
          <span class="color-control"><input id="mesh-color" type="color" value="${this.materialSettings.color}" /><code id="color-value">${this.materialSettings.color.toUpperCase()}</code></span>
        </label>

        <label class="range-control">
          <span><span>Opacidad</span><output id="opacity-value">72%</output></span>
          <input id="opacity" type="range" min="0.08" max="1" step="0.01" value="${this.materialSettings.opacity}" />
        </label>

        <label class="toggle-control">
          <span><strong>Rotación automática</strong><small>La cámara sigue siendo libre</small></span>
          <input id="auto-rotate" type="checkbox" checked /><i aria-hidden="true"></i>
        </label>

        <label class="range-control">
          <span><span>Velocidad</span><output id="speed-value">0.16 rad/s</output></span>
          <input id="rotation-speed" type="range" min="0" max="0.8" step="0.01" value="0.16" />
        </label>

        <label class="toggle-control">
          <span><strong>Ejes de coordenadas</strong><small>Referencia tridimensional</small></span>
          <input id="show-axes" type="checkbox" /><i aria-hidden="true"></i>
        </label>

        <button class="button button--wide" id="reset-camera" type="button">Restaurar cámara</button>
      </section>

      <section class="control-group control-group--geometry">
        <div class="control-group__heading">
          <h3>Geometría</h3>
          <span class="control-tag control-tag--warm">Recalcula</span>
        </div>

        <label class="control-row control-row--select control-row--stacked">
          <span>Proyección R⁴ → R³</span>
          <select id="projection">${projectionOptions}</select>
        </label>

        <label class="range-control">
          <span><span>Resolución</span><output id="resolution-value">${this.geometrySettings.resolution}</output></span>
          <input id="resolution" type="range" min="18" max="96" step="2" value="${this.geometrySettings.resolution}" />
        </label>

        <label class="range-control">
          <span><span>Radio máximo |x|</span><output id="radius-value">${this.geometrySettings.radiusMax.toFixed(2)}</output></span>
          <input id="radius-max" type="range" min="0.7" max="2.4" step="0.02" value="${this.geometrySettings.radiusMax}" />
        </label>

        <label class="range-control">
          <span><span>Dominio angular</span><output id="coverage-value">360°</output></span>
          <input id="angular-coverage" type="range" min="0.2" max="1" step="0.02" value="${this.geometrySettings.angularCoverage}" />
        </label>

        <p class="control-note">Los cambios de este bloque vuelven a muestrear y triangular las cinco hojas.</p>
      </section>

      <div class="panel-footnote">
        <span class="footnote-symbol">※</span>
        <p>La malla representa puntos calculados de <span>x⁵ + y⁵ + 1 = 0</span>; no es una superficie decorativa arbitraria.</p>
      </div>
    `;
  }

  private bindEvents(): void {
    const mode = selectElement(this.root, 'render-mode');
    const color = inputElement(this.root, 'mesh-color');
    const opacity = inputElement(this.root, 'opacity');
    const autoRotate = inputElement(this.root, 'auto-rotate');
    const rotationSpeed = inputElement(this.root, 'rotation-speed');
    const showAxes = inputElement(this.root, 'show-axes');
    const projection = selectElement(this.root, 'projection');
    const resolution = inputElement(this.root, 'resolution');
    const radiusMax = inputElement(this.root, 'radius-max');
    const coverage = inputElement(this.root, 'angular-coverage');

    const emitMaterial = (): void => this.callbacks.onMaterialChange(this.materialSettings);
    mode.addEventListener('change', () => {
      this.materialSettings = { ...this.materialSettings, mode: mode.value as RenderMode };
      emitMaterial();
    });
    color.addEventListener('input', () => {
      this.materialSettings = { ...this.materialSettings, color: color.value };
      const output = this.root.querySelector('#color-value');
      if (output) output.textContent = color.value.toUpperCase();
      emitMaterial();
    });
    opacity.addEventListener('input', () => {
      this.materialSettings = { ...this.materialSettings, opacity: Number(opacity.value) };
      const output = this.root.querySelector<HTMLOutputElement>('#opacity-value');
      if (output) output.value = `${Math.round(Number(opacity.value) * 100)}%`;
      emitMaterial();
    });
    autoRotate.addEventListener('change', () => this.callbacks.onAutoRotateChange(autoRotate.checked));
    rotationSpeed.addEventListener('input', () => {
      const speed = Number(rotationSpeed.value);
      const output = this.root.querySelector<HTMLOutputElement>('#speed-value');
      if (output) output.value = `${speed.toFixed(2)} rad/s`;
      this.callbacks.onRotationSpeedChange(speed);
    });
    showAxes.addEventListener('change', () => this.callbacks.onAxesChange(showAxes.checked));
    this.root.querySelector('#reset-camera')?.addEventListener('click', this.callbacks.onResetCamera);

    const updateGeometry = (): void => {
      this.geometrySettings = {
        resolution: Number(resolution.value),
        radiusMax: Number(radiusMax.value),
        angularCoverage: Number(coverage.value),
        projection: projection.value as ProjectionId,
      };
      const resolutionOutput = this.root.querySelector<HTMLOutputElement>('#resolution-value');
      const radiusOutput = this.root.querySelector<HTMLOutputElement>('#radius-value');
      const coverageOutput = this.root.querySelector<HTMLOutputElement>('#coverage-value');
      if (resolutionOutput) resolutionOutput.value = resolution.value;
      if (radiusOutput) radiusOutput.value = Number(radiusMax.value).toFixed(2);
      if (coverageOutput) coverageOutput.value = `${Math.round(Number(coverage.value) * 360)}°`;

      window.clearTimeout(this.geometryTimer);
      this.geometryTimer = window.setTimeout(
        () => this.callbacks.onGeometryChange(this.geometrySettings),
        120,
      );
    };

    projection.addEventListener('change', updateGeometry);
    resolution.addEventListener('input', updateGeometry);
    radiusMax.addEventListener('input', updateGeometry);
    coverage.addEventListener('input', updateGeometry);
  }
}
