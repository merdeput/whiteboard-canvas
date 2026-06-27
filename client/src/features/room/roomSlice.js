import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    currentRoom: null,
    joined: false,
    password: "",
};

const roomSlice = createSlice({
    name: "room",

    initialState,

    reducers:{
        setCurrentRoom(state, action) {
            state.currentRoom = action.payload;
            state.joined = true;
            state.password = action.payload.password ?? "";
        },

        clearCurrentRoom(state) {
            state.currentRoom = null;
            state.joined = false;
            state.password = "";
        },
    },
});

export const {
    setCurrentRoom,
    clearCurrentRoom,
} = roomSlice.actions;

export default roomSlice.reducer;