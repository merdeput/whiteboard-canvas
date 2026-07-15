import { useEffect, useRef } from "react";
// import { fabric } from 'fabric';
import createCanvas from "../features/whiteboard/fabric/createCanvas";
import resizeCanvas from "../features/whiteboard/fabric/resizeCanvas";
import { serializePath, deserializePath } from "../features/whiteboard/fabric/fabricSerializer";
import {
  enableDrawing,
  disableDrawing,
  toggleDrawing,
  setBrushColor,
  setBrushWidth,
  clearCanvas,
} from "../features/whiteboard/fabric/fabricTools";

function useFabricCanvas({ onObjectCreated, onClear } = {}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const isApplyingRemote = useRef(false);
  const onObjectCreatedRef = useRef(onObjectCreated);
  const onClearRef = useRef(onClear);
  onObjectCreatedRef.current = onObjectCreated;
  onClearRef.current = onClear;

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) {
      return undefined;
    }

    const fabricCanvas = createCanvas(canvasRef.current);
    fabricCanvasRef.current = fabricCanvas;

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
 
    fabricCanvas.on("path:created", handlePathCreated);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      fabricCanvas.off("path:created", handlePathCreated);
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

    canvas.requestRenderAll();
    isApplyingRemote.current = false;
  };

  const tools = {
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
