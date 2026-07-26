import { createSlice } from "@reduxjs/toolkit";
import { isTokenExpired } from "../../utils/sessionStorage";

function readStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        localStorage.removeItem("user");
        return null;
    }
}

function getInitialAuthState() {
    const storedUser = readStoredUser();
    const storedToken = localStorage.getItem("token");

    if (!storedToken || isTokenExpired(storedToken)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return {
            user: null,
            token: null,
            isAuthenticated: false,
        };
    }

    return {
        user: storedUser,
        token: storedToken,
        isAuthenticated: storedUser?.role === "member",
    };
}

const initialState = getInitialAuthState();

const authSlice = createSlice({
    name: "auth",

    initialState,

    reducers:{
        loginSuccess(state, action) {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = action.payload.user?.role === "member";

            localStorage.setItem("token", action.payload.token);
            localStorage.setItem("user", JSON.stringify(action.payload.user));
        },

        logout(state) {
            state.user = null;
            state.token = null;
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
