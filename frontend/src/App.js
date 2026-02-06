import React, { useMemo, useRef, useState } from "react";

import TopBar from "./components/TopBar";
import BlocklyPanel from "./components/BlocklyPanel";
import StagePanel from "./components/StagePanel";
import DebugPanel from "./components/DebugPanel";

import { createEngine } from "./engine/createEngine";
import { compileWorkspaceToProgram } from "./engine/compiler";
import { createProjectStorage } from "./services/projectStorage";

import "./App.css";

export default function App() {
  const storage = useMemo(() => createProjectStorage(), []);
  const engineRef = useRef(null);

  const [logs, setLogs] = useState([]);
  const [workspaceApi, setWorkspaceApi] = useState(null);
  const [stageApi, setStageApi] = useState(null);

  function log(msg) {
    setLogs((prev) => [...prev.slice(-200), msg]);
  }

  function highlightBlock(blockId) {
    if (!workspaceApi) return;
    const ws = workspaceApi.getWorkspace();
    if (!ws) return;
    ws.highlightBlock(blockId || null);
  }

  function ensureEngine() {
    if (!engineRef.current) {
      engineRef.current = createEngine({
        onLog: log,
        onHighlight: highlightBlock,
        maxOpsPerSecond: 10000,
      });
    }
    return engineRef.current;
  }

  async function onRun() {
    
    if (!workspaceApi || !stageApi) {
      log("Workspace/Stage not ready yet.");
      return;
    }

    const ws = workspaceApi.getWorkspace();
   const program = compileWorkspaceToProgram(ws);
   log(`Compiled: ${program.scripts.length} script(s).`);


    const engine = ensureEngine();
    engine.stop();
    engine.loadProgram(program);
    engine.bindRuntime({ sprite: stageApi.getSprite() });
    engine.start();
  }

  function onStop() {
    const engine = ensureEngine();
    engine.stop();
    highlightBlock(null);
    log("Stopped.");
  }

  function onReset() {
    const engine = ensureEngine();
    engine.stop();
    highlightBlock(null);
    if (stageApi) stageApi.resetSprite();
    log("Reset sprite + stopped engine.");
  }

  function onSave() {
    if (!workspaceApi) return;
    const json = workspaceApi.save();
    storage.saveLocal(json);
    log("Saved project to localStorage.");
  }

  function onLoad() {
    if (!workspaceApi) return;
    const json = storage.loadLocal();
    if (!json) {
      log("No saved project found in localStorage.");
      return;
    }
    workspaceApi.load(json);
    log("Loaded project from localStorage.");
  }

  return (
    <div className="appRoot">
      <TopBar onRun={onRun} onStop={onStop} onReset={onReset} onSave={onSave} onLoad={onLoad} />

      <div className="mainGrid">
        <div className="panel panelBlockly">
          <BlocklyPanel onReady={setWorkspaceApi} />
        </div>

        <div className="panel panelStage">
          <StagePanel onReady={setStageApi} />
        </div>
      </div>

      <div className="panel panelDebug">
        <DebugPanel logs={logs} />
      </div>
    </div>
  );
}
