import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    currentRoom: null,
};

const roomSlice = createSlice({
    name: "room",

    initialState,

    reducers:{
        setCurrentRoom(state, action) {
            state.currentRoom = action.payload;
        },
    },
});

export const {
    setCurrentRoom,
} = roomSlice.actions;

export default roomSlice.reducer;
