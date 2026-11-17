import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type RenderMode = 'wireframe' | 'surface' | 'combined';

export interface MaterialSettings {
  readonly mode: RenderMode;
  readonly color: string;
  readonly opacity: number;
}

export class SceneController {
  private readonly container: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
  private readonly controls: OrbitControls;
  private readonly objectRoot = new THREE.Group();
  private readonly surfaceMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xdce9f2,
    metalness: 0.56,
    roughness: 0.28,
    clearcoat: 0.75,
    clearcoatRoughness: 0.22,
    side: THREE.DoubleSide,
  });
  private readonly wireMaterial = new THREE.LineBasicMaterial({
    color: 0xf1f7ff,
    transparent: true,
    opacity: 0.72,
  });
  private readonly surfaceMesh: THREE.Mesh;
  private readonly wireMesh: THREE.LineSegments;
  private readonly axes = new THREE.AxesHelper(4.15);
  private readonly clock = new THREE.Clock();
  private readonly resizeObserver: ResizeObserver;
  private animationFrame = 0;
  private autoRotate = true;
  private rotationSpeed = 0.16;
  private materialSettings: MaterialSettings = {
    mode: 'combined',
    color: '#dce9f2',
    opacity: 0.72,
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setClearColor(0x03060b, 1);
    this.renderer.domElement.setAttribute('aria-label', 'Visualización tridimensional interactiva');
    this.container.append(this.renderer.domElement);

    this.scene.fog = new THREE.FogExp2(0x03060b, 0.025);
    this.scene.add(this.objectRoot);

    const emptyGeometry = new THREE.BufferGeometry();
    this.surfaceMesh = new THREE.Mesh(emptyGeometry, this.surfaceMaterial);
    this.wireMesh = new THREE.LineSegments(new THREE.BufferGeometry(), this.wireMaterial);
    this.surfaceMesh.renderOrder = 1;
    this.wireMesh.renderOrder = 2;
    this.objectRoot.add(this.surfaceMesh, this.wireMesh, this.axes);
    this.axes.visible = false;

    this.addLighting();
    this.addStarField();

    this.camera.position.set(7.2, 4.6, 8.4);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.minDistance = 3.8;
    this.controls.maxDistance = 24;
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    this.resize();
    this.applyMaterialSettings();
    this.animate();
  }

  private addLighting(): void {
    this.scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x111725, 1.35));
    const key = new THREE.DirectionalLight(0xffffff, 4.5);
    key.position.set(5, 7, 8);
    const rim = new THREE.DirectionalLight(0x6ba9ff, 3.2);
    rim.position.set(-7, 2, -6);
    const low = new THREE.PointLight(0xa6c7ff, 18, 28, 2);
    low.position.set(0, -6, 3);
    this.scene.add(key, rim, low);
  }

  private addStarField(): void {
    const random = (seed: number): number => {
      const value = Math.sin(seed * 91.731) * 43758.5453;
      return value - Math.floor(value);
    };
    const positions: number[] = [];
    for (let index = 0; index < 420; index += 1) {
      const radius = 18 + random(index + 1) * 22;
      const theta = random(index + 2) * Math.PI * 2;
      const phi = Math.acos(2 * random(index + 3) - 1);
      positions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x7293b8,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true,
    });
    this.scene.add(new THREE.Points(geometry, material));
  }

  private resize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private animate = (): void => {
    this.animationFrame = window.requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    if (this.autoRotate) this.objectRoot.rotation.y += delta * this.rotationSpeed;
    this.controls.update();
    this.render();
  };

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  setGeometry(geometry: THREE.BufferGeometry): void {
    const previousSurfaceGeometry = this.surfaceMesh.geometry;
    const previousWireGeometry = this.wireMesh.geometry;
    this.surfaceMesh.geometry = geometry;
    this.wireMesh.geometry = new THREE.WireframeGeometry(geometry);
    previousSurfaceGeometry.dispose();
    previousWireGeometry.dispose();
  }

  getGeometry(): THREE.BufferGeometry {
    return this.surfaceMesh.geometry;
  }

  setMaterialSettings(settings: MaterialSettings): void {
    this.materialSettings = settings;
    this.applyMaterialSettings();
  }

  private applyMaterialSettings(): void {
    const { mode, color, opacity } = this.materialSettings;
    const safeOpacity = THREE.MathUtils.clamp(opacity, 0.08, 1);
    this.surfaceMaterial.color.set(color);
    this.surfaceMaterial.opacity = mode === 'combined' ? Math.min(safeOpacity, 0.66) : safeOpacity;
    this.surfaceMaterial.transparent = this.surfaceMaterial.opacity < 1;
    this.surfaceMaterial.depthWrite = this.surfaceMaterial.opacity > 0.82;
    this.surfaceMaterial.needsUpdate = true;

    const baseColor = new THREE.Color(color);
    this.wireMaterial.color.copy(baseColor.lerp(new THREE.Color(0xffffff), 0.52));
    this.wireMaterial.opacity = mode === 'wireframe' ? safeOpacity : Math.min(0.88, safeOpacity + 0.18);
    this.wireMaterial.needsUpdate = true;

    this.surfaceMesh.visible = mode !== 'wireframe';
    this.wireMesh.visible = mode !== 'surface';
  }

  setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
  }

  setRotationSpeed(speed: number): void {
    this.rotationSpeed = THREE.MathUtils.clamp(speed, 0, 0.8);
  }

  setAxesVisible(visible: boolean): void {
    this.axes.visible = visible;
  }

  resetCamera(): void {
    this.camera.position.set(7.2, 4.6, 8.4);
    this.controls.target.set(0, 0, 0);
    this.objectRoot.rotation.set(-0.08, 0.32, 0.03);
    this.controls.update();
  }

  getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  dispose(): void {
    window.cancelAnimationFrame(this.animationFrame);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.surfaceMesh.geometry.dispose();
    this.wireMesh.geometry.dispose();
    this.surfaceMaterial.dispose();
    this.wireMaterial.dispose();
    this.renderer.dispose();
  }
}
