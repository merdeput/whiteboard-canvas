import { useEffect, useRef } from "react";
import createCanvas from "../features/whiteboard/fabric/createCanvas";
import resizeCanvas from "../features/whiteboard/fabric/resizeCanvas";
import {
  enableDrawing,
  disableDrawing,
  toggleDrawing,
  setBrushColor,
  setBrushWidth,
  clearCanvas,
} from "../features/whiteboard/fabric/fabricTools";

function useFabricCanvas() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

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

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  const tools = {
    enableDrawing: () => enableDrawing(fabricCanvasRef.current),
    disableDrawing: () => disableDrawing(fabricCanvasRef.current),
    toggleDrawing: () => toggleDrawing(fabricCanvasRef.current),
    setBrushColor: (color) => setBrushColor(fabricCanvasRef.current, color),
    setBrushWidth: (width) => setBrushWidth(fabricCanvasRef.current, width),
    clearCanvas: () => clearCanvas(fabricCanvasRef.current),
  };

  return {
    containerRef,
    canvasRef,
    fabricCanvasRef,
    tools,
  };
}

export default useFabricCanvas;