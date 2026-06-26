import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice"
import roomReducer from "../features/room/roomSlice"
import whiteboardReducer from "../features/whiteboard/whiteboardSlice"

export const store = configureStore({
    reducer: {
        auth: authReducer,
        room: roomReducer,
        whiteboard: whiteboardReducer,
    },
});