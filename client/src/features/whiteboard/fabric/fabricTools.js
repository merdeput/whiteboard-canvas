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

function setObjectsInteractive(canvas, interactive, predicate = null) {
  for (const object of canvas.getObjects()) {
    const isInteractive = interactive && (predicate ? predicate(object) : true);

    object.set({
      selectable: isInteractive,
      evented: isInteractive,
      hasControls: isInteractive,
      hasBorders: isInteractive,
      lockMovementX: !isInteractive,
      lockMovementY: !isInteractive,
      lockRotation: !isInteractive ? true : object.type !== "textbox",
      lockScalingX: !isInteractive,
      lockScalingY: !isInteractive,
    });
  }
}

function setToolCursor(canvas, tool) {
  let cursor = "default";

  if (tool === WHITEBOARD_TOOLS.TEXT) {
    cursor = "text";
  } else if (tool === WHITEBOARD_TOOLS.ERASER) {
    cursor = "cell";
  } else if (
    tool === WHITEBOARD_TOOLS.PENCIL ||
    tool === WHITEBOARD_TOOLS.RECTANGLE ||
    tool === WHITEBOARD_TOOLS.CIRCLE ||
    tool === WHITEBOARD_TOOLS.LINE
  ) {
    cursor = "crosshair";
  }

  canvas.defaultCursor = cursor;
  canvas.hoverCursor = cursor;
  canvas.freeDrawingCursor = cursor;
  canvas.setCursor(cursor);
}

export function setCanvasTool(canvas, tool) {
  if (!canvas) return;

  setToolCursor(canvas, tool);

  switch (tool) {
    case WHITEBOARD_TOOLS.PENCIL:
    case WHITEBOARD_TOOLS.ERASER:
      ensureBrush(canvas);
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.discardActiveObject();
      setObjectsInteractive(canvas, false);
      break;

    case WHITEBOARD_TOOLS.TEXT:
      canvas.isDrawingMode = false;
      canvas.selection = false;
      setObjectsInteractive(canvas, true, (object) => object.type === "textbox");
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
