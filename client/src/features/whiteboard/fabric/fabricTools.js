import { PencilBrush } from "fabric";

export const WHITEBOARD_TOOLS = Object.freeze({
  PENCIL: "PENCIL",
  ERASER: "ERASER",
  RECTANGLE: "RECTANGLE",
  CIRCLE: "CIRCLE",
  LINE: "LINE",
  TEXT: "TEXT",
});

function ensureBrush(canvas) {
  if (!(canvas.freeDrawingBrush instanceof PencilBrush)) {
    canvas.freeDrawingBrush = new PencilBrush(canvas);
  }
}

function setObjectsInteractive(canvas, interactive) {
  for (const object of canvas.getObjects()) {
    object.set({
      selectable: interactive,
      evented: interactive,
      hasControls: interactive,
      hasBorders: interactive,
      lockMovementX: !interactive,
      lockMovementY: !interactive,
      lockRotation: true,
      lockScalingX: !interactive,
      lockScalingY: !interactive,
    });
  }
}

export function setCanvasTool(canvas, tool) {
  if (!canvas) return;

  switch (tool) {
    case WHITEBOARD_TOOLS.PENCIL:
    case WHITEBOARD_TOOLS.ERASER:
      ensureBrush(canvas);
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.discardActiveObject();
      setObjectsInteractive(canvas, false);
      break;

    default:
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.discardActiveObject();
      setObjectsInteractive(canvas, false);
      break;
  }

  canvas.requestRenderAll();
}

export function setBrushColor(canvas, color) {
  if (!canvas) return;

  ensureBrush(canvas);
  canvas.freeDrawingBrush.color = color;
}

export function setBrushWidth(canvas, width) {
  if (!canvas) return;

  ensureBrush(canvas);
  canvas.freeDrawingBrush.width = Number(width);
}

export function clearCanvas(canvas) {
  if (!canvas) return;

  canvas.clear();
  canvas.backgroundColor = "#ffffff";
  canvas.requestRenderAll();
}
