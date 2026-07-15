import { useEffect, useRef } from "react";
// import { fabric } from 'fabric';
import createCanvas from "../features/whiteboard/fabric/createCanvas";
import resizeCanvas from "../features/whiteboard/fabric/resizeCanvas";
import { serializePath, deserializePath } from "../features/whiteboard/fabric/fabricSerializer";
import {
  activateDrawingTool,
  activateSelectionTool,
  enableDrawing,
  disableDrawing,
  toggleDrawing,
  setBrushColor,
  setBrushWidth,
  deleteSelectedObjects,
  clearCanvas,
} from "../features/whiteboard/fabric/fabricTools";

function useFabricCanvas({
  onObjectCreated,
  onObjectModified,
  onObjectsDeleted,
  onClear,
} = {}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const isApplyingRemote = useRef(false);
  const onObjectCreatedRef = useRef(onObjectCreated);
  const onObjectModifiedRef = useRef(onObjectModified);
  const onObjectsDeletedRef = useRef(onObjectsDeleted);
  const onClearRef = useRef(onClear);
  onObjectCreatedRef.current = onObjectCreated;
  onObjectModifiedRef.current = onObjectModified;
  onObjectsDeletedRef.current = onObjectsDeleted;
  onClearRef.current = onClear;

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) {
      return undefined;
    }

    const fabricCanvas = createCanvas(canvasRef.current);
    fabricCanvasRef.current = fabricCanvas;
    activateSelectionTool(fabricCanvas);

    const handleResize = () => {
      resizeCanvas(fabricCanvas, containerRef.current);
    };

    handleResize();

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => {
            handleResize();
          })
        : null;

    resizeObserver?.observe(containerRef.current);
    window.addEventListener("resize", handleResize);

    const handlePathCreated = (e) => {
      if (isApplyingRemote.current || !e.path) {
        return;
      }
      const object = serializePath(e.path);
      onObjectCreatedRef.current?.(object);
    };

    const handleObjectModified = (e) => {
      if (isApplyingRemote.current || !e.target || e.target.type !== "path") {
        return;
      }

      const object = serializePath(e.target);
      onObjectModifiedRef.current?.(object);
    };

    const handleKeyDown = (event) => {
      const isDeleteKey = event.key === "Delete" || event.key === "Backspace";
      const targetTagName = event.target?.tagName;
      const isEditableTarget =
        event.target?.isContentEditable ||
        targetTagName === "INPUT" ||
        targetTagName === "TEXTAREA" ||
        targetTagName === "SELECT";

      if (!isDeleteKey || isEditableTarget) {
        return;
      }

      const deletedObjectIds = deleteSelectedObjects(fabricCanvas);

      if (deletedObjectIds.length) {
        event.preventDefault();
        onObjectsDeletedRef.current?.(deletedObjectIds);
      }
    };
 
    fabricCanvas.on("path:created", handlePathCreated);
    fabricCanvas.on("object:modified", handleObjectModified);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      fabricCanvas.off("path:created", handlePathCreated);
      fabricCanvas.off("object:modified", handleObjectModified);
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  const addRemoteObject = (data) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !data?.object) {
      return;
    }

    isApplyingRemote.current = true;
    const object = deserializePath(data.object);
    canvas.add(object);
    if (!canvas.isDrawingMode) {
      activateSelectionTool(canvas);
    }
    canvas.requestRenderAll();
    isApplyingRemote.current = false;
  };

  const applyCanvasClear = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }

    isApplyingRemote.current = true;
    clearCanvas(canvas);
    isApplyingRemote.current = false;
  };

  const applyRemoteObjectUpdate = (data) => {
    const canvas = fabricCanvasRef.current;
    const objectId = data?.object?.objectId;

    if (!canvas || !objectId) {
      return;
    }

    const existingObject = canvas.getObjects().find((object) => object.objectId === objectId);

    if (!existingObject) {
      return;
    }

    isApplyingRemote.current = true;
    existingObject.set(data.object);
    existingObject.setCoords();
    canvas.requestRenderAll();
    isApplyingRemote.current = false;
  };

  const applyRemoteObjectDelete = (data) => {
    const canvas = fabricCanvasRef.current;
    const objectIds = data?.objectIds || [];

    if (!canvas || !objectIds.length) {
      return;
    }

    isApplyingRemote.current = true;

    for (const objectId of objectIds) {
      const existingObject = canvas.getObjects().find((object) => object.objectId === objectId);

      if (existingObject) {
        canvas.remove(existingObject);
      }
    }

    canvas.discardActiveObject();
    canvas.requestRenderAll();
    isApplyingRemote.current = false;
  };

  const loadWhiteboardState = (state) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }

    isApplyingRemote.current = true;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";

    for (const object of state?.objects || []) {
      if (object?.type !== "path") {
        continue;
      }

      const canvasObject = deserializePath(object);
      canvas.add(canvasObject);
    }

    if (!canvas.isDrawingMode) {
      activateSelectionTool(canvas);
    }

    canvas.requestRenderAll();
    isApplyingRemote.current = false;
  };

  const tools = {
    activateDrawingTool: () => activateDrawingTool(fabricCanvasRef.current),
    activateSelectionTool: () => activateSelectionTool(fabricCanvasRef.current),
    enableDrawing: () => enableDrawing(fabricCanvasRef.current),
    disableDrawing: () => disableDrawing(fabricCanvasRef.current),
    toggleDrawing: () => toggleDrawing(fabricCanvasRef.current),
    setBrushColor: (color) => setBrushColor(fabricCanvasRef.current, color),
    setBrushWidth: (width) => setBrushWidth(fabricCanvasRef.current, width),
    clearCanvas: () => {
      clearCanvas(fabricCanvasRef.current);
      onClearRef.current?.();
    },
    addRemoteObject,
    applyRemoteObjectUpdate,
    applyRemoteObjectDelete,
    applyCanvasClear,
    loadWhiteboardState,
  };

  return {
    containerRef,
    canvasRef,
    fabricCanvasRef,
    tools,
  };
}

export default useFabricCanvas;
