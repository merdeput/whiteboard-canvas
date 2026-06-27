import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createRoom } from "../../api/room.api"

import "../../styles/DashBoardPage.css"

function CreateRoomForm() {
  const navigate = useNavigate();

  const [name, setName] = useState("");

  const [publicity, setPublicity] = useState("public");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (publicity === "private" && !password.trim()) {
      setError("Password is required for private rooms");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { room } = await createRoom({
        name,
        publicity,
        password,
      });

      navigate(`/room/${room.id}`);
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

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Room name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <select
          value={publicity}
          onChange={(e) => setPublicity(e.target.value)}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        <input
          type="password"
          placeholder={publicity === "private" ? "Password (required)" : "Password (optional)"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Room"}
        </button>

        {error && <p>{error}</p>}
      </form>
    </div>
  );
}

export default CreateRoomForm;