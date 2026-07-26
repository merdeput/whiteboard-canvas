import { BrowserRouter, Route, Routes } from "react-router-dom";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import RoomEntryPage from "../pages/RoomEntryPage";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />

                <Route path="/login" element={<LoginPage />} />

                <Route
                path="/register"
                element={<RegisterPage />}
                />

                <Route
                path="/room/:roomId"
                element={<RoomEntryPage />}
                />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes;
