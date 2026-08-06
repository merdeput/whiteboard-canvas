const path = require("path");

function resolveFromServer(request) {
  return require.resolve(request, {
    paths: [path.join(__dirname, "../../server/src/services")],
  });
}

function mockModule(request, exports) {
  const resolved = resolveFromServer(request);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  };
}

function loadWhiteboardService({ roomRepository, whiteboardRepository, bcrypt } = {}) {
  vi.resetModules();
  mockModule("bcrypt", bcrypt || { compare: vi.fn() });
  mockModule("../repositories", {
    roomRepository: roomRepository || {},
    whiteboardRepository: whiteboardRepository || {},
  });

  delete require.cache[require.resolve("../../server/src/services/whiteboard.service")];
  return require("../../server/src/services/whiteboard.service");
}

function makeSocket() {
  return {
    identity: {
      id: "user_1",
      displayName: "Ada",
      role: "member",
    },
    rooms: new Set(["room_1"]),
  };
}

describe("whiteboard.service", () => {
  it("adds creator metadata when adding objects", async () => {
    const whiteboardRepository = {
      addObject: vi.fn().mockResolvedValue({ objectId: "object_1" }),
    };
    const service = loadWhiteboardService({
      roomRepository: { findById: vi.fn().mockResolvedValue({ id: "room_1" }) },
      whiteboardRepository,
    });

    await service.addObjectToWhiteboard({
      socket: makeSocket(),
      roomId: "room_1",
      object: { type: "rect", objectId: "object_1", props: { width: 10 } },
    });

    expect(whiteboardRepository.addObject).toHaveBeenCalledWith({
      roomId: "room_1",
      roomExists: true,
      socketJoinedRoom: true,
      object: {
        type: "rect",
        objectId: "object_1",
        props: { width: 10 },
        creatorId: "user_1",
        creatorDisplayName: "Ada",
        creatorRole: "member",
      },
    });
  });

  it("preserves existing creator metadata when updating objects", async () => {
    const whiteboardRepository = {
      updateObject: vi.fn().mockResolvedValue({ objectId: "object_1" }),
    };
    const service = loadWhiteboardService({
      roomRepository: { findById: vi.fn().mockResolvedValue({ id: "room_1" }) },
      whiteboardRepository,
    });

    await service.updateObjectInWhiteboard({
      socket: makeSocket(),
      roomId: "room_1",
      object: {
        type: "rect",
        objectId: "object_1",
        props: {},
        creatorId: "guest_1",
      },
    });

    expect(whiteboardRepository.updateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        object: expect.objectContaining({
          creatorId: "guest_1",
          creatorDisplayName: "Ada",
          creatorRole: "member",
        }),
      })
    );
  });

  it("exports whiteboard state without authoritative metadata", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const service = loadWhiteboardService({
      roomRepository: { findById: vi.fn().mockResolvedValue({ id: "room_1", passwordHash: null }) },
      whiteboardRepository: {
        getState: vi.fn().mockResolvedValue({
          roomId: "room_1",
          objects: [
            {
              type: "path",
              objectId: "object_1",
              props: { stroke: "black" },
              pathData: [["M", 0, 0]],
              creatorId: "user_1",
              creatorDisplayName: "Ada",
              creatorRole: "member",
            },
          ],
        }),
      },
    });

    await expect(service.exportWhiteboard({ roomId: "room_1" })).resolves.toEqual({
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      whiteboard: {
        objects: [
          {
            type: "path",
            objectId: "object_1",
            props: { stroke: "black" },
            pathData: [["M", 0, 0]],
          },
        ],
      },
    });
    vi.useRealTimers();
  });

  it("validates imports and replaces whiteboard state", async () => {
    const whiteboardRepository = {
      replaceState: vi.fn().mockResolvedValue({ roomId: "room_1", objects: [] }),
    };
    const service = loadWhiteboardService({
      roomRepository: { findById: vi.fn().mockResolvedValue({ id: "room_1", passwordHash: null }) },
      whiteboardRepository,
    });
    const whiteboardImport = {
      version: 1,
      whiteboard: {
        objects: [
          {
            type: "textbox",
            objectId: "object_1",
            props: { text: "Hello" },
          },
        ],
      },
    };

    await service.importWhiteboard({ roomId: "room_1", whiteboardImport });

    expect(whiteboardRepository.replaceState).toHaveBeenCalledWith({
      roomId: "room_1",
      roomExists: true,
      objects: [
        {
          type: "textbox",
          objectId: "object_1",
          props: { text: "Hello" },
        },
      ],
    });
  });

  it("rejects duplicate object IDs in imports", async () => {
    const service = loadWhiteboardService({
      roomRepository: { findById: vi.fn().mockResolvedValue({ id: "room_1", passwordHash: null }) },
      whiteboardRepository: {},
    });

    await expect(
      service.importWhiteboard({
        roomId: "room_1",
        whiteboardImport: {
          version: 1,
          whiteboard: {
            objects: [
              { type: "rect", objectId: "object_1", props: {} },
              { type: "circle", objectId: "object_1", props: {} },
            ],
          },
        },
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Duplicate whiteboard object ID: object_1",
    });
  });
});
