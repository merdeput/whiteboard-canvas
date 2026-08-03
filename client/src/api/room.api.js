import api from "./axios";

export async function createRoom(data) {
  const response = await api.post("/rooms", data);
  return response.data;
}

export async function getRoom(roomId) {
  const response = await api.get(`/rooms/${roomId}`);
  return response.data;
}

export async function exportWhiteboardJson(roomId, password = "") {
  const response = await api.post(`/rooms/${roomId}/whiteboard/export`, {
    password,
  });
  return response.data;
}

export async function importWhiteboardJson(roomId, password = "", whiteboardImport) {
  const response = await api.post(`/rooms/${roomId}/whiteboard/import`, {
    password,
    whiteboardImport,
  });
  return response.data;
}
