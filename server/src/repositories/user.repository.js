const User = require("../models/user.model");

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user._id,
    username: user.username,
    passwordHash: user.passwordHash,
    createdAt:
      user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  };
}

async function create(user) {
  const createdUser = await User.create({
    _id: user.id,
    username: user.username,
    passwordHash: user.passwordHash,
  });

  return normalizeUser(createdUser);
}

async function findById(userId) {
  const user = await User.findById(userId).lean();
  return normalizeUser(user);
}

async function findByUsername(username) {
  const user = await User.findOne({ username }).lean();
  return normalizeUser(user);
}

module.exports = {
  create,
  findByUsername,
  findById,
};
