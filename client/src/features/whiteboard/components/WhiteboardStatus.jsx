import { useSelector } from "react-redux";

function WhiteboardStatus() {
  const { connected, loading, error } = useSelector((state) => state.whiteboard);

  let state = "offline";
  let status = "Offline";
  let details = "Whiteboard is offline";

  if (error) {
    state = "error";
    status = "Connection issue";
    details = error;
  } else if (loading) {
    state = "connecting";
    status = "Connecting";
    details = "Connecting to the whiteboard";
  } else if (connected) {
    state = "connected";
    status = "Connected";
    details = "Whiteboard is connected";
  }

  return (
    <div
      className="whiteboard-status"
      data-state={state}
      role="status"
      aria-label={details}
      title={details}
    >
      <span className="whiteboard-status__dot" aria-hidden="true" />
      <span className="whiteboard-status__text">{status}</span>
    </div>
  );
}

export default WhiteboardStatus;
