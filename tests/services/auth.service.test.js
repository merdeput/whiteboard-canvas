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

function loadAuthService({ userRepository, bcrypt, utils } = {}) {
  vi.resetModules();
  mockModule("bcrypt", bcrypt || { hash: vi.fn(), compare: vi.fn() });
  mockModule("../utils/utils", utils || { generateId: vi.fn(), signAccessToken: vi.fn() });
  mockModule("../repositories", {
    userRepository: userRepository || {
      findByUsername: vi.fn(),
      create: vi.fn(),
    },
  });

  delete require.cache[require.resolve("../../server/src/services/auth.service")];
  return require("../../server/src/services/auth.service");
}

describe("auth.service", () => {
  it("registers a member, hashes the password, and returns a sanitized user", async () => {
    const userRepository = {
      findByUsername: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: "user_1",
        username: "ada",
        passwordHash: "hashed-password",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    };
    const bcrypt = {
      hash: vi.fn().mockResolvedValue("hashed-password"),
      compare: vi.fn(),
    };
    const utils = {
      generateId: vi.fn().mockReturnValue("user_1"),
      signAccessToken: vi.fn().mockReturnValue("token"),
    };
    const authService = loadAuthService({ userRepository, bcrypt, utils });

    const result = await authService.register({ username: "ada", password: "secret" });

    expect(userRepository.findByUsername).toHaveBeenCalledWith("ada");
    expect(bcrypt.hash).toHaveBeenCalledWith("secret", 10);
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user_1",
        username: "ada",
        passwordHash: "hashed-password",
      })
    );
    expect(utils.signAccessToken).toHaveBeenCalledWith({
      id: "user_1",
      displayName: "ada",
      role: "member",
    });
    expect(result).toEqual({
      user: {
        id: "user_1",
        displayName: "ada",
        role: "member",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      token: "token",
    });
  });

  it("rejects duplicate usernames during registration", async () => {
    const authService = loadAuthService({
      userRepository: {
        findByUsername: vi.fn().mockResolvedValue({ id: "user_1" }),
        create: vi.fn(),
      },
    });

    await expect(
      authService.register({ username: "ada", password: "secret" })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Username already exists",
    });
  });

  it("logs in with a valid password and rejects invalid credentials", async () => {
    const user = {
      id: "user_1",
      username: "ada",
      passwordHash: "hashed-password",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const userRepository = {
      findByUsername: vi.fn().mockResolvedValue(user),
      create: vi.fn(),
    };
    const bcrypt = {
      hash: vi.fn(),
      compare: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
    };
    const utils = {
      generateId: vi.fn(),
      signAccessToken: vi.fn().mockReturnValue("token"),
    };
    const authService = loadAuthService({ userRepository, bcrypt, utils });

    await expect(authService.login({ username: "ada", password: "secret" })).resolves.toEqual({
      user: {
        id: "user_1",
        displayName: "ada",
        role: "member",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      token: "token",
    });
    await expect(
      authService.login({ username: "ada", password: "wrong" })
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid username or password",
    });
  });

  it("issues a trimmed guest session with a 24 hour token", () => {
    const utils = {
      generateId: vi.fn().mockReturnValue("guest_1"),
      signAccessToken: vi.fn().mockReturnValue("guest-token"),
    };
    const authService = loadAuthService({ utils });

    const result = authService.issueGuestSession({ displayName: "  Guest Name  " });

    expect(result).toEqual({
      identity: {
        id: "guest_1",
        displayName: "Guest Name",
        role: "guest",
      },
      token: "guest-token",
    });
    expect(utils.signAccessToken).toHaveBeenCalledWith(
      {
        id: "guest_1",
        displayName: "Guest Name",
        role: "guest",
      },
      { expiresIn: "24h" }
    );
  });
});
