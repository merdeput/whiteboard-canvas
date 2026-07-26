const GUEST_DISPLAY_NAME_KEY = "guestDisplayName";
const ACTIVE_ROOM_SESSION_KEY = "activeRoomSession";

function readJson(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function getStoredGuestDisplayName() {
  return localStorage.getItem(GUEST_DISPLAY_NAME_KEY) || "";
}

export function setStoredGuestDisplayName(displayName) {
  if (!displayName) {
    return;
  }

  localStorage.setItem(GUEST_DISPLAY_NAME_KEY, displayName);
}

export function getStoredRoomSession() {
  return readJson(ACTIVE_ROOM_SESSION_KEY);
}

export function setStoredRoomSession(session) {
  localStorage.setItem(ACTIVE_ROOM_SESSION_KEY, JSON.stringify(session));
}

export function clearStoredRoomSession(roomId) {
  const currentSession = getStoredRoomSession();

  if (!currentSession) {
    return;
  }

  if (roomId && currentSession.roomId !== roomId) {
    return;
  }

  localStorage.removeItem(ACTIVE_ROOM_SESSION_KEY);
}

export function isTokenExpired(token) {
  if (!token) {
    return true;
  }

  try {
    const [, payloadSegment] = token.split(".");

    if (!payloadSegment) {
      return true;
    }

    const payload = JSON.parse(atob(payloadSegment));

    if (!payload.exp) {
      return false;
    }

    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
