import api from "./axios";

export async function createRoom(data) {
  const response = await api.post("/rooms", data);
  return response.data;
}

export async function getRoom(roomId) {
  const response = await api.get(`/rooms/${roomId}`);
  return response.data;
}

export async function verifyRoomAccess(roomId, password) {
  const response = await api.post(`/rooms/${roomId}/verify-access`, { password });
  return response.data;
}