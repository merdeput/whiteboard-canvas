const { verifyAccessToken } = require("../utils/utils");

function registerSocketAuth(io){
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      const payload = verifyAccessToken(token);

      socket.user = {
        id: payload.sub,
        username: payload.username,
      };

      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });
}

module.exports = registerSocketAuth