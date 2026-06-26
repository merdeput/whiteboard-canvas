import { useParams } from "react-router-dom";

function RoomPage() {
  const { roomId } = useParams();

  return (
    <div>
      <h1>Room</h1>

      <p>{roomId}</p>
    </div>
  );
}

export default RoomPage;