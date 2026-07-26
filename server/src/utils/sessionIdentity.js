/**
 * @typedef {Object} SessionIdentity
 * @property {string} id
 * @property {string} displayName
 * @property {"guest"|"member"} role
 */

const GUEST_ROLE = "guest";
const MEMBER_ROLE = "member";

function createSessionIdentity({ id, displayName, role }) {
  if (!id || !displayName || !role) {
    throw new Error("Session identity requires id, displayName, and role");
  }

  return {
    id,
    displayName,
    role,
  };
}

function createGuestIdentity({ id, displayName }) {
  return createSessionIdentity({
    id,
    displayName,
    role: GUEST_ROLE,
  });
}

function createMemberIdentity({ id, displayName }) {
  return createSessionIdentity({
    id,
    displayName,
    role: MEMBER_ROLE,
  });
}

module.exports = {
  GUEST_ROLE,
  MEMBER_ROLE,
  createSessionIdentity,
  createGuestIdentity,
  createMemberIdentity,
};
