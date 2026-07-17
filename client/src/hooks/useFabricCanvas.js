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
  deleteSelectedObjects,
  clearCanvas,
} from "../features/whiteboard/fabric/fabricTools";

function useFabricCanvas({
  onObjectCreated,
  onObjectModified,
  onObjectsDeleted,
  onClear,
} = {}) {
  const [activeTool, setActiveTool] = useState(WHITEBOARD_TOOLS.SELECT);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const activeToolRef = useRef(WHITEBOARD_TOOLS.SELECT);
  const shapeDraftRef = useRef(null);
  const strokeColorRef = useRef("#000000");
  const strokeWidthRef = useRef(3);
  const isApplyingRemote = useRef(false);
  const onObjectCreatedRef = useRef(onObjectCreated);
  const onObjectModifiedRef = useRef(onObjectModified);
  const onObjectsDeletedRef = useRef(onObjectsDeleted);
  const onClearRef = useRef(onClear);

  useEffect(() => {
    onObjectCreatedRef.current = onObjectCreated;
    onObjectModifiedRef.current = onObjectModified;
    onObjectsDeletedRef.current = onObjectsDeleted;
    onClearRef.current = onClear;
  }, [onObjectCreated, onObjectModified, onObjectsDeleted, onClear]);

  const setTool = (tool) => {
    activeToolRef.current = tool;
    setActiveTool(tool);
    setCanvasTool(fabricCanvasRef.current, tool);
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
    setTool(WHITEBOARD_TOOLS.SELECT);

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

    const handleObjectModified = (e) => {
      if (isApplyingRemote.current || !e.target) {
        return;
      }

      const object = serializeObject(e.target);
      onObjectModifiedRef.current?.(object);
    };

    const handleTextChanged = (e) => {
      if (isApplyingRemote.current || !e.target) {
        return;
      }

      const object = serializeObject(e.target);
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
        setTool(WHITEBOARD_TOOLS.SELECT);
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

      setTool(WHITEBOARD_TOOLS.SELECT);
    };
 
    fabricCanvas.on("path:created", handlePathCreated);
    fabricCanvas.on("object:modified", handleObjectModified);
    fabricCanvas.on("text:changed", handleTextChanged);
    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      fabricCanvas.off("path:created", handlePathCreated);
      fabricCanvas.off("object:modified", handleObjectModified);
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

    try {
      const updatedObject = deserializeObject(data.object);

      if (!updatedObject) {
        return;
      }

      canvas.remove(existingObject);
      canvas.add(updatedObject);
      syncCanvasToolMode(canvas);
      canvas.requestRenderAll();
    } finally {
      isApplyingRemote.current = false;
    }
  };

  const applyRemoteObjectDelete = (data) => {
    const canvas = fabricCanvasRef.current;
    const objectIds = data?.objectIds || [];

    if (!canvas || !objectIds.length) {
      return;
    }

    isApplyingRemote.current = true;

    try {
      for (const objectId of objectIds) {
        const existingObject = canvas.getObjects().find((object) => object.objectId === objectId);

        if (existingObject) {
          canvas.remove(existingObject);
        }
      }

      canvas.discardActiveObject();
      syncCanvasToolMode(canvas);
      canvas.requestRenderAll();
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
    activateSelectionTool: () => setTool(WHITEBOARD_TOOLS.SELECT),
    activateRectangleTool: () => setTool(WHITEBOARD_TOOLS.RECTANGLE),
    activateCircleTool: () => setTool(WHITEBOARD_TOOLS.CIRCLE),
    activateLineTool: () => setTool(WHITEBOARD_TOOLS.LINE),
    activateTextTool: () => setTool(WHITEBOARD_TOOLS.TEXT),
    enableDrawing: () => setTool(WHITEBOARD_TOOLS.PENCIL),
    disableDrawing: () => setTool(WHITEBOARD_TOOLS.SELECT),
    toggleDrawing: () =>
      setTool(
        activeToolRef.current === WHITEBOARD_TOOLS.PENCIL
          ? WHITEBOARD_TOOLS.SELECT
          : WHITEBOARD_TOOLS.PENCIL
      ),
    setBrushColor: (color) => {
      strokeColorRef.current = color;
      setBrushColor(fabricCanvasRef.current, color);
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
