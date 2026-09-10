import type { Session } from "next-auth";

const mockAuth = jest.fn<Promise<Session | null>, []>();

jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

import { requireRole, requireSession } from "./guard";

function makeSession(role: "admin" | "technician"): Session {
  return {
    user: { id: "user-1", name: "Test User", email: "test@example.com", role },
    expires: "2999-01-01T00:00:00.000Z",
  };
}

describe("requireSession", () => {
  afterEach(() => {
    mockAuth.mockReset();
  });

  it("returns the session when a user is authenticated", async () => {
    // Arrange
    const session = makeSession("technician");
    mockAuth.mockResolvedValue(session);

    // Act
    const result = await requireSession();

    // Assert
    expect(result.response).toBeNull();
    expect(result.session).toEqual(session);
  });

  it("returns a 401 response when there is no session", async () => {
    // Arrange
    mockAuth.mockResolvedValue(null);

    // Act
    const result = await requireSession();

    // Assert
    expect(result.session).toBeNull();
    expect(result.response?.status).toBe(401);
  });
});

describe("requireRole", () => {
  afterEach(() => {
    mockAuth.mockReset();
  });

  it("returns the session when the user's role is allowed", async () => {
    // Arrange
    const session = makeSession("admin");
    mockAuth.mockResolvedValue(session);

    // Act
    const result = await requireRole(["admin"]);

    // Assert
    expect(result.response).toBeNull();
    expect(result.session).toEqual(session);
  });

  it("returns a 403 response when the user's role is not allowed", async () => {
    // Arrange
    const session = makeSession("technician");
    mockAuth.mockResolvedValue(session);

    // Act
    const result = await requireRole(["admin"]);

    // Assert
    expect(result.session).toBeNull();
    expect(result.response?.status).toBe(403);
  });

  it("returns a 401 response when there is no session", async () => {
    // Arrange
    mockAuth.mockResolvedValue(null);

    // Act
    const result = await requireRole(["admin"]);

    // Assert
    expect(result.session).toBeNull();
    expect(result.response?.status).toBe(401);
  });
});
