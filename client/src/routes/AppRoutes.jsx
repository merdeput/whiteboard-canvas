import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import RoomPage from "../pages/RoomPage";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                path="/"
                element={<Navigate to="/login" replace />}
                />

                <Route path="/login" element={<LoginPage />} />

                <Route
                path="/register"
                element={<RegisterPage />}
                />

                <Route
                path="/room/:roomId"
                element={
                    <ProtectedRoute>
                    <RoomPage />
                    </ProtectedRoute>
                }
        />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes;