import { PencilBrush } from "fabric";

export const WHITEBOARD_TOOLS = Object.freeze({
  SELECT: "SELECT",
  PENCIL: "PENCIL",
  RECTANGLE: "RECTANGLE",
  CIRCLE: "CIRCLE",
  LINE: "LINE",
});

function ensureBrush(canvas) {
  if (!(canvas.freeDrawingBrush instanceof PencilBrush)) {
    canvas.freeDrawingBrush = new PencilBrush(canvas);
  }
}

function setObjectsSelectable(canvas, selectable) {
  for (const object of canvas.getObjects()) {
    object.set({
      selectable,
      evented: selectable,
      hasControls: selectable,
      hasBorders: selectable,
      lockMovementX: !selectable,
      lockMovementY: !selectable,
      lockRotation: true,
      lockScalingX: !selectable,
      lockScalingY: !selectable,
    });
  }
}

export function setCanvasTool(canvas, tool) {
  if (!canvas) return;

  switch (tool) {
    case WHITEBOARD_TOOLS.PENCIL:
      ensureBrush(canvas);
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.discardActiveObject();
      setObjectsSelectable(canvas, false);
      break;

    case WHITEBOARD_TOOLS.SELECT:
      canvas.isDrawingMode = false;
      canvas.selection = true;
      setObjectsSelectable(canvas, true);
      break;

    default:
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.discardActiveObject();
      setObjectsSelectable(canvas, false);
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

export function deleteSelectedObjects(canvas) {
  if (!canvas) return [];

  const activeObjects = canvas.getActiveObjects();

  if (!activeObjects.length) {
    return [];
  }

  const deletedObjectIds = activeObjects
    .map((object) => object.objectId)
    .filter(Boolean);

  canvas.discardActiveObject();

  for (const object of activeObjects) {
    canvas.remove(object);
  }

  canvas.requestRenderAll();
  return deletedObjectIds;
}

export function clearCanvas(canvas) {
  if (!canvas) return;

  canvas.clear();
  canvas.backgroundColor = "#ffffff";
  canvas.requestRenderAll();
}
