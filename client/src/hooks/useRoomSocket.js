import { useDispatch } from "react-redux";
import { connectSocket, disconnectSocket} from "../socket/socketClient";
import { SOCKET_EVENTS } from "../socket/socketEvents"

import { setCurrentRoom } from "../features/room/roomSlice";

import { setConnected, setError, setLoading, } from "../features/whiteboard/whiteboardSlice"
import { useEffect } from "react";

export default function useRoomSocket({ token, roomId, password}) {
    const dispatch = useDispatch();
    useEffect( ()=> {
        if(!token || !roomId) return;
        const socket = connectSocket(token);
        
        socket.on("connect", () => {
            dispatch(setConnected(true));
            socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId, password });
        });

        const handleJoined = ({ room }) => {
            dispatch(setCurrentRoom(room));
            dispatch(setLoading(false));
        }

        const handleError = ({ message }) => {
            dispatch(setError(message));
        };

        const handleWhiteboardState = (state) => {
            // TODO
            console.log("Whiteboard snapshot:", state);
        };

        socket.on(SOCKET_EVENTS.ROOM_JOINED, handleJoined);
        socket.on(SOCKET_EVENTS.ROOM_ERROR, handleError);
        socket.on(SOCKET_EVENTS.WHITEBOARD_STATE, handleWhiteboardState);

        socket.on("disconnect", () => {
            dispatch(setConnected(false));
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off(SOCKET_EVENTS.ROOM_JOINED);
            socket.off(SOCKET_EVENTS.ROOM_ERROR);
            socket.off(SOCKET_EVENTS.WHITEBOARD_STATE);

            disconnectSocket();
        };
    }, [dispatch, token, roomId, password]);
}