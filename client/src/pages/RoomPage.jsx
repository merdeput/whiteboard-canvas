import { useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import useRoomSocket from "../hooks/useRoomSocket"

import "../styles/RoomPage.css"

function RoomPage() {
  const { roomId } = useParams();
  const token = useSelector((state)=> state.auth.token);
  const location = useLocation();
  const password = location.state?.password;
  useRoomSocket({ token, roomId, password, });
  return (
    <div className="room-container">
      <header className="room-header">
        <h1>Collaborative Whiteboard</h1>
      </header>

      <main className="room-content">
        <div className="room-info">
          <p>Room ID</p>

          <div className="room-id">
            {roomId}
          </div>
        </div>
      </main>
    </div>
  );

}

export default RoomPage;