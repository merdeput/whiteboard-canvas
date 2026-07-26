import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutSession } from "../api/auth.api";
import { logout } from "../features/auth/authSlice";
import CreateRoomForm from "./components/CreateRoomForm";
import JoinRoomForm from "./components/JoinRoomForm";
import { disconnectSocket } from "../socket/socketClient";
import { clearStoredRoomSession } from "../utils/sessionStorage";
import "../styles/HomePage.css";

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const hasSession = Boolean(user && token);
  const bannerMessage = location.state?.banner || "";

  async function handleLogout() {
    try {
      await logoutSession();
    } catch {
      // The server logout endpoint is stateless, so local cleanup is the critical step.
    } finally {
      disconnectSocket();
      clearStoredRoomSession();
      dispatch(logout());
      navigate("/", {
        replace: true,
        state: {
          banner: "Session ended.",
        },
      });
    }
  }

  return (
    <div className="home-page">
      <header className="home-topbar">
        <Link to="/" className="home-brand">
          Whiteboard Canvas
        </Link>

        <nav className="home-nav">
          {hasSession ? (
            <>
              <span className="home-user-pill">{user?.displayName || "Active Session"}</span>
              <button type="button" className="home-nav-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="home-nav-link">
                Login
              </Link>
              <Link to="/register" className="home-nav-link home-nav-link--primary">
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      {bannerMessage ? (
        <div className="home-banner" role="status">
          {bannerMessage}
        </div>
      ) : null}

      <main className="home-main">
        <section className="home-hero">
          <p className="home-kicker">Collaboration-first workspace</p>
          <h1>Jump into a room the way people join a live call.</h1>
          <p className="home-copy">
            Create a room if you are signed in, or open a room link and introduce
            yourself before the canvas appears.
          </p>
        </section>

        <section className="home-actions">
          <CreateRoomForm />
          <JoinRoomForm />
        </section>
      </main>
    </div>
  );
}

export default HomePage;
