import 'katex/dist/katex.min.css';
import './style.css';
import { exportCanvasAsPng, exportGeometryAsObj } from './export/exporters';
import {
  generateFermatMesh,
  geometryHasOnlyFiniteValues,
  type FermatMeshOptions,
} from './geometry/fermatMesh';
import { SceneController } from './rendering/SceneController';
import {
  ControlPanel,
  INITIAL_GEOMETRY_SETTINGS,
  INITIAL_MATERIAL_SETTINGS,
} from './ui/ControlPanel';
import { createAppLayout } from './ui/layout';
import { renderStaticMathematics, updateProjectionNote } from './ui/mathPanel';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('No se encontró el contenedor principal de la aplicación.');

const elements = createAppLayout(root);
renderStaticMathematics(elements.mathPanel);
const scene = new SceneController(elements.viewport);
scene.setMaterialSettings(INITIAL_MATERIAL_SETTINGS);
scene.resetCamera();

let generationSerial = 0;

function setLoading(message: string): void {
  const text = elements.status.querySelector('span');
  if (text) text.textContent = message;
  elements.status.classList.remove('is-hidden', 'is-error');
}

function setError(message: string): void {
  const text = elements.status.querySelector('span');
  if (text) text.textContent = message;
  elements.status.classList.add('is-error');
  elements.status.classList.remove('is-hidden');
}

function hideLoading(): void {
  elements.status.classList.add('is-hidden');
}

function rebuildGeometry(settings: FermatMeshOptions): void {
  const serial = ++generationSerial;
  updateProjectionNote(
    settings.projection,
    elements.projectionDescription,
    elements.projectionFormula,
  );
  setLoading('Calculando las cinco hojas complejas…');

  window.setTimeout(() => {
    if (serial !== generationSerial) return;
    try {
      const result = generateFermatMesh(settings);
      if (!geometryHasOnlyFiniteValues(result.geometry)) {
        result.geometry.dispose();
        throw new Error('La geometría contiene valores no finitos.');
      }
      if (serial !== generationSerial) {
        result.geometry.dispose();
        return;
      }

      scene.setGeometry(result.geometry);
      const stats = result.statistics;
      elements.stats.innerHTML = `
        <strong>${stats.triangles.toLocaleString('es-CO')}</strong> triángulos
        <i></i>
        residual máx. <strong>${stats.maxEquationResidual.toExponential(1)}</strong>
        <i></i>
        ${stats.omittedBranchCells} celdas de ramificación omitidas
      `;
      hideLoading();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido al generar la malla.';
      setError(message);
      console.error(error);
    }
  }, 20);
}

new ControlPanel(elements.controlsPanel, {
  onGeometryChange: rebuildGeometry,
  onMaterialChange: (settings) => scene.setMaterialSettings(settings),
  onAutoRotateChange: (enabled) => scene.setAutoRotate(enabled),
  onRotationSpeedChange: (speed) => scene.setRotationSpeed(speed),
  onAxesChange: (visible) => scene.setAxesVisible(visible),
  onResetCamera: () => scene.resetCamera(),
});

elements.pngButton.addEventListener('click', async () => {
  try {
    scene.render();
    await exportCanvasAsPng(scene.getCanvas());
  } catch (error) {
    setError(error instanceof Error ? error.message : 'No fue posible exportar el PNG.');
  }
});

elements.objButton.addEventListener('click', () => {
  try {
    exportGeometryAsObj(scene.getGeometry());
  } catch (error) {
    setError(error instanceof Error ? error.message : 'No fue posible exportar el OBJ.');
  }
});

elements.fullscreenButton.addEventListener('click', async () => {
  const fullscreenTarget = elements.viewport.closest<HTMLElement>('.viewport-card');
  if (!fullscreenTarget) return;
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await fullscreenTarget.requestFullscreen();
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Pantalla completa no disponible.');
  }
});

window.addEventListener('beforeunload', () => scene.dispose(), { once: true });
rebuildGeometry(INITIAL_GEOMETRY_SETTINGS);
