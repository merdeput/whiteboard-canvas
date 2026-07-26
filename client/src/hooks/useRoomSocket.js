import { useDispatch } from "react-redux";
import { connectSocket, disconnectSocket} from "../socket/socketClient";
import { SOCKET_EVENTS } from "../socket/socketEvents"

import { setCurrentRoom } from "../features/room/roomSlice";

import {
  clearError,
  setConnected,
  setError,
  setLoading,
} from "../features/whiteboard/whiteboardSlice";
import { useEffect, useRef } from "react";

export default function useRoomSocket({
  token,
  roomId,
  password,
  onRemoteObject,
  onRemoteClear,
  onWhiteboardState,
  onSessionError,
}) {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const onRemoteObjectRef = useRef(onRemoteObject);
  const onRemoteClearRef = useRef(onRemoteClear);
  const onWhiteboardStateRef = useRef(onWhiteboardState);
  const onSessionErrorRef = useRef(onSessionError);

  useEffect(() => {
    onRemoteObjectRef.current = onRemoteObject;
    onRemoteClearRef.current = onRemoteClear;
    onWhiteboardStateRef.current = onWhiteboardState;
    onSessionErrorRef.current = onSessionError;
  }, [
    onRemoteObject,
    onRemoteClear,
    onWhiteboardState,
    onSessionError,
  ]);

  useEffect(() => {
    if (!token || !roomId) return;

    const socket = connectSocket(token);
    socketRef.current = socket;
    dispatch(setLoading(true));

    socket.on("connect", () => {
      dispatch(setConnected(true));
      dispatch(clearError());
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId, password });
    });

    const handleJoined = ({ room }) => {
      dispatch(setCurrentRoom(room));
      dispatch(setLoading(false));
    };

    const handleError = ({ message }) => {
      dispatch(setError(message));
      dispatch(setLoading(false));
      onSessionErrorRef.current?.({
        type: "room_error",
        message,
      });
    };

    const handleWhiteboardState = (state) => {
      onWhiteboardStateRef.current?.(state);
    };

    const handleObjectCreated = (data) => {
      onRemoteObjectRef.current?.(data);
    };

    const handleWhiteboardCleared = (data) => {
      onRemoteClearRef.current?.(data);
    };

    const handleConnectError = (error) => {
      const message = error?.message || "Unable to connect to the room";
      dispatch(setConnected(false));
      dispatch(setError(message));
      dispatch(setLoading(false));
      onSessionErrorRef.current?.({
        type: "connect_error",
        message,
      });
    };

    socket.on(SOCKET_EVENTS.ROOM_JOINED, handleJoined);
    socket.on(SOCKET_EVENTS.ROOM_ERROR, handleError);
    socket.on(SOCKET_EVENTS.WHITEBOARD_STATE, handleWhiteboardState);
    socket.on(SOCKET_EVENTS.WHITEBOARD_OBJECT_CREATED, handleObjectCreated);
    socket.on(SOCKET_EVENTS.WHITEBOARD_CLEARED, handleWhiteboardCleared);
    socket.on("connect_error", handleConnectError);

    socket.on("disconnect", () => {
      dispatch(setConnected(false));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off(SOCKET_EVENTS.ROOM_JOINED);
      socket.off(SOCKET_EVENTS.ROOM_ERROR);
      socket.off(SOCKET_EVENTS.WHITEBOARD_STATE);
      socket.off(SOCKET_EVENTS.WHITEBOARD_OBJECT_CREATED);
      socket.off(SOCKET_EVENTS.WHITEBOARD_CLEARED);
      socket.off("connect_error");

      disconnectSocket();
      socketRef.current = null;
    };
  }, [dispatch, token, roomId, password]);

  const sendObject = (object) => {
    socketRef.current?.emit(SOCKET_EVENTS.WHITEBOARD_DRAW_OBJECT, {
      roomId,
      object,
    });
  };

  const sendClear = () => {
    socketRef.current?.emit(SOCKET_EVENTS.WHITEBOARD_CLEAR, {
      roomId,
    });
  };

  return { sendObject, sendClear };
}
