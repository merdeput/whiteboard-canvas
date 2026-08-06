import { useRef } from "react";

function WhiteboardToolbar({ tools }) {
  const importInputRef = useRef(null);

  const handleImportButtonClick = () => {
    importInputRef.current?.click();
  };

  const handleImportChange = async (event) => {
    const [file] = event.target.files || [];

    if (!file) {
      return;
    }

    try {
      const fileContent = await file.text();
      const whiteboardImport = JSON.parse(fileContent);
      await tools.importJson?.(whiteboardImport);
    } catch (error) {
      window.alert(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to import whiteboard JSON."
      );
    } finally {
      event.target.value = "";
    }
  };

  const handleExportClick = async () => {
    try {
      await tools.exportJson?.();
    } catch (error) {
      window.alert(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to export whiteboard JSON."
      );
    }
  };

  return (
    <div className="whiteboard-toolbar" aria-label="Whiteboard toolbar">
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
        onClick={tools.activateEraserTool}
      >
        Eraser
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

      <button
        type="button"
        className="whiteboard-toolbar__button"
        onClick={tools.activateTextTool}
      >
        Text
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
        onClick={handleExportClick}
      >
        Export JSON
      </button>

      <button
        type="button"
        className="whiteboard-toolbar__button"
        onClick={handleImportButtonClick}
      >
        Import JSON
      </button>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={handleImportChange}
      />

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
