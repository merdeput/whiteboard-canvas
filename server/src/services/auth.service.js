const bcrypt = require("bcrypt");
const { generateId, signAccessToken } = require("../utils/utils");
const usersStore = require("../stores/users.store");
const {
  createGuestIdentity,
  createMemberIdentity,
} = require("../utils/sessionIdentity");

const GUEST_TOKEN_EXPIRES_IN = "24h";

async function register({ username, password }) {
  if (!username || !password) {
    throw createAppError(400, "Username and password are required");
  }

  const existingUser = usersStore.findUserByUsername(username);
  if (existingUser) {
    throw createAppError(409, "Username already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = usersStore.createUser({
    id: generateId("user"),
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  });

  const identity = createMemberIdentity({
    id: user.id,
    displayName: user.username,
  });
  const token = signAccessToken(identity);

  return {
    user: sanitizeUser(user),
    token,
  };
}

async function login({ username, password }) {
  if (!username || !password) {
    throw createAppError(400, "Username and password are required");
  }

  const user = usersStore.findUserByUsername(username);
  if (!user) {
    throw createAppError(401, "Invalid username or password");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordCorrect) {
    throw createAppError(401, "Invalid username or password");
  }

  const identity = createMemberIdentity({
    id: user.id,
    displayName: user.username,
  });
  const token = signAccessToken(identity);

  return {
    user: sanitizeUser(user),
    token,
  };
}

function issueGuestSession({ displayName }) {
  const guestDisplayName = normalizeGuestDisplayName(displayName);
  const identity = createGuestIdentity({
    id: generateId("guest"),
    displayName: guestDisplayName,
  });

  return {
    identity,
    token: signAccessToken(identity, {
      expiresIn: GUEST_TOKEN_EXPIRES_IN,
    }),
  };
}

function logout() {
  return {
    success: true,
  };
}

function sanitizeUser(user) {
  return {
    id: user.id,
    displayName: user.username,
    role: "member",
    createdAt: user.createdAt,
  };
}

function normalizeGuestDisplayName(displayName) {
  if (displayName && displayName.trim()) {
    return displayName.trim();
  }

  return `Guest-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function createAppError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

module.exports = {
    register,
    login,
    issueGuestSession,
    logout,
};
