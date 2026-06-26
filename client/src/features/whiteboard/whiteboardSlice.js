import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    connected: false,
    loading: false,
    error: null,
};

const whiteboardSlice = createSlice({
    name: "whiteboard",

    initialState,

    reducers:{
        setConnected(state, action) {
            state.connected = action.payload;
        },

        
        setLoading(state, action) {
            state.loading = action.payload;
        },
        
        setError(state, action) {
            state.error = action.payload;
        },

        clearError(state) {
            state.error = null;
        },
    },
});

export const {
    setConnected,
    setLoading,
    setError,
    clearError,
} = whiteboardSlice.actions;

export default whiteboardSlice.reducer;