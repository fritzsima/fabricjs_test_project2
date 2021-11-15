import React, { useEffect } from "react";
import CanvasManager from "./CanvasManager";
import { CANVAS_CONFIG, CANVAS_OPTIONS } from './Constants';

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
    <div style={styles.container}>
      <canvas
        id={CANVAS_CONFIG.ID}
        style={styles.canvas}
      />
      <div style={styles.btnGroup}>
        <button onClick={undo} style={styles.btnUndo}>Undo</button>
        <button onClick={redo} style={styles.btnRedo}>Redo</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    margin: 'auto',
    marginTop: '24px',
    width: CANVAS_OPTIONS.width
  },
  canvas: {
    border: '1px solid #eeeeee',
  },
  btnGroup: {
    marginTop: '24px',
    textAlign: 'center'
  },
  btnUndo: {
    marginRight: '120px'
  },
  btnRedo: {
    marginLeft: '120px'
  }
}

export default App;
