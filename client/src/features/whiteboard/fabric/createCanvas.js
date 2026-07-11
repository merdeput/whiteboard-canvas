import { Canvas, PencilBrush } from "fabric";

function initializeBrush(canvas) {
  if (!canvas) return;

  canvas.freeDrawingBrush = new PencilBrush(canvas);
  canvas.freeDrawingBrush.color = "#000000";
  canvas.freeDrawingBrush.width = 3;
  canvas.isDrawingMode = false;
}

function createCanvas(element) {
  const canvas = new Canvas(element, {
    backgroundColor: "#ffffff",
    selection: true,
    preserveObjectStacking: true,
    enableRetinaScaling: true,
  });

  initializeBrush(canvas);

  return canvas;
}

export default createCanvas;
