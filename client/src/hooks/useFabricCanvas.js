import { useEffect, useRef, useState } from "react";
import { Circle, Line, Rect, Textbox } from "fabric";
import createCanvas from "../features/whiteboard/fabric/createCanvas";
import resizeCanvas from "../features/whiteboard/fabric/resizeCanvas";
import {
  createObjectId,
  deserializeObject,
  serializeObject,
} from "../features/whiteboard/fabric/fabricSerializer";
import {
  setBrushColor,
  setBrushWidth,
  setCanvasTool,
  WHITEBOARD_TOOLS,
  clearCanvas,
} from "../features/whiteboard/fabric/fabricTools";

function useFabricCanvas({
  onObjectCreated,
  onClear,
} = {}) {
  const [activeTool, setActiveTool] = useState(WHITEBOARD_TOOLS.PENCIL);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const activeToolRef = useRef(WHITEBOARD_TOOLS.PENCIL);
  const shapeDraftRef = useRef(null);
  const strokeColorRef = useRef("#000000");
  const strokeWidthRef = useRef(3);
  const isApplyingRemote = useRef(false);
  const onObjectCreatedRef = useRef(onObjectCreated);
  const onClearRef = useRef(onClear);

  useEffect(() => {
    onObjectCreatedRef.current = onObjectCreated;
    onClearRef.current = onClear;
  }, [onObjectCreated, onClear]);

  const syncBrushStyle = (canvas, tool = activeToolRef.current) => {
    if (!canvas) {
      return;
    }

    setBrushWidth(canvas, strokeWidthRef.current);

    if (tool === WHITEBOARD_TOOLS.ERASER) {
      setBrushColor(canvas, "#ffffff");
      return;
    }

    setBrushColor(canvas, strokeColorRef.current);
  };

  const setTool = (tool) => {
    activeToolRef.current = tool;
    setActiveTool(tool);
    setCanvasTool(fabricCanvasRef.current, tool);
    syncBrushStyle(fabricCanvasRef.current, tool);
  };

  const getPointerPosition = (canvas, event) => {
    const pointer = canvas.getViewportPoint(event.e);
    return pointer;
  };

  const updateShapeGeometry = (draft, pointer) => {
    if (draft.tool === WHITEBOARD_TOOLS.RECTANGLE) {
      draft.shape.set({
        left: Math.min(draft.originX, pointer.x),
        top: Math.min(draft.originY, pointer.y),
        width: Math.abs(pointer.x - draft.originX),
        height: Math.abs(pointer.y - draft.originY),
      });
    } else if (draft.tool === WHITEBOARD_TOOLS.CIRCLE) {
      const dx = pointer.x - draft.originX;
      const dy = pointer.y - draft.originY;
      draft.shape.set({
        radius: Math.sqrt((dx * dx) + (dy * dy)),
      });
    } else if (draft.tool === WHITEBOARD_TOOLS.LINE) {
      draft.shape.set({
        x2: pointer.x,
        y2: pointer.y,
      });
    }

    draft.shape.setCoords();
  };

  const syncCanvasToolMode = (canvas) => {
    setCanvasTool(canvas, activeToolRef.current);
  };

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) {
      return undefined;
    }

    const fabricCanvas = createCanvas(canvasRef.current);
    fabricCanvasRef.current = fabricCanvas;
    activeToolRef.current = WHITEBOARD_TOOLS.PENCIL;
    setActiveTool(WHITEBOARD_TOOLS.PENCIL);
    setCanvasTool(fabricCanvas, WHITEBOARD_TOOLS.PENCIL);
    syncBrushStyle(fabricCanvas, WHITEBOARD_TOOLS.PENCIL);

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
      const object = serializeObject(e.path);
      onObjectCreatedRef.current?.(object);
    };

    const handleTextChanged = (e) => {
      if (isApplyingRemote.current || !e.target) {
        return;
      }
    };

    const handleMouseDown = (event) => {
      const tool = activeToolRef.current;
      if (
        tool === WHITEBOARD_TOOLS.TEXT &&
        !shapeDraftRef.current
      ) {
        const pointer = getPointerPosition(fabricCanvas, event);
        const text = new Textbox("", {
          objectId: createObjectId(),
          left: pointer.x,
          top: pointer.y,
          width: 180,
          fontSize: 24,
          fill: strokeColorRef.current,
          editable: true,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: true,
          lockScalingX: false,
          lockScalingY: false,
        });

        fabricCanvas.add(text);
        setTool(WHITEBOARD_TOOLS.TEXT);
        fabricCanvas.setActiveObject(text);
        text.enterEditing(event.e);
        text.hiddenTextarea?.focus();
        fabricCanvas.requestRenderAll();
        onObjectCreatedRef.current?.(serializeObject(text));
        return;
      }

      if (
        tool !== WHITEBOARD_TOOLS.RECTANGLE &&
        tool !== WHITEBOARD_TOOLS.CIRCLE &&
        tool !== WHITEBOARD_TOOLS.LINE
      ) {
        return;
      }

      const pointer = getPointerPosition(fabricCanvas, event);
      const baseOptions = {
        objectId: createObjectId(),
        fill: "transparent",
        stroke: strokeColorRef.current,
        strokeWidth: strokeWidthRef.current,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
        lockRotation: true,
      };

      let shape = null;

      if (tool === WHITEBOARD_TOOLS.RECTANGLE) {
        shape = new Rect({
          ...baseOptions,
          originX: "left",
          originY: "top",
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
        });
      } else if (tool === WHITEBOARD_TOOLS.CIRCLE) {
        shape = new Circle({
          ...baseOptions,
          originX: "center",
          originY: "center",
          left: pointer.x,
          top: pointer.y,
          radius: 0,
        });
      } else if (tool === WHITEBOARD_TOOLS.LINE) {
        shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          ...baseOptions,
        });
      }

      if (!shape) {
        return;
      }

      shapeDraftRef.current = {
        tool,
        originX: pointer.x,
        originY: pointer.y,
        shape,
      };

      fabricCanvas.add(shape);
    };

    const handleMouseMove = (event) => {
      const draft = shapeDraftRef.current;

      if (!draft) {
        return;
      }

      const pointer = getPointerPosition(fabricCanvas, event);
      updateShapeGeometry(draft, pointer);
      fabricCanvas.requestRenderAll();
    };

    const handleMouseUp = (event) => {
      const draft = shapeDraftRef.current;

      if (!draft) {
        return;
      }

      const pointer = getPointerPosition(fabricCanvas, event);
      updateShapeGeometry(draft, pointer);
      shapeDraftRef.current = null;

      const isEmptyRectangle =
        draft.tool === WHITEBOARD_TOOLS.RECTANGLE &&
        (!draft.shape.width || !draft.shape.height);
      const isEmptyCircle =
        draft.tool === WHITEBOARD_TOOLS.CIRCLE &&
        !draft.shape.radius;
      const isEmptyLine =
        draft.tool === WHITEBOARD_TOOLS.LINE &&
        draft.shape.x1 === draft.shape.x2 &&
        draft.shape.y1 === draft.shape.y2;

      if (isEmptyRectangle || isEmptyCircle || isEmptyLine) {
        fabricCanvas.remove(draft.shape);
      } else {
        onObjectCreatedRef.current?.(serializeObject(draft.shape));
      }
    };
 
    fabricCanvas.on("path:created", handlePathCreated);
    fabricCanvas.on("text:changed", handleTextChanged);
    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      fabricCanvas.off("path:created", handlePathCreated);
      fabricCanvas.off("text:changed", handleTextChanged);
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
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

    try {
      const object = deserializeObject(data.object);

      if (!object) {
        return;
      }

      canvas.add(object);
      syncCanvasToolMode(canvas);
      canvas.requestRenderAll();
    } finally {
      isApplyingRemote.current = false;
    }
  };

  const applyCanvasClear = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }

    isApplyingRemote.current = true;

    try {
      clearCanvas(canvas);
      syncCanvasToolMode(canvas);
    } finally {
      isApplyingRemote.current = false;
    }
  };

  const loadWhiteboardState = (state) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }

    isApplyingRemote.current = true;

    try {
      clearCanvas(canvas);

      for (const object of state?.objects || []) {
        const canvasObject = deserializeObject(object);

        if (canvasObject) {
          canvas.add(canvasObject);
        }
      }

      syncCanvasToolMode(canvas);
      canvas.requestRenderAll();
    } finally {
      isApplyingRemote.current = false;
    }
  };

  const tools = {
    activeTool,
    activateDrawingTool: () => setTool(WHITEBOARD_TOOLS.PENCIL),
    activateEraserTool: () => setTool(WHITEBOARD_TOOLS.ERASER),
    activateRectangleTool: () => setTool(WHITEBOARD_TOOLS.RECTANGLE),
    activateCircleTool: () => setTool(WHITEBOARD_TOOLS.CIRCLE),
    activateLineTool: () => setTool(WHITEBOARD_TOOLS.LINE),
    activateTextTool: () => setTool(WHITEBOARD_TOOLS.TEXT),
    enableDrawing: () => setTool(WHITEBOARD_TOOLS.PENCIL),
    disableDrawing: () => setTool(activeToolRef.current),
    toggleDrawing: () => setTool(activeToolRef.current),
    setBrushColor: (color) => {
      strokeColorRef.current = color;
      if (activeToolRef.current !== WHITEBOARD_TOOLS.ERASER) {
        setBrushColor(fabricCanvasRef.current, color);
      }
    },
    setBrushWidth: (width) => {
      strokeWidthRef.current = Number(width);
      setBrushWidth(fabricCanvasRef.current, width);
    },
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
