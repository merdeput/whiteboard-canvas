const path = require("path");

function resolveFromRepository(request) {
  return require.resolve(request, {
    paths: [path.join(__dirname, "../../server/src/repositories")],
  });
}

function mockModule(request, exports) {
  const resolved = resolveFromRepository(request);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  };
}

function loadRepository(Whiteboard) {
  vi.resetModules();
  mockModule("../models/whiteboard.model", Whiteboard);

  delete require.cache[require.resolve("../../server/src/repositories/whiteboard.repository")];
  return require("../../server/src/repositories/whiteboard.repository");
}

describe("whiteboard.repository", () => {
  it("gets or creates a normalized whiteboard", async () => {
    const Whiteboard = {
      findOneAndUpdate: vi.fn().mockResolvedValue({
        roomId: "room_1",
        objects: [
          {
            type: "rect",
            objectId: "object_1",
            props: { width: 10 },
            creatorId: "user_1",
            creatorDisplayName: "Ada",
            creatorRole: "member",
            ignored: true,
          },
        ],
      }),
    };
    const repository = loadRepository(Whiteboard);

    await expect(repository.getOrCreate("room_1")).resolves.toEqual({
      roomId: "room_1",
      objects: [
        {
          type: "rect",
          objectId: "object_1",
          props: { width: 10 },
          creatorId: "user_1",
          creatorDisplayName: "Ada",
          creatorRole: "member",
        },
      ],
    });
    expect(Whiteboard.findOneAndUpdate).toHaveBeenCalledWith(
      { roomId: "room_1" },
      {
        $setOnInsert: {
          roomId: "room_1",
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
  });

  it("validates room access before adding objects", async () => {
    const repository = loadRepository({ findOneAndUpdate: vi.fn() });

    await expect(
      repository.addObject({
        roomId: "room_1",
        object: { type: "rect", objectId: "object_1", props: {} },
        roomExists: false,
        socketJoinedRoom: true,
      })
    ).rejects.toThrow("Room not found");
    await expect(
      repository.addObject({
        roomId: "room_1",
        object: { type: "rect", objectId: "object_1", props: {} },
        roomExists: true,
        socketJoinedRoom: false,
      })
    ).rejects.toThrow("Socket has not joined this room");
  });

  it("adds and normalizes a valid whiteboard object", async () => {
    const Whiteboard = {
      findOneAndUpdate: vi.fn().mockResolvedValue({}),
    };
    const repository = loadRepository(Whiteboard);
    const object = {
      type: "rect",
      objectId: "object_1",
      props: { fill: "red" },
      extra: "ignored",
    };

    await expect(
      repository.addObject({
        roomId: "room_1",
        object,
        roomExists: true,
        socketJoinedRoom: true,
      })
    ).resolves.toEqual({
      type: "rect",
      objectId: "object_1",
      props: { fill: "red" },
    });
    expect(Whiteboard.findOneAndUpdate).toHaveBeenCalledWith(
      { roomId: "room_1" },
      {
        $setOnInsert: { roomId: "room_1" },
        $push: { objects: object },
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
  });

  it("throws when updating a missing whiteboard object", async () => {
    const repository = loadRepository({
      findOneAndUpdate: vi.fn().mockResolvedValue(null),
    });

    await expect(
      repository.updateObject({
        roomId: "room_1",
        object: { type: "rect", objectId: "missing", props: {} },
        roomExists: true,
        socketJoinedRoom: true,
      })
    ).rejects.toThrow("Whiteboard object not found");
  });

  it("deletes only object IDs that exist", async () => {
    const Whiteboard = {
      findOneAndUpdate: vi.fn().mockResolvedValue({
        roomId: "room_1",
        objects: [
          { type: "rect", objectId: "object_1", props: {} },
          { type: "circle", objectId: "object_2", props: {} },
        ],
      }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const repository = loadRepository(Whiteboard);

    await expect(
      repository.deleteObjects({
        roomId: "room_1",
        objectIds: ["object_1", "missing"],
        roomExists: true,
        socketJoinedRoom: true,
      })
    ).resolves.toEqual({
      roomId: "room_1",
      objectIds: ["object_1"],
    });
    expect(Whiteboard.updateOne).toHaveBeenCalledWith(
      { roomId: "room_1" },
      {
        $pull: {
          objects: {
            objectId: { $in: ["object_1"] },
          },
        },
      }
    );
  });

  it("replaces and clears whiteboard state", async () => {
    const Whiteboard = {
      findOneAndUpdate: vi
        .fn()
        .mockResolvedValueOnce({
          roomId: "room_1",
          objects: [{ type: "line", objectId: "object_1", props: {} }],
        })
        .mockResolvedValueOnce({ roomId: "room_1", objects: [] }),
    };
    const repository = loadRepository(Whiteboard);

    await expect(
      repository.replaceState({
        roomId: "room_1",
        roomExists: true,
        objects: [{ type: "line", objectId: "object_1", props: {} }],
      })
    ).resolves.toEqual({
      roomId: "room_1",
      objects: [{ type: "line", objectId: "object_1", props: {} }],
    });
    await expect(
      repository.clear({
        roomId: "room_1",
        roomExists: true,
        socketJoinedRoom: true,
      })
    ).resolves.toEqual({ roomId: "room_1", objects: [] });
  });
});
