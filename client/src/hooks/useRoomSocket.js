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
  onRemoteObjectUpdate,
  onRemoteObjectDelete,
  onRemoteClear,
  onWhiteboardState,
  onSessionError,
}) {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const onRemoteObjectRef = useRef(onRemoteObject);
  const onRemoteObjectUpdateRef = useRef(onRemoteObjectUpdate);
  const onRemoteObjectDeleteRef = useRef(onRemoteObjectDelete);
  const onRemoteClearRef = useRef(onRemoteClear);
  const onWhiteboardStateRef = useRef(onWhiteboardState);
  const onSessionErrorRef = useRef(onSessionError);

  useEffect(() => {
    onRemoteObjectRef.current = onRemoteObject;
    onRemoteObjectUpdateRef.current = onRemoteObjectUpdate;
    onRemoteObjectDeleteRef.current = onRemoteObjectDelete;
    onRemoteClearRef.current = onRemoteClear;
    onWhiteboardStateRef.current = onWhiteboardState;
    onSessionErrorRef.current = onSessionError;
  }, [
    onRemoteObject,
    onRemoteObjectUpdate,
    onRemoteObjectDelete,
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

    const handleObjectUpdated = (data) => {
      onRemoteObjectUpdateRef.current?.(data);
    };

    const handleObjectsDeleted = (data) => {
      onRemoteObjectDeleteRef.current?.(data);
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
    socket.on(SOCKET_EVENTS.WHITEBOARD_OBJECT_UPDATED, handleObjectUpdated);
    socket.on(SOCKET_EVENTS.WHITEBOARD_OBJECTS_DELETED, handleObjectsDeleted);
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
      socket.off(SOCKET_EVENTS.WHITEBOARD_OBJECT_UPDATED);
      socket.off(SOCKET_EVENTS.WHITEBOARD_OBJECTS_DELETED);
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

  const sendObjectUpdate = (object) => {
    socketRef.current?.emit(SOCKET_EVENTS.WHITEBOARD_UPDATE_OBJECT, {
      roomId,
      object,
    });
  };

  const sendObjectDelete = (objectIds) => {
    socketRef.current?.emit(SOCKET_EVENTS.WHITEBOARD_DELETE_OBJECTS, {
      roomId,
      objectIds,
    });
  };

  const sendClear = () => {
    socketRef.current?.emit(SOCKET_EVENTS.WHITEBOARD_CLEAR, {
      roomId,
    });
  };

  return { sendObject, sendObjectUpdate, sendObjectDelete, sendClear };
}
