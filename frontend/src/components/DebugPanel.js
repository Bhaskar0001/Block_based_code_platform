import React from "react";
import "./DebugPanel.css";

export default function DebugPanel({ logs }) {
  return (
    <div className="debugWrap">
      <div className="debugHeader">Logs / Debug</div>
      <div className="debugBody">
        {logs.length === 0 ? (
          <div className="dim">No logs yet. Click Run.</div>
        ) : (
          logs.map((l, i) => (
            <div className="logLine" key={i}>{l}</div>
          ))
        )}
      </div>
    </div>
  );
}
