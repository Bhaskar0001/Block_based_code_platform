export function createSpriteModel() {
  const sprite = {
    x: 0,
    y: 0,
    rotation: 0, // degrees
    scale: 1,

    reset() {
      this.x = 0;
      this.y = 0;
      this.rotation = 0;
      this.scale = 1;
    },
  };
  return sprite;
}
