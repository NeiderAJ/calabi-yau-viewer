import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App/App.tsx';  // Cambiaremos esta ruta luego
import './styles/global.css'; // Importar nuestros estilos globales

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);