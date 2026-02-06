import * as PIXI from "pixi.js";

export async function createStage(hostEl, { width, height, background }) {
  const app = new PIXI.Application();

  await app.init({
    width,
    height,
    backgroundColor: background,
    antialias: true,
  });

  // In Pixi v8, canvas is app.canvas
  const canvas = app.canvas;
  if (hostEl && canvas) hostEl.appendChild(canvas);

  const root = new PIXI.Container();
  root.x = width / 2;
  root.y = height / 2;
  app.stage.addChild(root);

  root.addChild(makeGrid(width, height));

  const spriteGfx = new PIXI.Graphics();
  spriteGfx.beginFill(0xffffff);
  spriteGfx.drawCircle(0, 0, 18);
  spriteGfx.endFill();

  spriteGfx.beginFill(0x000000);
  spriteGfx.drawCircle(8, -5, 3);
  spriteGfx.drawCircle(8, 5, 3);
  spriteGfx.endFill();

  root.addChild(spriteGfx);

  let spriteModel = null;

  app.ticker.add(() => {
    if (!spriteModel) return;
    spriteGfx.x = spriteModel.x;
    spriteGfx.y = -spriteModel.y;
    spriteGfx.rotation = (spriteModel.rotation * Math.PI) / 180;
    spriteGfx.scale.set(spriteModel.scale);
  });

  function attachSprite(model) {
    spriteModel = model;
  }

  let destroyed = false;

  function destroy() {
    if (destroyed) return;
    destroyed = true;

    // Remove canvas safely (React StrictMode can trigger destroy early)
    try {
      const c = app.canvas;
      if (c && c.parentNode) c.parentNode.removeChild(c);
    } catch (_) {
      // ignore
    }

    try {
      app.destroy(true);
    } catch (_) {
      // ignore
    }
  }

  return { attachSprite, destroy };
}

function makeGrid(w, h) {
  const g = new PIXI.Graphics();
  g.lineStyle(1, 0x2a2f44, 1);

  const step = 40;
  const halfW = w / 2;
  const halfH = h / 2;

  for (let x = -halfW; x <= halfW; x += step) {
    g.moveTo(x, -halfH);
    g.lineTo(x, halfH);
  }
  for (let y = -halfH; y <= halfH; y += step) {
    g.moveTo(-halfW, y);
    g.lineTo(halfW, y);
  }

  g.lineStyle(2, 0x3d4566, 1);
  g.moveTo(-halfW, 0);
  g.lineTo(halfW, 0);
  g.moveTo(0, -halfH);
  g.lineTo(0, halfH);

  return g;
}
