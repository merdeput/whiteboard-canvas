// VerifyJWT
const { verifyAccessToken } = require("../utils/utils");

function verifyJwt(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      username: payload.username,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

// ErrorHandler
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV !== "production") {
    console.error("[ERROR]", err);
  }

  res.status(statusCode).json({
    message,
  });
}

module.exports = {
    verifyJwt,
    errorHandler,
};