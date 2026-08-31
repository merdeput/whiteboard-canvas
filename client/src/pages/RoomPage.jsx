import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { logoutSession } from "../api/auth.api";
import { exportWhiteboardJson, importWhiteboardJson } from "../api/room.api";
import { logout } from "../features/auth/authSlice";
import RoomHeader from "../features/room/components/RoomHeader";
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

  function downloadFile({ content, filename, type }) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(downloadUrl);
  }

  async function handleExportJson() {
    const whiteboardExport = await exportWhiteboardJson(roomId, sessionPassword);
    downloadFile({
      content: JSON.stringify(whiteboardExport, null, 2),
      filename: `whiteboard-${roomId}.json`,
      type: "application/json",
    });
  }

  async function handleExportPng() {
    const canvas = whiteboard.fabricCanvasRef.current;

    if (!canvas) {
      throw new Error("Whiteboard canvas is not ready.");
    }

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    const pngDataUrl = canvas.toDataURL({
      format: "png",
      multiplier: 1,
      enableRetinaScaling: true,
    });
    const pngResponse = await fetch(pngDataUrl);

    downloadFile({
      content: await pngResponse.blob(),
      filename: `whiteboard-${roomId}.png`,
      type: "image/png",
    });
  }

  async function handleExportSvg() {
    const canvas = whiteboard.fabricCanvasRef.current;

    if (!canvas) {
      throw new Error("Whiteboard canvas is not ready.");
    }

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    downloadFile({
      content: canvas.toSVG(),
      filename: `whiteboard-${roomId}.svg`,
      type: "image/svg+xml",
    });
  }

  async function handleImportJson(whiteboardImport) {
    const whiteboardState = await importWhiteboardJson(roomId, sessionPassword, whiteboardImport);
    whiteboard.tools.loadWhiteboardState(whiteboardState);
  }

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

  const roomName = currentRoom?.id || `Room ${roomId}`;

  return (
    <div className="room-container">
      <RoomHeader
        roomName={roomName}
        roomId={roomId}
        sessionLabel={user?.displayName || null}
        onLogout={handleLogout}
      />

      <main className="room-content">
        <WhiteboardToolbar
          tools={{
            ...whiteboard.tools,
            exportJson: handleExportJson,
            exportPng: handleExportPng,
            exportSvg: handleExportSvg,
            importJson: handleImportJson,
          }}
        />
        <WhiteboardCanvas
          containerRef={whiteboard.containerRef}
          canvasRef={whiteboard.canvasRef}
        />
      </main>
    </div>
  );
}

export default RoomPage;
