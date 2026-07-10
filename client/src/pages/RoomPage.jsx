import { useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import RoomHeader from "../features/room/components/RoomHeader";
import WhiteboardStatus from "../features/whiteboard/components/WhiteboardStatus";
import WhiteboardToolbar from "../features/whiteboard/components/WhiteboardToolbar";
import WhiteboardCanvas from "../features/whiteboard/components/WhiteboardCanvas";
import useRoomSocket from "../hooks/useRoomSocket";

import "../styles/RoomPage.css";
import "../styles/Whiteboard.css";

function RoomPage() {
  const { roomId } = useParams();
  const token = useSelector((state) => state.auth.token);
  const currentRoom = useSelector((state) => state.room.currentRoom);
  const { connected, loading, error } = useSelector((state) => state.whiteboard);
  const location = useLocation();
  const password = location.state?.password;

  useRoomSocket({ token, roomId, password });

  let connectionStatus = "Disconnected";

  if (error) {
    connectionStatus = `Error: ${error}`;
  } else if (loading) {
    connectionStatus = "Loading…";
  } else if (connected) {
    connectionStatus = "Connected";
  }

  const roomName = currentRoom?.name || "Untitled Room";

  return (
    <div className="room-container">
      <RoomHeader
        roomName={roomName}
        roomId={roomId}
        connectionStatus={connectionStatus}
      />

      <main className="room-content">
        <WhiteboardStatus />
        <WhiteboardToolbar />
        <WhiteboardCanvas />
      </main>
    </div>
  );
}

export default RoomPage;
