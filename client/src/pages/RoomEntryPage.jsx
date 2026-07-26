import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { createGuestSession } from "../api/auth.api";
import { getRoom } from "../api/room.api";
import { loginSuccess } from "../features/auth/authSlice";
import RoomPage from "./RoomPage";
import "../styles/RoomEntryPage.css";

function generateGuestDisplayName() {
  return `Guest-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function RoomEntryPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [roomMetadata, setRoomMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState(location.state?.password || "");

  const shouldEnterCanvas = location.state?.enterCanvas === true;

  const defaultDisplayName = useMemo(() => {
    if (isAuthenticated && authUser?.displayName) {
      return authUser.displayName;
    }

    return localStorage.getItem("guestDisplayName") || generateGuestDisplayName();
  }, [authUser?.displayName, isAuthenticated]);
  const [displayName, setDisplayName] = useState(defaultDisplayName);

  useEffect(() => {
    let isMounted = true;

    async function loadRoomMetadata() {
      setLoading(true);
      setError("");

      try {
        const metadata = await getRoom(roomId);

        if (!isMounted) {
          return;
        }

        setRoomMetadata(metadata);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        navigate("/", {
          replace: true,
          state: {
            banner:
              err.response?.status === 404
                ? "Room doesn't exist."
                : "Unable to open that room right now.",
          },
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadRoomMetadata();

    return () => {
      isMounted = false;
    };
  }, [navigate, roomId]);

  async function handleContinue(event) {
    event.preventDefault();

    if (!roomMetadata) {
      return;
    }

    if (roomMetadata.requiresPassword && !password.trim()) {
      setError("Password is required for this room.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let sessionDisplayName = displayName.trim() || defaultDisplayName;

      if (!isAuthenticated) {
        const result = await createGuestSession({
          displayName: sessionDisplayName,
        });

        sessionDisplayName = result.identity.displayName;
        localStorage.setItem("guestDisplayName", sessionDisplayName);
        dispatch(
          loginSuccess({
            user: result.identity,
            token: result.token,
          })
        );
      }

      navigate(`/room/${roomId}`, {
        replace: true,
        state: {
          enterCanvas: true,
          password: password.trim(),
          sessionDisplayName,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to start this room session.");
    } finally {
      setSubmitting(false);
    }
  }

  if (shouldEnterCanvas && roomMetadata) {
    return <RoomPage />;
  }

  return (
    <div className="room-entry-page">
      <div className="room-entry-shell">
        <div className="room-entry-panel">
          <p className="room-entry-kicker">Room {roomId}</p>
          <h1>Check the room and choose how you appear.</h1>
          <p className="room-entry-copy">
            This room {roomMetadata?.requiresPassword ? "requires a password." : "is open and ready."}
          </p>

          <form className="room-entry-form" onSubmit={handleContinue}>
            <label className="room-entry-field">
              <span>Display Name</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Guest-ABCD"
                disabled={loading || submitting}
              />
            </label>

            <label className="room-entry-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  roomMetadata?.requiresPassword
                    ? "Enter room password"
                    : "No password required"
                }
                disabled={loading || submitting || !roomMetadata?.requiresPassword}
              />
            </label>

            {error ? <p className="room-entry-error">{error}</p> : null}

            <button type="submit" disabled={loading || submitting}>
              {loading ? "Checking room..." : submitting ? "Preparing room..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RoomEntryPage;
