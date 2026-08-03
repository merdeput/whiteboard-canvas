const Whiteboard = require("../models/whiteboard.model");

function normalizeWhiteboardObject(object) {
  return {
    type: object.type,
    objectId: object.objectId,
    props: object.props || {},
    ...(object.pathData !== undefined ? { pathData: object.pathData } : {}),
    ...(object.creatorId !== undefined ? { creatorId: object.creatorId } : {}),
    ...(object.creatorDisplayName !== undefined
      ? { creatorDisplayName: object.creatorDisplayName }
      : {}),
    ...(object.creatorRole !== undefined ? { creatorRole: object.creatorRole } : {}),
  };
}

function normalizeWhiteboard(whiteboard) {
  if (!whiteboard) {
    return null;
  }

  return {
    roomId: whiteboard.roomId,
    objects: Array.isArray(whiteboard.objects)
      ? whiteboard.objects.map(normalizeWhiteboardObject)
      : [],
  };
}

function validateRoomAccess({ roomId, roomExists, socketJoinedRoom }) {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  if (!roomExists) {
    throw new Error("Room not found");
  }

  if (!socketJoinedRoom) {
    throw new Error("Socket has not joined this room");
  }
}

function validateObjectPayload(object) {
  if (!object || typeof object !== "object") {
    throw new Error("Whiteboard object payload is required");
  }

  if (!object.type || typeof object.type !== "string") {
    throw new Error("Whiteboard object type is required");
  }

  if (!object.objectId) {
    throw new Error("Whiteboard object ID is required");
  }
}

async function getOrCreate(roomId) {
  const whiteboard = await Whiteboard.findOneAndUpdate(
    { roomId },
    {
      $setOnInsert: {
        roomId,
        objects: [],
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      lean: true,
    }
  );

  return normalizeWhiteboard(whiteboard);
}

async function removeByRoomId(roomId) {
  const deletedWhiteboard = await Whiteboard.findOneAndDelete({ roomId }).lean();
  return normalizeWhiteboard(deletedWhiteboard);
}

async function addObject({ roomId, object, roomExists, socketJoinedRoom }) {
  validateRoomAccess({
    roomId,
    roomExists,
    socketJoinedRoom,
  });
  validateObjectPayload(object);

  await Whiteboard.findOneAndUpdate(
    { roomId },
    {
      $setOnInsert: {
        roomId,
      },
      $push: {
        objects: object,
      },
    },
    {
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return normalizeWhiteboardObject(object);
}

async function updateObject({ roomId, object, roomExists, socketJoinedRoom }) {
  validateRoomAccess({
    roomId,
    roomExists,
    socketJoinedRoom,
  });
  validateObjectPayload(object);

  const updatedWhiteboard = await Whiteboard.findOneAndUpdate(
    {
      roomId,
      "objects.objectId": object.objectId,
    },
    {
      $set: {
        "objects.$": object,
      },
    },
    {
      new: true,
      lean: true,
    }
  );

  if (!updatedWhiteboard) {
    throw new Error("Whiteboard object not found");
  }

  return normalizeWhiteboardObject(object);
}

async function deleteObjects({ roomId, objectIds, roomExists, socketJoinedRoom }) {
  validateRoomAccess({
    roomId,
    roomExists,
    socketJoinedRoom,
  });

  if (!Array.isArray(objectIds) || objectIds.length === 0) {
    throw new Error("Whiteboard object IDs are required");
  }

  const whiteboard = await getOrCreate(roomId);
  const existingObjectIds = new Set(whiteboard.objects.map((object) => object.objectId));
  const matchedObjectIds = objectIds.filter((objectId) => existingObjectIds.has(objectId));

  if (!matchedObjectIds.length) {
    throw new Error("Whiteboard objects not found");
  }

  await Whiteboard.updateOne(
    { roomId },
    {
      $pull: {
        objects: {
          objectId: { $in: matchedObjectIds },
        },
      },
    }
  );

  return {
    roomId,
    objectIds: matchedObjectIds,
  };
}

async function getState(roomId) {
  return getOrCreate(roomId);
}

async function replaceState({ roomId, objects, roomExists }) {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  if (!roomExists) {
    throw new Error("Room not found");
  }

  if (!Array.isArray(objects)) {
    throw new Error("Whiteboard objects array is required");
  }

  const whiteboard = await Whiteboard.findOneAndUpdate(
    { roomId },
    {
      $setOnInsert: {
        roomId,
      },
      $set: {
        objects,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      lean: true,
    }
  );

  return normalizeWhiteboard(whiteboard);
}

async function clear({ roomId, roomExists, socketJoinedRoom }) {
  validateRoomAccess({
    roomId,
    roomExists,
    socketJoinedRoom,
  });

  const whiteboard = await Whiteboard.findOneAndUpdate(
    { roomId },
    {
      $setOnInsert: {
        roomId,
      },
      $set: {
        objects: [],
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      lean: true,
    }
  );

  return normalizeWhiteboard(whiteboard);
}

module.exports = {
  getOrCreate,
  removeByRoomId,
  addObject,
  updateObject,
  deleteObjects,
  getState,
  replaceState,
  clear,
};
