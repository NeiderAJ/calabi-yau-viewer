import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // NUEVO: Importar OrbitControls


import styles from './ViewerCanvas.module.css';
import { useViewerStore } from '../../store/viewerStore.ts';

function ViewerCanvas() {
  const mountRef = useRef<HTMLDivElement>(null); // Ref para el div donde montaremos el canvas
  const { paramA, paramB } = useViewerStore(); // Leemos parámetros para usarlos luego

  // Usaremos refs para mantener instancias de Three.js y poder limpiarlas
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null); // Ref para nuestro cubo de prueba
  const controlsRef = useRef<OrbitControls | null>(null); // NUEVO: Ref para OrbitControls


  useEffect(() => {
    // Asegurarnos de que mountRef.current no sea null
    if (!mountRef.current) {
      console.error("Error: mountRef.current es null. El div no se ha montado.");
      return;
    }

    const currentMount = mountRef.current; // Para evitar problemas con el closure en la limpieza

    // --- 1. Configuración de la Escena, Cámara y Renderizador (Solo una vez al montar) ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75, // FOV (Campo de visión)
      currentMount.clientWidth / currentMount.clientHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    
    camera.position.z = 3; // MODIFICADO: Acercamos un poco la cámara para OrbitControls
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Para mejor calidad en pantallas HiDPI
    currentMount.appendChild(renderer.domElement); // Añadimos el canvas al DOM
    rendererRef.current = renderer;

 // --- NUEVO: Configurar OrbitControls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Efecto de "arrastre" o inercia suave
    controls.dampingFactor = 0.05; // Qué tan rápido se detiene el damping
    // controls.screenSpacePanning = false; // Opcional: si quieres que el paneo sea en el plano XY de la escena
    // controls.minDistance = 1; // Opcional: zoom mínimo
    // controls.maxDistance = 10; // Opcional: zoom máximo
    // controls.maxPolarAngle = Math.PI / 2; // Opcional: limita la rotación vertical para no pasar por debajo del "suelo"
    controlsRef.current = controls;
    // --- FIN NUEVO ---

    // --- 2. Añadir un Cubo de Prueba a la Escena ---
    const geometry = new THREE.BoxGeometry(1, 1, 1); // Cubo de 1x1x1
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true }); // Verde y en modo alambre
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cubeRef.current = cube;

    // --- 3. Bucle de Animación ---
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Aquí podrías añadir animaciones (ej. rotar el cubo)
      if (cubeRef.current) {
         cubeRef.current.rotation.x += 0.01;
         cubeRef.current.rotation.y += 0.01;
      }

      controlsRef.current?.update(); // MODIFICADO: Actualizar controles en cada frame (necesario si enableDamping = true)
      renderer.render(scene, camera);
    };
    animate();

    // --- 4. Manejo de Redimensionamiento de Ventana (Opcional pero recomendado) ---
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && currentMount) {
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // --- 5. Limpieza al Desmontar el Componente ---
    return () => {
      console.log("Limpiando escena de Three.js con OrbitControls"); // MODIFICADO
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      controlsRef.current?.dispose(); // NUEVO: Limpiar OrbitControls


      if (cubeRef.current) { // Geometría y material del cubo
        cubeRef.current.geometry.dispose();
        if (Array.isArray(cubeRef.current.material)) {
            cubeRef.current.material.forEach(mat => mat.dispose());
        } else {
            (cubeRef.current.material as THREE.Material).dispose();
        }
        scene.remove(cubeRef.current); // Quitar de la escena
      }
      
      // controlsRef.current?.dispose(); // Para OrbitControls

      if (rendererRef.current) {
        // Importante: quitar el canvas del DOM antes de llamar a dispose
        // para evitar errores si el componente se remonta rápidamente.
        if (currentMount && rendererRef.current.domElement.parentNode === currentMount) {
          currentMount.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose(); // Liberar recursos del renderizador
      }
      
      // No es necesario scene.dispose() explícitamente, Three.js maneja la liberación
      // de sus hijos cuando se quitan de la escena y se dispone de sus geometrías/materiales.
    };
  }, []); // El array de dependencias vacío asegura que este useEffect se ejecute solo una vez (al montar y desmontar)

  // Usaremos paramA y paramB en el siguiente useEffect para actualizar la escena
  useEffect(() => {
    if (cubeRef.current) { // Solo si el cubo ya existe
      // Ejemplo: escalar el cubo basado en paramA
      const scale = 0.5 + paramA * 1.5; // Escala de 0.5 a 2.0
      cubeRef.current.scale.set(scale, scale, scale);

      // Ejemplo: cambiar color del cubo basado en paramB (muy simple)
      // Asumimos que el material es MeshBasicMaterial
      if (cubeRef.current.material instanceof THREE.MeshBasicMaterial) {
        cubeRef.current.material.color.setRGB(paramB, 1 - paramB, 0.5);
      }
    }
  }, [paramA, paramB]); // Este efecto se ejecuta cuando paramA o paramB cambian

  return (
    <div ref={mountRef} className={styles.canvasContainer}>
      {/* El canvas de Three.js se insertará aquí por renderer.domElement */}
      {/* Ya no necesitamos el texto "Visor 3D Placeholder" ni los valores del store aquí,
          ya que el canvas ocupará este espacio. Podemos quitarlos para limpiar. */}
    </div>
  );
}

export default ViewerCanvas;