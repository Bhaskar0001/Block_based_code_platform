import React, { useEffect, useRef } from "react";
import { createStage } from "../stage/createStage";
import { createSpriteModel } from "../stage/spriteModel";

import "./StagePanel.css";

export default function StagePanel({ onReady }) {
  const hostRef = useRef(null);
  const stageRef = useRef(null);
  const spriteRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const sprite = createSpriteModel();
      spriteRef.current = sprite;

      const stage = await createStage(hostRef.current, {
        width: 420,
        height: 360,
        background: 0x0b0e1a,
      });

      // If React StrictMode cleaned up before init finished
      if (cancelled) {
        stage.destroy();
        return;
      }

      stageRef.current = stage;
      stage.attachSprite(sprite);

      onReady({
        getSprite: () => spriteRef.current,
        resetSprite: () => spriteRef.current.reset(),
      });
    }

    boot();

    return () => {
      cancelled = true;
      if (stageRef.current) {
        stageRef.current.destroy();
        stageRef.current = null;
      }
    };
  }, [onReady]);

  return (
    <div className="stageWrap">
      <div className="stageHeader">Stage Output</div>
      <div className="stageHost" ref={hostRef} />
      <div className="stageHint">
        Coordinates: center = (0,0). Right = +X, Up = +Y.
      </div>
    </div>
  );
}
