import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, Line, Point, Rect, Textbox } from "fabric";
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

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

function clampZoom(zoom) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

function useFabricCanvas({
  onObjectCreated,
  onObjectModified,
  onObjectsDeleted,
  onClear,
} = {}) {
  const [activeTool, setActiveTool] = useState(WHITEBOARD_TOOLS.PENCIL);
  const [zoomPercentage, setZoomPercentage] = useState(100);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const activeToolRef = useRef(WHITEBOARD_TOOLS.PENCIL);
  const shapeDraftRef = useRef(null);
  const strokeColorRef = useRef("#000000");
  const strokeWidthRef = useRef(3);
  const isSpacePressedRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef(null);
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

  const syncBrushStyle = useCallback((canvas, tool = activeToolRef.current) => {
    if (!canvas) {
      return;
    }

    setBrushWidth(canvas, strokeWidthRef.current);

    if (tool === WHITEBOARD_TOOLS.ERASER) {
      setBrushColor(canvas, "#ffffff");
      return;
    }

    setBrushColor(canvas, strokeColorRef.current);
  }, []);

  const applyTool = useCallback((canvas, tool) => {
    activeToolRef.current = tool;
    setActiveTool(tool);
    setCanvasTool(canvas, tool);
    syncBrushStyle(canvas, tool);
  }, [syncBrushStyle]);

  const setTool = useCallback((tool) => {
    applyTool(fabricCanvasRef.current, tool);
  }, [applyTool]);

  const setCanvasZoom = useCallback((canvas, zoom, point = null) => {
    if (!canvas) {
      return;
    }

    const nextZoom = clampZoom(zoom);
    const zoomPoint = point || new Point(canvas.width / 2, canvas.height / 2);
    canvas.zoomToPoint(zoomPoint, nextZoom);
    setZoomPercentage(Math.round(nextZoom * 100));
  }, []);

  const resetView = useCallback(() => {
    const canvas = fabricCanvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoomPercentage(100);
  }, []);

  const fitToContent = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const objects = canvas?.getObjects() || [];

    if (!canvas || !objects.length) {
      resetView();
      return;
    }

    const bounds = objects.map((object) => object.getBoundingRect());
    const minX = Math.min(...bounds.map((bound) => bound.left));
    const minY = Math.min(...bounds.map((bound) => bound.top));
    const maxX = Math.max(...bounds.map((bound) => bound.left + bound.width));
    const maxY = Math.max(...bounds.map((bound) => bound.top + bound.height));
    const contentWidth = Math.max(maxX - minX, 1);
    const contentHeight = Math.max(maxY - minY, 1);
    const padding = 48;
    const availableWidth = Math.max(canvas.width - padding * 2, 1);
    const availableHeight = Math.max(canvas.height - padding * 2, 1);
    const zoom = clampZoom(
      Math.min(availableWidth / contentWidth, availableHeight / contentHeight)
    );
    const offsetX = (canvas.width - contentWidth * zoom) / 2 - minX * zoom;
    const offsetY = (canvas.height - contentHeight * zoom) / 2 - minY * zoom;

    canvas.setViewportTransform([zoom, 0, 0, zoom, offsetX, offsetY]);
    setZoomPercentage(Math.round(zoom * 100));
  }, [resetView]);

  const getPointerPosition = (canvas, event) => {
    const pointer = canvas.getScenePoint(event.e);
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

    if (isSpacePressedRef.current) {
      canvas.setCursor(isPanningRef.current ? "grabbing" : "grab");
    }
  };

  const upsertCanvasObject = (canvas, objectData) => {
    const updatedObject = deserializeObject(objectData);

    if (!updatedObject) {
      return false;
    }

    const existingIndex = canvas
      .getObjects()
      .findIndex((object) => object.objectId === objectData.objectId);

    if (existingIndex === -1) {
      canvas.add(updatedObject);
      return true;
    }

    const [existingObject] = canvas.getObjects().slice(existingIndex, existingIndex + 1);
    canvas.remove(existingObject);
    canvas.insertAt(existingIndex, updatedObject);
    return true;
  };

  const deleteCanvasObjects = (canvas, objectIds) => {
    const deletedObjectIds = [];

    for (const objectId of objectIds) {
      const existingObject = canvas.getObjects().find((object) => object.objectId === objectId);

      if (!existingObject) {
        continue;
      }

      canvas.remove(existingObject);
      deletedObjectIds.push(objectId);
    }

    if (deletedObjectIds.length) {
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }

    return deletedObjectIds;
  };

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) {
      return undefined;
    }

    const fabricCanvas = createCanvas(canvasRef.current);
    fabricCanvasRef.current = fabricCanvas;
    applyTool(fabricCanvas, WHITEBOARD_TOOLS.PENCIL);

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

      onObjectModifiedRef.current?.(serializeObject(e.target));
    };

    const handleTextEditingExited = (e) => {
      if (isApplyingRemote.current || !e.target) {
        return;
      }

      onObjectModifiedRef.current?.(serializeObject(e.target));
    };

    const handleObjectModified = (e) => {
      if (isApplyingRemote.current || !e.target?.objectId) {
        return;
      }

      onObjectModifiedRef.current?.(serializeObject(e.target));
    };

    const isEditableTarget = (target) => {
      const targetTagName = target?.tagName;

      return (
        target?.isContentEditable ||
        targetTagName === "INPUT" ||
        targetTagName === "TEXTAREA" ||
        targetTagName === "SELECT" ||
        targetTagName === "BUTTON" ||
        targetTagName === "A"
      );
    };

    const restoreToolAfterPanning = () => {
      isPanningRef.current = false;
      lastPanPointRef.current = null;
      syncCanvasToolMode(fabricCanvas);
    };

    const handleKeyDown = (event) => {
      const activeObject = fabricCanvas.getActiveObject();

      if (
        event.code === "Space" &&
        !event.repeat &&
        !isEditableTarget(event.target) &&
        !activeObject?.isEditing
      ) {
        isSpacePressedRef.current = true;
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.setCursor("grab");
        event.preventDefault();
        return;
      }

      if (activeToolRef.current !== WHITEBOARD_TOOLS.TEXT) {
        return;
      }

      const isDeleteKey = event.key === "Delete" || event.key === "Backspace";

      if (!isDeleteKey || isEditableTarget(event.target)) {
        return;
      }

      if (!activeObject?.objectId || activeObject.isEditing || activeObject.type !== "textbox") {
        return;
      }

      const deletedObjectIds = deleteCanvasObjects(fabricCanvas, [activeObject.objectId]);

      if (!deletedObjectIds.length) {
        return;
      }

      event.preventDefault();
      onObjectsDeletedRef.current?.(deletedObjectIds);
    };

    const handleKeyUp = (event) => {
      if (event.code !== "Space" || !isSpacePressedRef.current) {
        return;
      }

      isSpacePressedRef.current = false;

      if (!isPanningRef.current) {
        restoreToolAfterPanning();
      }
    };

    const handleWindowBlur = () => {
      isSpacePressedRef.current = false;
      restoreToolAfterPanning();
    };

    const handleMouseWheel = (event) => {
      const delta = event.e.deltaY;
      const nextZoom = fabricCanvas.getZoom() * Math.pow(0.999, delta);
      const zoomPoint = fabricCanvas.getViewportPoint(event.e);

      setCanvasZoom(fabricCanvas, nextZoom, zoomPoint);
      event.e.preventDefault();
      event.e.stopPropagation();
    };

    const handleMouseDown = (event) => {
      if (isSpacePressedRef.current) {
        isPanningRef.current = true;
        lastPanPointRef.current = {
          x: event.e.clientX,
          y: event.e.clientY,
        };
        fabricCanvas.setCursor("grabbing");
        event.e.preventDefault();
        return;
      }

      const tool = activeToolRef.current;
      if (
        tool === WHITEBOARD_TOOLS.TEXT &&
        !shapeDraftRef.current
      ) {
        if (event.target?.type === "textbox") {
          return;
        }

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
          lockRotation: false,
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
      if (isPanningRef.current && lastPanPointRef.current) {
        const viewportTransform = [...fabricCanvas.viewportTransform];
        const nextPoint = {
          x: event.e.clientX,
          y: event.e.clientY,
        };

        viewportTransform[4] += nextPoint.x - lastPanPointRef.current.x;
        viewportTransform[5] += nextPoint.y - lastPanPointRef.current.y;
        lastPanPointRef.current = nextPoint;
        fabricCanvas.setViewportTransform(viewportTransform);
        return;
      }

      const draft = shapeDraftRef.current;

      if (!draft) {
        return;
      }

      const pointer = getPointerPosition(fabricCanvas, event);
      updateShapeGeometry(draft, pointer);
      fabricCanvas.requestRenderAll();
    };

    const handleMouseUp = (event) => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        lastPanPointRef.current = null;
        fabricCanvas.setCursor(isSpacePressedRef.current ? "grab" : "default");

        if (!isSpacePressedRef.current) {
          syncCanvasToolMode(fabricCanvas);
        }

        return;
      }

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
    fabricCanvas.on("text:editing:exited", handleTextEditingExited);
    fabricCanvas.on("object:modified", handleObjectModified);
    fabricCanvas.on("mouse:wheel", handleMouseWheel);
    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      fabricCanvas.off("path:created", handlePathCreated);
      fabricCanvas.off("text:changed", handleTextChanged);
      fabricCanvas.off("text:editing:exited", handleTextEditingExited);
      fabricCanvas.off("object:modified", handleObjectModified);
      fabricCanvas.off("mouse:wheel", handleMouseWheel);
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [applyTool, setCanvasZoom, setTool]);

  const addRemoteObject = (data) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !data?.object) {
      return;
    }

    isApplyingRemote.current = true;

    try {
      if (!upsertCanvasObject(canvas, data.object)) {
        return;
      }

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

    isApplyingRemote.current = true;

    try {
      upsertCanvasObject(canvas, data.object);
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
      deleteCanvasObjects(canvas, objectIds);
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
    zoomPercentage,
    canZoomOut: zoomPercentage > MIN_ZOOM * 100,
    canZoomIn: zoomPercentage < MAX_ZOOM * 100,
    activateDrawingTool: () => setTool(WHITEBOARD_TOOLS.PENCIL),
    activateEraserTool: () => setTool(WHITEBOARD_TOOLS.ERASER),
    activateRectangleTool: () => setTool(WHITEBOARD_TOOLS.RECTANGLE),
    activateCircleTool: () => setTool(WHITEBOARD_TOOLS.CIRCLE),
    activateLineTool: () => setTool(WHITEBOARD_TOOLS.LINE),
    activateTextTool: () => setTool(WHITEBOARD_TOOLS.TEXT),
    setBrushColor: (color) => {
      strokeColorRef.current = color;

      const activeObject = fabricCanvasRef.current?.getActiveObject();

      if (
        activeToolRef.current === WHITEBOARD_TOOLS.TEXT &&
        activeObject?.type === "textbox"
      ) {
        activeObject.set("fill", color);
        activeObject.setCoords();
        fabricCanvasRef.current?.requestRenderAll();
        onObjectModifiedRef.current?.(serializeObject(activeObject));
      }

      if (activeToolRef.current !== WHITEBOARD_TOOLS.ERASER) {
        setBrushColor(fabricCanvasRef.current, color);
      }
    },
    setBrushWidth: (width) => {
      strokeWidthRef.current = Number(width);
      setBrushWidth(fabricCanvasRef.current, width);
    },
    zoomOut: () => {
      const canvas = fabricCanvasRef.current;
      setCanvasZoom(canvas, (canvas?.getZoom() || 1) - ZOOM_STEP);
    },
    zoomIn: () => {
      const canvas = fabricCanvasRef.current;
      setCanvasZoom(canvas, (canvas?.getZoom() || 1) + ZOOM_STEP);
    },
    resetView,
    fitToContent,
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
