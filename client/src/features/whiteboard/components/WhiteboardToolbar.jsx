import { useEffect, useRef, useState } from "react";
import {
  Circle,
  EllipsisVertical,
  Eraser,
  FileCode2,
  FileJson,
  ImageDown,
  Minus,
  Pencil,
  RectangleHorizontal,
  Redo2,
  SlidersHorizontal,
  Trash2,
  Type,
  Undo2,
  Upload,
} from "lucide-react";
import { WHITEBOARD_TOOLS } from "../fabric/fabricTools";
import WhiteboardStatus from "./WhiteboardStatus";

const TOOL_GROUPS = [
  {
    label: "Drawing tools",
    tools: [
      { tool: WHITEBOARD_TOOLS.PENCIL, label: "Pencil", activate: "activateDrawingTool", Icon: Pencil },
      { tool: WHITEBOARD_TOOLS.ERASER, label: "Eraser", activate: "activateEraserTool", Icon: Eraser },
      { tool: WHITEBOARD_TOOLS.TEXT, label: "Text", activate: "activateTextTool", Icon: Type },
    ],
  },
  {
    label: "Shape tools",
    tools: [
      { tool: WHITEBOARD_TOOLS.RECTANGLE, label: "Rectangle", activate: "activateRectangleTool", Icon: RectangleHorizontal },
      { tool: WHITEBOARD_TOOLS.CIRCLE, label: "Circle", activate: "activateCircleTool", Icon: Circle },
      { tool: WHITEBOARD_TOOLS.LINE, label: "Line", activate: "activateLineTool", Icon: Minus },
    ],
  },
];

function WhiteboardToolbar({ tools }) {
  const importInputRef = useRef(null);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const getMenuItems = () =>
      Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') || []);

    getMenuItems()[0]?.focus();

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        return;
      }

      const menuItems = getMenuItems();
      const activeIndex = menuItems.indexOf(document.activeElement);
      let nextIndex;

      if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = menuItems.length - 1;
      } else if (event.key === "ArrowDown") {
        nextIndex = (activeIndex + 1) % menuItems.length;
      } else {
        nextIndex = (activeIndex - 1 + menuItems.length) % menuItems.length;
      }

      event.preventDefault();
      menuItems[nextIndex]?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleImportButtonClick = () => {
    setIsMenuOpen(false);
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
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to import whiteboard JSON."
      );
    } finally {
      event.target.value = "";
    }
  };

  const handleExportClick = async (format) => {
    setIsMenuOpen(false);

    try {
      if (format === "png") {
        await tools.exportPng?.();
        return;
      }

      if (format === "svg") {
        await tools.exportSvg?.();
        return;
      }

      await tools.exportJson?.();
    } catch (error) {
      window.alert(
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to export whiteboard."
      );
    }
  };

  const handleClear = () => {
    setIsMenuOpen(false);
    tools.clearCanvas?.();
  };

  const showHistory = Boolean(tools.undo || tools.redo);

  return (
    <div className="whiteboard-toolbar" role="toolbar" aria-label="Whiteboard toolbar">
      <div className="whiteboard-toolbar__scroll-area">
        {TOOL_GROUPS.map((group) => (
          <div key={group.label} className="whiteboard-toolbar__group" role="group" aria-label={group.label}>
            {group.tools.map(({ tool, label, activate, Icon }) => (
              <button
                key={tool}
                type="button"
                className="whiteboard-toolbar__icon-button"
                aria-label={label}
                aria-pressed={tools.activeTool === tool}
                title={label}
                onClick={tools[activate]}
              >
                <Icon aria-hidden="true" size={20} strokeWidth={2} />
              </button>
            ))}
          </div>
        ))}

        <div
          className="whiteboard-toolbar__group whiteboard-toolbar__formatting"
          role="group"
          aria-label="Formatting"
        >
          <label className="whiteboard-toolbar__color-control" title="Color">
            <span className="whiteboard-toolbar__sr-only">Color</span>
            <input
              type="color"
              defaultValue="#000000"
              aria-label="Color"
              onChange={(event) => tools.setBrushColor(event.target.value)}
            />
          </label>

          <label className="whiteboard-toolbar__width-control" title="Stroke width">
            <SlidersHorizontal aria-hidden="true" size={18} strokeWidth={2} />
            <span className="whiteboard-toolbar__sr-only">Stroke width</span>
            <input
              type="range"
              min={1}
              max={20}
              defaultValue={3}
              aria-label="Stroke width"
              onChange={(event) => tools.setBrushWidth(Number(event.target.value))}
            />
          </label>
        </div>

        {showHistory ? (
          <div className="whiteboard-toolbar__group" role="group" aria-label="History">
            <button
              type="button"
              className="whiteboard-toolbar__icon-button"
              aria-label="Undo"
              title="Undo"
              disabled={!tools.undo || tools.canUndo === false}
              onClick={tools.undo}
            >
              <Undo2 aria-hidden="true" size={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="whiteboard-toolbar__icon-button"
              aria-label="Redo"
              title="Redo"
              disabled={!tools.redo || tools.canRedo === false}
              onClick={tools.redo}
            >
              <Redo2 aria-hidden="true" size={20} strokeWidth={2} />
            </button>
          </div>
        ) : null}
      </div>

      <WhiteboardStatus />

      <div className="whiteboard-toolbar__menu" ref={menuRef}>
        <button
          ref={menuButtonRef}
          type="button"
          className="whiteboard-toolbar__icon-button"
          aria-label="Board actions"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          title="Board actions"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          <EllipsisVertical aria-hidden="true" size={20} strokeWidth={2} />
        </button>

        {isMenuOpen ? (
          <div className="whiteboard-toolbar__menu-panel" role="menu" aria-label="Board actions">
            <button type="button" role="menuitem" onClick={handleImportButtonClick}>
              <Upload aria-hidden="true" size={18} />
              Import JSON
            </button>
            <button type="button" role="menuitem" onClick={() => handleExportClick("json")}>
              <FileJson aria-hidden="true" size={18} />
              Export JSON
            </button>
            <button type="button" role="menuitem" onClick={() => handleExportClick("png")}>
              <ImageDown aria-hidden="true" size={18} />
              Export PNG
            </button>
            <button type="button" role="menuitem" onClick={() => handleExportClick("svg")}>
              <FileCode2 aria-hidden="true" size={18} />
              Export SVG
            </button>
            <div className="whiteboard-toolbar__menu-separator" role="separator" />
            <button
              type="button"
              role="menuitem"
              className="whiteboard-toolbar__menu-danger"
              onClick={handleClear}
            >
              <Trash2 aria-hidden="true" size={18} />
              Clear board
            </button>
          </div>
        ) : null}
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={handleImportChange}
      />
    </div>
  );
}

export default WhiteboardToolbar;
