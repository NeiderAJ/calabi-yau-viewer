import React from 'react'; // Lo necesitamos para JSX
import styles from './Sliders.module.css';
import { useViewerStore } from '../../store/viewerStore.ts';

function Sliders() {
  // Seleccionamos los valores que cambian y pueden causar re-render
  const paramA = useViewerStore((state) => state.paramA);
  const paramB = useViewerStore((state) => state.paramB);

  // Obtenemos las funciones 'set' una vez. No cambian, así que no necesitan estar en un selector que se re-evalúa.
  // O, aún mejor, Zustand permite accederlas directamente del estado si las seleccionamos individualmente:
  const setParamA = useViewerStore((state) => state.setParamA);
  const setParamB = useViewerStore((state) => state.setParamB);

  // O incluso de forma más concisa si solo necesitamos el estado una vez para destructurar:
  // const { paramA, paramB, setParamA, setParamB } = useViewerStore();
  // Pero la forma anterior es más explícita sobre las suscripciones. Para este caso,
  // seleccionar cada uno por separado es lo más seguro contra re-renders innecesarios.

  return (
    <div className={styles.slidersContainer}>
      <div className={styles.sliderControl}>
        <label htmlFor="paramA">
          Parámetro A: {paramA.toFixed(2)}
        </label>
        <input
          type="range"
          id="paramA"
          min="0"
          max="1"
          step="0.01"
          value={paramA}
          onChange={(e) => setParamA(parseFloat(e.target.value))}
        />
      </div>
      <div className={styles.sliderControl}>
        <label htmlFor="paramB">
          Parámetro B: {paramB.toFixed(2)}
        </label>
        <input
          type="range"
          id="paramB"
          min="0"
          max="1"
          step="0.01"
          value={paramB}
          onChange={(e) => setParamB(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
}

export default Sliders;