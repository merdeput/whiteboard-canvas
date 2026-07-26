import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { createRoom } from "../../api/room.api"

import "../../styles/DashBoardPage.css"

function CreateRoomForm() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [showLoginRequired, setShowLoginRequired] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowLoginRequired(true);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { room } = await createRoom({
        password: password.trim(),
      });

      navigate(`/room/${room.id}`, {
        state: {
          enterCanvas: true,
          password: password.trim(),
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create room"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-room-card">
      <h2>Create Room</h2>
      <p className="create-room-card__copy">
        Login to create a room.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Password (optional)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Room"}
        </button>

        {error && <p>{error}</p>}
      </form>

      {showLoginRequired ? (
        <div className="create-room-card__modal" role="dialog" aria-modal="true">
          <div className="create-room-card__modal-card">
            <h3>Login required to create a room.</h3>
            <p>Open the login screen in the top navigation, then come back here to create it.</p>
            <button type="button" onClick={() => setShowLoginRequired(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CreateRoomForm;
