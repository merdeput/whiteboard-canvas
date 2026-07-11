import { useDispatch } from "react-redux";
import { connectSocket, disconnectSocket} from "../socket/socketClient";
import { SOCKET_EVENTS } from "../socket/socketEvents"

import { setCurrentRoom } from "../features/room/roomSlice";

import { setConnected, setError, setLoading } from "../features/whiteboard/whiteboardSlice";
import { useEffect, useRef } from "react";

export default function useRoomSocket({
  token,
  roomId,
  password,
  onRemotePath,
  onRemoteClear,
  onWhiteboardState,
}) {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const onRemotePathRef = useRef(onRemotePath);
  const onRemoteClearRef = useRef(onRemoteClear);
  const onWhiteboardStateRef = useRef(onWhiteboardState);

  onRemotePathRef.current = onRemotePath;
  onRemoteClearRef.current = onRemoteClear;
  onWhiteboardStateRef.current = onWhiteboardState;

  useEffect(() => {
    if (!token || !roomId) return;

    const socket = connectSocket(token);
    socketRef.current = socket;
    dispatch(setLoading(true));

    socket.on("connect", () => {
      dispatch(setConnected(true));
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId, password });
    });

    const handleJoined = ({ room }) => {
      dispatch(setCurrentRoom(room));
      dispatch(setLoading(false));
    };

    const handleError = ({ message }) => {
      dispatch(setError(message));
      dispatch(setLoading(false));
    };

    const handleWhiteboardState = (state) => {
      onWhiteboardStateRef.current?.(state);
    };

    const handlePathCreated = (data) => {
      onRemotePathRef.current?.(data);
    };

    const handleWhiteboardCleared = (data) => {
      onRemoteClearRef.current?.(data);
    };

    socket.on(SOCKET_EVENTS.ROOM_JOINED, handleJoined);
    socket.on(SOCKET_EVENTS.ROOM_ERROR, handleError);
    socket.on(SOCKET_EVENTS.WHITEBOARD_STATE, handleWhiteboardState);
    socket.on(SOCKET_EVENTS.WHITEBOARD_PATH_CREATED, handlePathCreated);
    socket.on(SOCKET_EVENTS.WHITEBOARD_CLEARED, handleWhiteboardCleared);

    socket.on("disconnect", () => {
      dispatch(setConnected(false));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off(SOCKET_EVENTS.ROOM_JOINED);
      socket.off(SOCKET_EVENTS.ROOM_ERROR);
      socket.off(SOCKET_EVENTS.WHITEBOARD_STATE);
      socket.off(SOCKET_EVENTS.WHITEBOARD_PATH_CREATED);
      socket.off(SOCKET_EVENTS.WHITEBOARD_CLEARED);

      disconnectSocket();
      socketRef.current = null;
    };
  }, [dispatch, token, roomId, password]);

  const sendPath = (path) => {
    socketRef.current?.emit(SOCKET_EVENTS.WHITEBOARD_DRAW_PATH, {
      roomId,
      path,
    });
  };

  const sendClear = () => {
    socketRef.current?.emit(SOCKET_EVENTS.WHITEBOARD_CLEAR, {
      roomId,
    });
  };

  return { sendPath, sendClear };
}
