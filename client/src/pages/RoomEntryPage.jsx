import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { createGuestSession } from "../api/auth.api";
import { getRoom } from "../api/room.api";
import { loginSuccess, logout } from "../features/auth/authSlice";
import RoomPage from "./RoomPage";
import "../styles/RoomEntryPage.css";
import {
  clearStoredRoomSession,
  getStoredGuestDisplayName,
  getStoredRoomSession,
  isTokenExpired,
  setStoredGuestDisplayName,
  setStoredRoomSession,
} from "../utils/sessionStorage";

function generateGuestDisplayName() {
  return `Guest-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function RoomEntryPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [roomMetadata, setRoomMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState(location.state?.password || "");
  const [enterCanvas, setEnterCanvas] = useState(false);
  const [sessionPassword, setSessionPassword] = useState("");

  const storedRoomSession = useMemo(() => getStoredRoomSession(), []);
  const isMemberSession = authUser?.role === "member" && Boolean(token);

  const defaultDisplayName = useMemo(() => {
    if (isMemberSession && authUser?.displayName) {
      return authUser.displayName;
    }

    return getStoredGuestDisplayName() || generateGuestDisplayName();
  }, [authUser?.displayName, isMemberSession]);
  const [displayName, setDisplayName] = useState(defaultDisplayName);

  const handleSessionError = useCallback(({ type, message }) => {
    const normalizedMessage = message || "Unable to join this room.";
    const wasMemberSession = authUser?.role === "member";

    setEnterCanvas(false);
    setSubmitting(false);

    if (
      type === "connect_error" &&
      /invalid|expired|authentication token is required/i.test(normalizedMessage)
    ) {
      dispatch(logout());
      clearStoredRoomSession(roomId);
      setError(
        wasMemberSession
          ? "Your sign-in session expired. Log in again or continue as a guest."
          : "Your guest session expired. Continue again to get a new guest session."
      );
      return;
    }

    if (/room not found/i.test(normalizedMessage)) {
      clearStoredRoomSession(roomId);
      navigate("/", {
        replace: true,
        state: {
          banner: "Room doesn't exist.",
        },
      });
      return;
    }

    if (/password/i.test(normalizedMessage)) {
      clearStoredRoomSession(roomId);
    }

    setError(normalizedMessage);
  }, [authUser?.role, dispatch, navigate, roomId]);

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

        const currentToken = token || localStorage.getItem("token");
        const hasRequestedCanvas = location.state?.enterCanvas === true;
        const hasStoredRoomSession = storedRoomSession?.roomId === roomId;
        const nextPassword = location.state?.password ?? storedRoomSession?.password ?? "";

        setPassword(nextPassword);

        if (currentToken && isTokenExpired(currentToken)) {
          const wasMemberSession = authUser?.role === "member";

          dispatch(logout());
          clearStoredRoomSession(roomId);
          setError(
            wasMemberSession
              ? "Your sign-in session expired. Log in again or continue as a guest."
              : "Your guest session expired. Continue again to get a new guest session."
          );
          return;
        }

        if (
          currentToken &&
          (hasRequestedCanvas || hasStoredRoomSession) &&
          (!metadata.requiresPassword || nextPassword.trim())
        ) {
          setSessionPassword(nextPassword.trim());
          setEnterCanvas(true);
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        if (err.response?.status === 404) {
          clearStoredRoomSession(roomId);
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
  }, [
    authUser?.role,
    dispatch,
    location.state,
    navigate,
    roomId,
    storedRoomSession?.password,
    storedRoomSession?.roomId,
    token,
  ]);

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

      if (!isMemberSession) {
        const result = await createGuestSession({
          displayName: sessionDisplayName,
        });

        sessionDisplayName = result.identity.displayName;
        setStoredGuestDisplayName(sessionDisplayName);
        dispatch(
          loginSuccess({
            user: result.identity,
            token: result.token,
          })
        );
      }

      setStoredRoomSession({
        roomId,
        password: password.trim(),
      });
      setSessionPassword(password.trim());
      setEnterCanvas(true);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to start this room session.");
    } finally {
      setSubmitting(false);
    }
  }

  if (enterCanvas && roomMetadata) {
    return (
      <RoomPage
        sessionPassword={sessionPassword}
        onSessionError={handleSessionError}
      />
    );
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

          {!isAuthenticated ? (
            <p className="room-entry-copy">
              Continue as a guest here, or <Link to="/login">log in</Link> to create rooms later.
            </p>
          ) : null}

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
