import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/DashBoardPage.css"

function JoinRoomForm() {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [password, setPassword] = useState("");
  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    try {
      if (!roomId.trim()) {
        setError("Room ID is required.");
        return;
      }

      navigate(`/room/${roomId.trim()}`, {
        state: { password: password.trim() },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="join-room-card">
      <h2>Join Room</h2>
      <p className="join-room-card__copy">
        Enter the Room ID.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
        />
        <input
            type="password"
            placeholder="Room Password (if required)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Joining..." : "Join Room"}
        </button>

        {error && <p>{error}</p>}
      </form>
    </div>
  );
}

export default JoinRoomForm;
