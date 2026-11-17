import * as THREE from 'three';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function exportCanvasAsPng(canvas: HTMLCanvasElement): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('El navegador no pudo generar la imagen PNG.'));
        return;
      }
      downloadBlob(blob, `calabi-yau-lab-${timestamp()}.png`);
      resolve();
    }, 'image/png');
  });
}

export function exportGeometryAsObj(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute('position');
  if (!position || position.count < 3) throw new Error('No hay una malla exportable.');

  const lines: string[] = [
    '# Calabi–Yau Lab — sección afín de la curva de Fermat',
    '# Malla proyectada, centrada y escalada. Puede ser abierta y no imprimible.',
    'o fermat_curve_section',
  ];
  for (let index = 0; index < position.count; index += 1) {
    lines.push(`v ${position.getX(index)} ${position.getY(index)} ${position.getZ(index)}`);
  }

  const normal = geometry.getAttribute('normal');
  if (normal) {
    for (let index = 0; index < normal.count; index += 1) {
      lines.push(`vn ${normal.getX(index)} ${normal.getY(index)} ${normal.getZ(index)}`);
    }
  }

  for (let index = 0; index + 2 < position.count; index += 3) {
    const a = index + 1;
    const b = index + 2;
    const c = index + 3;
    lines.push(normal ? `f ${a}//${a} ${b}//${b} ${c}//${c}` : `f ${a} ${b} ${c}`);
  }

  downloadBlob(new Blob([`${lines.join('\n')}\n`], { type: 'text/plain;charset=utf-8' }), `calabi-yau-lab-${timestamp()}.obj`);
}
