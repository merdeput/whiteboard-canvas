import { useSelector } from "react-redux";

function WhiteboardStatus() {
  const { connected, loading, error } = useSelector((state) => state.whiteboard);

  let status = "Disconnected";

  if (error) {
    status = `Error: ${error}`;
  } else if (loading) {
    status = "Loading…";
  } else if (connected) {
    status = "Connected";
  }

  return (
    <div className="whiteboard-status">
      <span className="whiteboard-status__label">Status</span>
      <span className="whiteboard-status__value">{status}</span>
    </div>
  );
}

export default WhiteboardStatus;
