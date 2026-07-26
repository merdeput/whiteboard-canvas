import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import CreateRoomForm from "./components/CreateRoomForm";
import JoinRoomForm from "./components/JoinRoomForm";
import "../styles/HomePage.css";

function HomePage() {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const bannerMessage = location.state?.banner || "";

  return (
    <div className="home-page">
      <header className="home-topbar">
        <Link to="/" className="home-brand">
          Whiteboard Canvas
        </Link>

        <nav className="home-nav">
          {isAuthenticated ? (
            <span className="home-user-pill">{user?.displayName || "Signed In"}</span>
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
