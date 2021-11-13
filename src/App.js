import React, { useEffect } from "react";
import CanvasManager from "./CanvasManager";
import { CANVAS_CONFIG } from './Constants';

function App() {
  let canvasManager = null;

  useEffect(() => {
    canvasManager = new CanvasManager(CANVAS_CONFIG.ID);
  });

  const undo = () => {
    console.log("undo");
    canvasManager?.undo();
  }

  const redo = () => {
    console.log("redo");
    canvasManager?.redo();
  }

  return (
    <div>
      <canvas
        id={CANVAS_CONFIG.ID}
        style={styles.canvas}
      />
      <button onClick={undo}>undo</button>
      <button onClick={redo}>redo</button>
    </div>
  );
}

const styles = {
  canvas: {
    border: '1px solid #eeeeee'
  }
}

export default App;
