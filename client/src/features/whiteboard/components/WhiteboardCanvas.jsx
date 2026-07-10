import useFabricCanvas from "../../../hooks/useFabricCanvas";

function WhiteboardCanvas() {
  const { containerRef, canvasRef } = useFabricCanvas();

  return (
    <div ref={containerRef} className="whiteboard-canvas">
      <canvas ref={canvasRef} className="whiteboard-canvas__surface" />
    </div>
  );
}

export default WhiteboardCanvas;
