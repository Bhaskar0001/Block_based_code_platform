import React from "react";
import "./TopBar.css";

export default function TopBar({ onRun, onStop, onReset, onSave, onLoad }) {
  return (
    <div className="topBar">
      <div className="brand">Block Platform </div>
      <div className="controls">
        <button className="btn primary" onClick={onRun}>Run</button>
        <button className="btn" onClick={onStop}>Stop</button>
        <button className="btn" onClick={onReset}>Reset</button>
        <span className="sep" />
        <button className="btn" onClick={onSave}>Save</button>
        <button className="btn" onClick={onLoad}>Load</button>
      </div>
    </div>
  );
}
