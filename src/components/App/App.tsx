import styles from './App.module.css';
import ViewerCanvas from '../ViewerCanvas/ViewerCanvas.tsx';
import Sliders from '../UIControls/Sliders.tsx'; 

function App() {
  return (
    <div className={styles.appContainer}>
      <ViewerCanvas />
      <Sliders />
    </div>
  );
}

export default App;