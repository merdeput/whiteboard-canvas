import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { logoutSession } from "../api/auth.api";
import { logout } from "../features/auth/authSlice";
import RoomHeader from "../features/room/components/RoomHeader";
import WhiteboardStatus from "../features/whiteboard/components/WhiteboardStatus";
import WhiteboardToolbar from "../features/whiteboard/components/WhiteboardToolbar";
import WhiteboardCanvas from "../features/whiteboard/components/WhiteboardCanvas";
import useFabricCanvas from "../hooks/useFabricCanvas";
import useRoomSocket from "../hooks/useRoomSocket";
import { disconnectSocket } from "../socket/socketClient";
import { clearStoredRoomSession } from "../utils/sessionStorage";

import "../styles/RoomPage.css";
import "../styles/Whiteboard.css";

function RoomPage({ sessionPassword = "", onSessionError }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const currentRoom = useSelector((state) => state.room.currentRoom);
  const { connected, loading, error } = useSelector((state) => state.whiteboard);

  const sendObjectRef = useRef(() => {});
  const sendObjectUpdateRef = useRef(() => {});
  const sendObjectDeleteRef = useRef(() => {});
  const sendClearRef = useRef(() => {});
  const whiteboard = useFabricCanvas({
    onObjectCreated: (data) => sendObjectRef.current(data),
    onObjectModified: (data) => sendObjectUpdateRef.current(data),
    onObjectsDeleted: (data) => sendObjectDeleteRef.current(data),
    onClear: () => sendClearRef.current(),
  });
  
  const { sendObject, sendObjectUpdate, sendObjectDelete, sendClear } = useRoomSocket({
    token,
    roomId,
    password: sessionPassword,
    onRemoteObject: whiteboard.tools.addRemoteObject,
    onRemoteObjectUpdate: whiteboard.tools.applyRemoteObjectUpdate,
    onRemoteObjectDelete: whiteboard.tools.applyRemoteObjectDelete,
    onRemoteClear: whiteboard.tools.applyCanvasClear,
    onWhiteboardState: whiteboard.tools.loadWhiteboardState,
    onSessionError,
  });

  useEffect(() => {
    sendObjectRef.current = sendObject;
    sendObjectUpdateRef.current = sendObjectUpdate;
    sendObjectDeleteRef.current = sendObjectDelete;
    sendClearRef.current = sendClear;
  }, [sendObject, sendObjectUpdate, sendObjectDelete, sendClear]);

  async function handleLogout() {
    try {
      await logoutSession();
    } catch {
      // Local teardown is the important step for stateless JWT sessions.
    } finally {
      disconnectSocket();
      clearStoredRoomSession(roomId);
      dispatch(logout());
      navigate("/", {
        replace: true,
        state: {
          banner: "Session ended.",
        },
      });
    }
  }

  let connectionStatus = "Disconnected";

  if (error) {
    connectionStatus = `Error: ${error}`;
  } else if (loading) {
    connectionStatus = "Loading...";
  } else if (connected) {
    connectionStatus = "Connected";
  }

  const roomName = currentRoom?.id || `Room ${roomId}`;

  return (
    <div className="room-container">
      <RoomHeader
        roomName={roomName}
        roomId={roomId}
        connectionStatus={connectionStatus}
        sessionLabel={user?.displayName || null}
        onLogout={handleLogout}
      />

      <main className="room-content">
        <WhiteboardStatus />
        <WhiteboardToolbar tools={whiteboard.tools} />
        <WhiteboardCanvas
          containerRef={whiteboard.containerRef}
          canvasRef={whiteboard.canvasRef}
        />
      </main>
    </div>
  );
}

export default RoomPage;
