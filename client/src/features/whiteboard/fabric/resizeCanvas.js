function resizeCanvas(canvas, container) {
  if (!canvas || !container) {
    return;
  }

  const { width, height } = container.getBoundingClientRect();
  const nextWidth = Math.max(0, Math.round(width));
  const nextHeight = Math.max(0, Math.round(height));

  if (!nextWidth || !nextHeight) {
    return;
  }

  if (canvas.width === nextWidth && canvas.height === nextHeight) {
    return;
  }

  canvas.setDimensions({
    width: nextWidth,
    height: nextHeight,
  });
  canvas.calcOffset();
  canvas.requestRenderAll();
}
export default resizeCanvas;
