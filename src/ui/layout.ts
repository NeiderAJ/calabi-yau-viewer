export interface AppElements {
  readonly viewport: HTMLElement;
  readonly controlsPanel: HTMLElement;
  readonly mathPanel: HTMLElement;
  readonly status: HTMLElement;
  readonly stats: HTMLElement;
  readonly projectionFormula: HTMLElement;
  readonly projectionDescription: HTMLElement;
  readonly pngButton: HTMLButtonElement;
  readonly objButton: HTMLButtonElement;
  readonly fullscreenButton: HTMLButtonElement;
}

function requiredElement<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`No se encontró el elemento requerido: ${selector}`);
  return element;
}

export function createAppLayout(root: HTMLElement): AppElements {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-block">
          <div class="brand-mark" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <div>
            <p class="eyebrow">GEOMETRÍA COMPLEJA · EXPERIMENTO 01</p>
            <h1>Calabi–Yau <i>Lab</i></h1>
          </div>
        </div>
        <div class="topbar-actions" aria-label="Exportación y pantalla">
          <button class="button button--quiet" id="export-png" type="button" title="Guardar el encuadre actual">
            <span aria-hidden="true">↓</span> PNG
          </button>
          <button class="button button--quiet" id="export-obj" type="button" title="Exportar la malla visible">
            <span aria-hidden="true">◇</span> OBJ
          </button>
          <button class="button button--icon" id="fullscreen" type="button" aria-label="Pantalla completa" title="Pantalla completa">⛶</button>
        </div>
      </header>

      <main class="workspace">
        <aside class="panel controls-panel" id="controls-panel" aria-label="Controles de visualización"></aside>

        <section class="viewport-card" aria-label="Escena tridimensional">
          <div class="viewport" id="viewport"></div>
          <div class="viewport-vignette" aria-hidden="true"></div>
          <div class="viewport-caption">
            <span class="live-dot" aria-hidden="true"></span>
            <span>SECCIÓN REAL 2D · PROYECCIÓN EN R³</span>
          </div>
          <div class="viewport-stats" id="mesh-stats" aria-live="polite">Preparando malla…</div>
          <div class="loading-state" id="loading-state" role="status">
            <div class="loader" aria-hidden="true"></div>
            <span>Calculando las cinco hojas complejas…</span>
          </div>
          <div class="interaction-hint" aria-hidden="true">
            <span>Arrastrar · rotar</span><span>Rueda/pinza · zoom</span>
          </div>
        </section>

        <aside class="panel math-panel" id="math-panel" aria-label="Fundamento matemático">
          <div class="panel-heading">
            <p class="eyebrow">NOTA DE LABORATORIO</p>
            <h2>Fundamento matemático</h2>
          </div>

          <div class="science-callout">
            <span class="science-callout__index">01</span>
            <p>Visualizamos una <strong>sección de dimensión real 2</strong>, no la variedad Calabi–Yau completa de dimensión real 6.</p>
          </div>

          <section class="science-section">
            <h3>La quíntica de Fermat</h3>
            <p>La hipersuperficie proyectiva suave</p>
            <div class="equation" data-katex="X=\\{[Z_0:\\cdots:Z_4]\\in\\mathbb{CP}^4\\mid\\sum_{j=0}^4 Z_j^5=0\\}"></div>
            <p>tiene dimensión compleja 3. Cada coordenada compleja aporta dos direcciones reales, por lo que su dimensión real es 6. Es una variedad Calabi–Yau: es Kähler y su fibrado canónico es trivial.</p>
          </section>

          <section class="science-section">
            <h3>La sección representada</h3>
            <p>Imponemos <span data-katex="Z_3=Z_4=0"></span> y usamos la carta <span data-katex="Z_2=1"></span>:</p>
            <div class="equation equation--large" data-katex="x^5+y^5+1=0"></div>
            <p>Su compactificación es la curva de Fermat de género 6. Sobre cada <span data-katex="x=re^{i\\theta}"></span> calculamos las cinco raíces</p>
            <div class="equation" data-katex="y_k=(-1-x^5)^{1/5}e^{2\\pi i k/5},\\quad k=0,\\ldots,4"></div>
          </section>

          <section class="science-section projection-note">
            <h3>Proyección activa</h3>
            <p id="projection-description"></p>
            <div class="equation" id="projection-formula"></div>
            <p class="microcopy">Después de proyectar, la malla se centra y escala uniformemente para mantener un encuadre comparable.</p>
          </section>

          <section class="science-section limits">
            <h3>Qué no muestra</h3>
            <ul>
              <li>La carta es un fragmento afín truncado; no incluye los puntos en el infinito.</li>
              <li>La proyección a R³ pierde información y puede crear solapamientos visuales.</li>
              <li>Se omiten celdas que contienen ramificación para no coser hojas falsas. La curva es suave en esos puntos.</li>
              <li>No calculamos una métrica Ricci-plana ni un modelo de compactificación física.</li>
              <li>La malla OBJ es abierta y no se garantiza que sea imprimible.</li>
            </ul>
          </section>
        </aside>
      </main>
    </div>
  `;

  return {
    viewport: requiredElement(root, '#viewport'),
    controlsPanel: requiredElement(root, '#controls-panel'),
    mathPanel: requiredElement(root, '#math-panel'),
    status: requiredElement(root, '#loading-state'),
    stats: requiredElement(root, '#mesh-stats'),
    projectionFormula: requiredElement(root, '#projection-formula'),
    projectionDescription: requiredElement(root, '#projection-description'),
    pngButton: requiredElement(root, '#export-png'),
    objButton: requiredElement(root, '#export-obj'),
    fullscreenButton: requiredElement(root, '#fullscreen'),
  };
}
