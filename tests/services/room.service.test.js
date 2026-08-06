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

function loadRoomService({ roomRepository, whiteboardRepository, bcrypt, utils } = {}) {
  vi.resetModules();
  mockModule("bcrypt", bcrypt || { hash: vi.fn(), compare: vi.fn() });
  mockModule("../utils/utils", utils || { generateId: vi.fn() });
  mockModule("../repositories", {
    roomRepository: roomRepository || {},
    whiteboardRepository: whiteboardRepository || {},
  });

  delete require.cache[require.resolve("../../server/src/services/room.service")];
  return require("../../server/src/services/room.service");
}

describe("room.service", () => {
  it("creates a password-protected room for a member and initializes its whiteboard", async () => {
    const room = {
      id: "room_1",
      ownerId: "user_1",
      passwordHash: "hashed-room-password",
      participants: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const roomRepository = {
      create: vi.fn().mockResolvedValue(room),
    };
    const whiteboardRepository = {
      getOrCreate: vi.fn().mockResolvedValue({ roomId: "room_1", objects: [] }),
    };
    const bcrypt = {
      hash: vi.fn().mockResolvedValue("hashed-room-password"),
      compare: vi.fn(),
    };
    const roomService = loadRoomService({
      roomRepository,
      whiteboardRepository,
      bcrypt,
      utils: { generateId: vi.fn().mockReturnValue("room_1") },
    });

    const result = await roomService.createRoom({
      ownerId: "user_1",
      ownerRole: "member",
      password: "  secret  ",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("secret", 10);
    expect(roomRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "room_1",
        ownerId: "user_1",
        passwordHash: "hashed-room-password",
        whiteboardObjects: [],
        participants: [],
      })
    );
    expect(whiteboardRepository.getOrCreate).toHaveBeenCalledWith("room_1");
    expect(result).toEqual({
      id: "room_1",
      ownerId: "user_1",
      requiresPassword: true,
      participants: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("only allows registered members to create rooms", async () => {
    const roomService = loadRoomService();

    await expect(
      roomService.createRoom({ ownerId: "guest_1", ownerRole: "guest" })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "Only registered members can create rooms",
    });
  });

  it("returns metadata for missing and password-protected rooms", async () => {
    const roomRepository = {
      findById: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "room_1", passwordHash: "hashed" }),
    };
    const roomService = loadRoomService({ roomRepository });

    await expect(roomService.getRoomMetadata("missing")).resolves.toEqual({
      exists: false,
      requiresPassword: false,
    });
    await expect(roomService.getRoomMetadata("room_1")).resolves.toEqual({
      exists: true,
      requiresPassword: true,
    });
  });

  it("verifies password access and rejects invalid room passwords", async () => {
    const room = { id: "room_1", passwordHash: "hashed" };
    const roomRepository = {
      findById: vi.fn().mockResolvedValue(room),
    };
    const bcrypt = {
      hash: vi.fn(),
      compare: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
    };
    const roomService = loadRoomService({ roomRepository, bcrypt });

    await expect(
      roomService.verifyRoomAccess({ roomId: "room_1", password: " secret " })
    ).resolves.toBe(room);
    await expect(
      roomService.verifyRoomAccess({ roomId: "room_1", password: "wrong" })
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid room password",
    });
  });

  it("removes empty rooms and matching whiteboards on socket disconnect", async () => {
    const roomRepository = {
      removeParticipantBySocketId: vi.fn().mockResolvedValue([
        { id: "room_empty", participants: [] },
        { id: "room_active", participants: [{ socketId: "socket_2" }] },
      ]),
      removeById: vi.fn().mockResolvedValue({ id: "room_empty" }),
    };
    const whiteboardRepository = {
      removeByRoomId: vi.fn().mockResolvedValue({ roomId: "room_empty" }),
    };
    const roomService = loadRoomService({ roomRepository, whiteboardRepository });

    await expect(roomService.handleSocketDisconnect("socket_1")).resolves.toEqual([
      "room_empty",
    ]);
    expect(roomRepository.removeById).toHaveBeenCalledWith("room_empty");
    expect(whiteboardRepository.removeByRoomId).toHaveBeenCalledWith("room_empty");
  });
});
