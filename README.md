# Calabi–Yau Lab — V1

Aplicación web científica e interactiva para explorar una sección bidimensional real de la quíntica de Fermat mediante WebGL. La geometría se calcula numéricamente a partir de la ecuación algebraica; no es una malla decorativa presentada como una variedad Calabi–Yau.

Esta es la primera versión estable funcional, identificada permanentemente mediante la etiqueta Git `v1.0.0`. El desarrollo posterior se realiza en la rama `develop`; `main` conserva la última versión estable verificada. Consulta [docs/VERSIONES.md](docs/VERSIONES.md) para guardar cambios, publicar y recuperar esta versión.

## Fundamento matemático

La quíntica de Fermat

\[
X=\left\{[Z_0:\cdots:Z_4]\in\mathbb{CP}^{4}:Z_0^5+Z_1^5+Z_2^5+Z_3^5+Z_4^5=0\right\}
\]

es una hipersuperficie proyectiva suave de dimensión compleja 3, por tanto de dimensión real 6, y constituye una variedad Calabi–Yau.

La aplicación impone la sección lineal `Z₃ = Z₄ = 0` y trabaja en la carta afín `Z₂ = 1`. Allí se obtiene la curva compleja

\[
x^5+y^5+1=0,
\]

cuya compactificación proyectiva es una curva de Fermat de género 6. Se muestrean valores

\[
x=re^{i\theta},\qquad y_k=(-1-x^5)^{1/5}e^{2\pi i k/5},\quad k=0,\ldots,4.
\]

Cada punto `(x,y)` tiene cuatro coordenadas reales. La aplicación ofrece tres mapas explícitos hacia `R³`:

1. **Coordenadas:** `(Re x, Im x, Re y)`.
2. **Oblicua ortonormal:** proyección lineal sobre tres filas ortonormales que combinan por igual las coordenadas de `x` e `y`.
3. **Hopf:** `(2 Re(x·conj(y)), 2 Im(x·conj(y)), |x|² − |y|²)`, un mapa cuadrático, no una proyección lineal.

Después del mapa seleccionado, la nube se centra y escala uniformemente para mantener un encuadre comparable.

### Continuidad, ramificación y triangulación

Etiquetar globalmente las cinco raíces con la rama principal produciría saltos artificiales. Por ello, cada triángulo empareja las raíces que son continuaciones más cercanas en el plano complejo a lo largo de sus tres aristas. No se crean índices que unan directamente ramas distintas.

La proyección ramificada `(x,y) → x` tiene cinco puntos con `x⁵ = −1` y `y = 0`. La curva algebraica es suave allí, pero la descripción de `y` como raíz de una función de `x` no es una carta regular. La implementación omite las celdas paramétricas que contienen esos puntos; esto deja pequeños fragmentos abiertos y evita una triangulación engañosa alrededor de la ramificación.

## Tecnologías

- Vite y TypeScript
- Three.js y WebGL
- `OrbitControls` para navegación
- KaTeX para ecuaciones
- Vitest para verificaciones numéricas
- HTML y CSS sin React

## Instalación y ejecución

Requisitos: una versión reciente de Node.js y npm.

```bash
npm install
npm run dev
```

`npm run dev` inicia Vite e intenta abrir la aplicación en el navegador. La dirección predeterminada es `http://127.0.0.1:5173`.

## Controles

- Arrastrar: rotar libremente la cámara.
- Rueda del ratón o gesto de pinza: zoom.
- Restaurar cámara, activar/pausar rotación y modificar su velocidad.
- Modos alámbrico, superficie y combinado.
- Color y opacidad sin reconstruir la geometría.
- Resolución, radio máximo, cobertura angular y proyección; estos parámetros sí recalculan la malla.
- Mostrar u ocultar ejes de referencia.
- Exportar el encuadre actual como PNG.
- Exportar la malla proyectada visible como OBJ.
- Maximizar la escena con pantalla completa.

Los controles de cámara y material actualizan objetos ya existentes. Solo los parámetros del bloque **Geometría** reconstruyen buffers; los buffers anteriores se liberan explícitamente.

## Verificaciones

```bash
npm test
npm run build
```

Las pruebas verifican las cinco raíces complejas, los puntos de ramificación, el residual de `x⁵ + y⁵ + 1`, las fórmulas de proyección, la ausencia de `NaN`/infinitos y la ausencia de triángulos degenerados en las tres proyecciones.

## Versión de producción

```bash
npm run build
npm run preview
```

Vite genera el sitio estático en `dist/`. La opción `base: './'` permite alojarlo en una subruta, lo cual facilita una futura publicación en GitHub Pages.

## Limitaciones científicas

- Se muestra una superficie real bidimensional derivada de una sección de la quíntica, **no** la variedad Calabi–Yau completa de seis dimensiones reales.
- Se usa una carta afín truncada: no se incluyen los puntos en el infinito de la curva compacta.
- Toda aplicación `R⁴ → R³` pierde información y puede introducir solapamientos visuales.
- Las celdas que contienen puntos de ramificación se omiten deliberadamente.
- La triangulación aproxima un dominio paramétrico finito; la malla resultante puede ser abierta.
- No se calcula una métrica Ricci-plana, una solución de Einstein o Yang–Mills, ni un modelo físico de compactificación.
- El OBJ exportado no se garantiza cerrado, estanco ni apto para impresión 3D. Una exportación STL preparada para fabricación queda como trabajo futuro.

## Arquitectura

```text
src/
├── math/       números complejos, ecuación y verificaciones
├── geometry/   proyecciones, continuidad y triangulación
├── rendering/  escena Three.js, cámara, luces y materiales
├── ui/         controles y panel científico
└── export/     PNG y OBJ
```

## Evolución propuesta

1. Añadir cartas específicas alrededor de los puntos de ramificación para cerrar los pequeños huecos sin perder regularidad.
2. Incorporar los puntos en el infinito y un atlas de la curva proyectiva completa.
3. Crear una galería con otras secciones, superficies K3 y familias deformadas de la quíntica.
4. Añadir workers para generar mallas de muy alta resolución sin bloquear la interfaz.
5. Publicar `dist/` mediante GitHub Actions y GitHub Pages, conservando pruebas y compilación como comprobaciones previas al despliegue.
