import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getRoom, verifyRoomAccess } from "../../api/room.api";
import "../../styles/DashBoardPage.css"

function JoinRoomForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [roomId, setRoomId] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [password, setPassword] = useState("");
  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    try {
      const { room } = await getRoom(roomId);

      if ((room.publicity === "private" || room.hasPassword) && !password.trim()) {
        setError("Password is required for this private room");
        return;
      }

      await verifyRoomAccess(room.id, password);

      navigate(`/room/${room.id}`, {
        state: { password },
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