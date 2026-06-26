import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    currentRoom: null,
    joined: false,
};

const roomSlice = createSlice({
    name: "room",

    initialState,

    reducers:{
        setCurrentRoom(state, action) {
            state.currentRoom = action.payload;
            state.joined = true;
        },

        clearCurrentRoom(state) {
            state.currentRoom = null;
            state.joined = false;
        },
    },
});

export const {
    setCurrentRoon,
    clearCurrentRoom,
} = roomSlice.actions;

export default roomSlice.reducer;