const path = require("path");

function resolveFromSocket(request) {
  return require.resolve(request, {
    paths: [path.join(__dirname, "../../server/src/sockets")],
  });
}

function mockModule(request, exports) {
  const resolved = resolveFromSocket(request);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  };
}

function loadSocketHandlers(controller) {
  vi.resetModules();
  mockModule("../controllers/whiteboard.controller", controller);

  delete require.cache[require.resolve("../../server/src/sockets/whiteboard.socket")];
  return require("../../server/src/sockets/whiteboard.socket");
}

function createSocket() {
  const handlers = {};

  return {
    handlers,
    identity: {
      displayName: "Ada",
      role: "member",
    },
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    emit: vi.fn(),
  };
}

describe("whiteboard.socket", () => {
  it("registers whiteboard socket event handlers", () => {
    const registerHandlers = loadSocketHandlers({});
    const socket = createSocket();

    registerHandlers({}, socket);

    expect(socket.on).toHaveBeenCalledTimes(4);
    expect(Object.keys(socket.handlers)).toEqual([
      "whiteboard:draw-object",
      "whiteboard:update-object",
      "whiteboard:delete-objects",
      "whiteboard:clear",
    ]);
  });

  it("delegates draw object events to the whiteboard controller", async () => {
    const controller = {
      handleDrawObject: vi.fn().mockResolvedValue(undefined),
    };
    const registerHandlers = loadSocketHandlers(controller);
    const socket = createSocket();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    registerHandlers({}, socket);
    await socket.handlers["whiteboard:draw-object"]({
      roomId: "room_1",
      object: { objectId: "object_1" },
    });

    expect(controller.handleDrawObject).toHaveBeenCalledWith(socket, {
      roomId: "room_1",
      object: { objectId: "object_1" },
    });
    expect(socket.emit).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("emits room errors when controller handlers fail", async () => {
    const controller = {
      handleUpdateObject: vi.fn().mockRejectedValue(new Error("Update failed")),
    };
    const registerHandlers = loadSocketHandlers(controller);
    const socket = createSocket();

    registerHandlers({}, socket);
    await socket.handlers["whiteboard:update-object"]({ roomId: "room_1" });

    expect(socket.emit).toHaveBeenCalledWith("room:error", {
      message: "Update failed",
    });
  });

  it("delegates delete and clear events", async () => {
    const controller = {
      handleDeleteObjects: vi.fn().mockResolvedValue(undefined),
      handleClearWhiteboard: vi.fn().mockResolvedValue(undefined),
    };
    const registerHandlers = loadSocketHandlers(controller);
    const socket = createSocket();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    registerHandlers({}, socket);
    await socket.handlers["whiteboard:delete-objects"]({
      roomId: "room_1",
      objectIds: ["object_1"],
    });
    await socket.handlers["whiteboard:clear"]({ roomId: "room_1" });

    expect(controller.handleDeleteObjects).toHaveBeenCalledWith(socket, {
      roomId: "room_1",
      objectIds: ["object_1"],
    });
    expect(controller.handleClearWhiteboard).toHaveBeenCalledWith(socket, {
      roomId: "room_1",
    });
    consoleSpy.mockRestore();
  });
});
