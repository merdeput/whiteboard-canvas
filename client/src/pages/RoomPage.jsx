import { useParams } from "react-router-dom";

import "../styles/RoomPage.css"

function RoomPage() {
  const { roomId } = useParams();

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