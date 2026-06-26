import { configureStore } from "@reduxjs/toolkit";
import authReducer from ".../features/auth/authSlice"
import roomReducer from ".../features/auth/roomSlice"
import whiteboardReducer from ".../features/auth/whiteboardSlice"
export const store = configureStore({
    reducer: {
        auth: authReducer,
        room: roomReducer,
        whiteboard: whiteboardReducer,
    },
});