const bcrypt = require("bcrypt");
const { generateId, signAccessToken } = require("../utils/utils");
const usersStore = require("../stores/users.store");

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

  const token = signAccessToken({
    sub: user.id,
    username: user.username,
  });

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

  const token = signAccessToken({
    sub: user.id,
    username: user.username,
  });

  return {
    user: sanitizeUser(user),
    token,
  };
}

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };
}

function createAppError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

module.exports = {
    register,
    login,
};