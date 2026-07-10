import { PencilBrush } from "fabric";

export function enableDrawing(canvas) {
  if (!canvas) return;

  canvas.isDrawingMode = true;

  if (!(canvas.freeDrawingBrush instanceof PencilBrush)) {
    canvas.freeDrawingBrush = new PencilBrush(canvas);
  }
}

export function disableDrawing(canvas) {
  if (!canvas) return;

  canvas.isDrawingMode = false;
}

export function toggleDrawing(canvas) {
  if (!canvas) return;

  if (canvas.isDrawingMode) {
    disableDrawing(canvas);
  } else {
    enableDrawing(canvas);
  }
}

export function setBrushColor(canvas, color) {
  if (!canvas) return;

  enableDrawing(canvas);
  canvas.freeDrawingBrush.color = color;
}

export function setBrushWidth(canvas, width) {
  if (!canvas) return;

  enableDrawing(canvas);
  canvas.freeDrawingBrush.width = Number(width);
}

export function clearCanvas(canvas) {
  if (!canvas) return;

  canvas.clear();
  canvas.backgroundColor = "#ffffff";
  canvas.requestRenderAll();
}