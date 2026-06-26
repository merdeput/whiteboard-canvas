import CreateRoomForm from "./components/CreateRoomForm";
import JoinRoomForm from "./components/JoinRoomForm";

function DashboardPage() {
  return (
    <div className="dashboard-container">
      <h1>Collaborative Whiteboard</h1>
      <p>Welcome! Create a room or join an existing one.</p>

      <div className="dashboard-content">
        <CreateRoomForm />
        <JoinRoomForm />
      </div>
    </div>
  );
}

export default DashboardPage;