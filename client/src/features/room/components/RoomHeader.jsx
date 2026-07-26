function RoomHeader({ roomName, roomId, connectionStatus, sessionLabel, onLogout }) {
  return (
    <header className="room-header">
      <div className="room-header__primary">
        <p className="room-header__eyebrow">Room Name</p>
        <h1 className="room-header__title">{roomName}</h1>
      </div>

      <div className="room-header__meta">
        <div className="room-header__item">
          <span className="room-header__label">Room ID</span>
          <span className="room-header__value">{roomId}</span>
        </div>

        <div className="room-header__item">
          <span className="room-header__label">Connection Status</span>
          <span className="room-header__value">{connectionStatus}</span>
        </div>

        {sessionLabel ? (
          <div className="room-header__item">
            <span className="room-header__label">Session</span>
            <span className="room-header__value">{sessionLabel}</span>
          </div>
        ) : null}

        {onLogout ? (
          <button type="button" className="room-header__logout" onClick={onLogout}>
            Logout
          </button>
        ) : null}
      </div>
    </header>
  );
}

export default RoomHeader;
