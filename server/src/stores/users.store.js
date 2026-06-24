const users = new Map();

/*
User shape:
{
  id,
  username,
  passwordHash,
  createdAt
}
*/

function createUser(user) {
  users.set(user.id, user);
  return user;
}

function findUserById(userId) {
  return users.get(userId) || null;
}

function findUserByUsername(username) {
  for (const user of users.values()) {
    if (user.username === username) return user;
  }
  return null;
}

function getAllUsers() {
  return Array.from(users.values());
}

module.exports = {
  createUser,
  findUserById,
  findUserByUsername,
  getAllUsers,
};