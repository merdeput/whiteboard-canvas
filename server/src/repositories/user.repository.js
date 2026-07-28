const usersStore = require("../stores/users.store");

function create(user) {
  return usersStore.createUser(user);
}

function findById(userId) {
  return usersStore.findUserById(userId);
}

function findByUsername(username) {
  return usersStore.findUserByUsername(username);
}

module.exports = {
  create,
  findByUsername,
  findById,
};
