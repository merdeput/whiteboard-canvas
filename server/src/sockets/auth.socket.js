const { verifyAccessToken } = require("../utils/utils");
const { createSessionIdentity } = require("../utils/sessionIdentity");

function registerSocketAuth(io){
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      const payload = verifyAccessToken(token);

      const identity = createSessionIdentity({
        id: payload.id,
        displayName: payload.displayName,
        role: payload.role,
      });
      socket.identity = identity;
      socket.user = {
        id: identity.id,
        username: identity.displayName,
        displayName: identity.displayName,
        role: identity.role,
      };

      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });
}

module.exports = registerSocketAuth
