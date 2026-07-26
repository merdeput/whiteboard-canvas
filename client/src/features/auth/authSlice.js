import { createSlice } from "@reduxjs/toolkit";

const storedUser = JSON.parse(localStorage.getItem("user") || "null");
const storedToken = localStorage.getItem("token");

const initialState = {
    user: storedUser,
    token: storedToken,
    hasSession: !!storedToken,
    isAuthenticated: storedUser?.role === "member" && !!storedToken,
};

const authSlice = createSlice({
    name: "auth",

    initialState,

    reducers:{
        loginSuccess(state, action) {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.hasSession = true;
            state.isAuthenticated = action.payload.user?.role === "member";

            localStorage.setItem("token", action.payload.token);
            localStorage.setItem("user", JSON.stringify(action.payload.user));
        },

        logout(state) {
            state.user = null;
            state.token = null;
            state.hasSession = false;
            state.isAuthenticated = false;

            localStorage.removeItem("token");
            localStorage.removeItem("user");
        },
    },
});

export const {
    loginSuccess,
    logout,
} = authSlice.actions;

export default authSlice.reducer;
