import { create } from 'zustand';

// Definimos la interfaz para el estado de nuestro visor
interface ViewerState {
  paramA: number;
  paramB: number;
  setParamA: (value: number) => void;
  setParamB: (value: number) => void;
  // Podríamos añadir más parámetros o configuraciones aquí en el futuro
  // Ejemplo: surfaceType: string; setSurfaceType: (type: string) => void;
}

// Creamos el store
export const useViewerStore = create<ViewerState>((set) => ({
  // Valores iniciales de nuestros parámetros
  paramA: 0.5,
  paramB: 0.3,

  // Acciones para modificar el estado
  setParamA: (value) => set({ paramA: value }),
  setParamB: (value) => set({ paramB: value }),

  // Ejemplo de cómo se añadiría otra propiedad y su 'setter'
  // surfaceType: 'calabiYau',
  // setSurfaceType: (type) => set({ surfaceType: type }),
}));