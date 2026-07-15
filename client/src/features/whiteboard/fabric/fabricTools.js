import { PencilBrush } from "fabric";

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
      hasControls: false,
      hasBorders: selectable,
      lockMovementX: !selectable,
      lockMovementY: !selectable,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
    });
  }
}

export function activateDrawingTool(canvas) {
  if (!canvas) return;

  ensureBrush(canvas);
  canvas.isDrawingMode = true;
  canvas.selection = false;
  canvas.discardActiveObject();
  setObjectsSelectable(canvas, false);
  canvas.requestRenderAll();
}

export function activateSelectionTool(canvas) {
  if (!canvas) return;

  canvas.isDrawingMode = false;
  canvas.selection = true;
  setObjectsSelectable(canvas, true);
  canvas.requestRenderAll();
}

export function enableDrawing(canvas) {
  activateDrawingTool(canvas);
}

export function disableDrawing(canvas) {
  if (!canvas) return;

  activateSelectionTool(canvas);
}

export function toggleDrawing(canvas) {
  if (!canvas) return;

  if (canvas.isDrawingMode) {
    activateSelectionTool(canvas);
  } else {
    activateDrawingTool(canvas);
  }
}

export function setBrushColor(canvas, color) {
  if (!canvas) return;

  activateDrawingTool(canvas);
  canvas.freeDrawingBrush.color = color;
}

export function setBrushWidth(canvas, width) {
  if (!canvas) return;

  activateDrawingTool(canvas);
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
  canvas.selection = true;
  canvas.requestRenderAll();
}
