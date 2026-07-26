const authService = require("../services/auth.service");

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

function guest(req, res, next) {
  try {
    const result = authService.issueGuestSession(req.body || {});
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

function logout(req, res, next) {
  try {
    const result = authService.logout();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
    register,
    login,
    guest,
    logout,
};
