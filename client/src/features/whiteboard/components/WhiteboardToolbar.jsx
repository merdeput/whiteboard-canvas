function WhiteboardToolbar({ tools }) {
  return (
    <div className="whiteboard-toolbar" aria-label="Whiteboard toolbar">
      <button
        type="button"
        className="whiteboard-toolbar__button"
        onClick={tools.activateSelectionTool}
      >
        Select
      </button>

      <button
        type="button"
        className="whiteboard-toolbar__button"
        onClick={tools.activateDrawingTool}
      >
        Pencil
      </button>

      <button
        type="button"
        className="whiteboard-toolbar__button"
        onClick={tools.activateRectangleTool}
      >
        Rectangle
      </button>

      <button
        type="button"
        className="whiteboard-toolbar__button"
        onClick={tools.activateCircleTool}
      >
        Circle
      </button>

      <button
        type="button"
        className="whiteboard-toolbar__button"
        onClick={tools.activateLineTool}
      >
        Line
      </button>

      <label className="whiteboard-toolbar__control">
        <span>Color</span>
        <input
          type="color"
          defaultValue="#000000"
          onChange={(e) => tools.setBrushColor(e.target.value)}
        />
      </label>

      <label className="whiteboard-toolbar__control">
        <span>Width</span>
        <input
          type="range"
          min={1}
          max={20}
          defaultValue={3}
          onChange={(e) => tools.setBrushWidth(Number(e.target.value))}
        />
      </label>

      <button
        type="button"
        className="whiteboard-toolbar__button"
        onClick={tools.clearCanvas}
      >
        Clear
      </button>
    </div>
  );
}

export default WhiteboardToolbar;
