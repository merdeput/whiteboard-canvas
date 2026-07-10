const TOOLS = ["Pencil", "Eraser", "Rectangle", "Circle", "Text", "Clear"];

function WhiteboardToolbar() {
  return (
    <div className="whiteboard-toolbar" aria-label="Whiteboard toolbar">
      {TOOLS.map((tool) => (
        <button
          key={tool}
          type="button"
          className="whiteboard-toolbar__button"
          disabled
        >
          {tool}
        </button>
      ))}
    </div>
  );
}

export default WhiteboardToolbar;
