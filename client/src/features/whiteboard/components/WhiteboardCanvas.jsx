function WhiteboardCanvas({
  containerRef,
  canvasRef,
}) {
  return (
    <div
      ref={containerRef}
      className="whiteboard-canvas"
    >
      <canvas
        ref={canvasRef}
        className="whiteboard-canvas__surface"
      />
    </div>
  );
}

export default WhiteboardCanvas;
