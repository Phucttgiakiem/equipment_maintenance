type Chainable = {
  then: (resolve: (value: unknown) => void, reject: (reason: unknown) => void) => Promise<unknown>;
} & Record<string, jest.Mock>;

function createChainable(result: unknown, shouldReject = false): Chainable {
  const chain = {
    then: (resolve: (value: unknown) => void, reject: (reason: unknown) => void) =>
      shouldReject
        ? Promise.reject(result).catch(reject)
        : Promise.resolve(result).then(resolve),
  } as Chainable;

  for (const method of ["values", "set", "where", "returning", "from", "orderBy", "limit"]) {
    chain[method] = jest.fn(() => chain);
  }

  return chain;
}

const mockDb = {
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  select: jest.fn(),
};

jest.mock("@/db", () => ({ db: mockDb }));

import {
  EmailConflictError,
  InvalidRegistrationStateError,
  SelfActionError,
  activateUser,
  approveUser,
  changeUserRole,
  deactivateUser,
  registerUser,
  rejectUser,
} from "./service";

function makeUser(overrides: Partial<{
  id: string;
  registrationStatus: "pending" | "approved" | "rejected";
  isActive: boolean;
  role: "admin" | "technician";
}> = {}) {
  return {
    id: "user-1",
    name: "Jamie Tech",
    email: "jamie@example.com",
    role: "technician" as const,
    isActive: false,
    registrationStatus: "pending" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("registerUser", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates a pending, inactive technician account", async () => {
    // Arrange
    const created = makeUser();
    mockDb.insert.mockReturnValue(createChainable([created]));

    // Act
    const result = await registerUser({
      name: "Jamie Tech",
      email: "jamie@example.com",
      password: "password123",
    });

    // Assert
    expect(result).toEqual(created);
  });

  it("throws EmailConflictError when the email already exists", async () => {
    // Arrange
    mockDb.insert.mockReturnValue(createChainable({ code: "23505" }, true));

    // Act
    const act = registerUser({
      name: "Jamie Tech",
      email: "jamie@example.com",
      password: "password123",
    });

    // Assert
    await expect(act).rejects.toBeInstanceOf(EmailConflictError);
  });

  it("rethrows unrelated database errors", async () => {
    // Arrange
    const dbError = new Error("connection lost");
    mockDb.insert.mockReturnValue(createChainable(dbError, true));

    // Act
    const act = registerUser({
      name: "Jamie Tech",
      email: "jamie@example.com",
      password: "password123",
    });

    // Assert
    await expect(act).rejects.toBe(dbError);
  });
});

describe("approveUser", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("approves and activates a pending user", async () => {
    // Arrange
    const approved = makeUser({ registrationStatus: "approved", isActive: true });
    mockDb.update.mockReturnValue(createChainable([approved]));

    // Act
    const result = await approveUser(makeUser({ registrationStatus: "pending" }));

    // Assert
    expect(result).toEqual(approved);
  });

  it("throws InvalidRegistrationStateError when the user is not pending", async () => {
    // Arrange
    const user = makeUser({ registrationStatus: "approved" });

    // Act
    const act = approveUser(user);

    // Assert
    await expect(act).rejects.toBeInstanceOf(InvalidRegistrationStateError);
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});

describe("rejectUser", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("rejects a pending user without activating them", async () => {
    // Arrange
    const rejected = makeUser({ registrationStatus: "rejected", isActive: false });
    mockDb.update.mockReturnValue(createChainable([rejected]));

    // Act
    const result = await rejectUser(makeUser({ registrationStatus: "pending" }));

    // Assert
    expect(result).toEqual(rejected);
  });

  it("throws InvalidRegistrationStateError when the user is not pending", async () => {
    // Arrange
    const user = makeUser({ registrationStatus: "rejected" });

    // Act
    const act = rejectUser(user);

    // Assert
    await expect(act).rejects.toBeInstanceOf(InvalidRegistrationStateError);
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});

describe("activateUser", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("activates an approved, inactive user", async () => {
    // Arrange
    const activated = makeUser({ registrationStatus: "approved", isActive: true });
    mockDb.update.mockReturnValue(createChainable([activated]));

    // Act
    const result = await activateUser(
      makeUser({ registrationStatus: "approved", isActive: false }),
    );

    // Assert
    expect(result).toEqual(activated);
  });

  it("throws InvalidRegistrationStateError when the user is not approved", async () => {
    // Arrange
    const user = makeUser({ registrationStatus: "pending" });

    // Act
    const act = activateUser(user);

    // Assert
    await expect(act).rejects.toBeInstanceOf(InvalidRegistrationStateError);
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});

describe("deactivateUser", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deactivates an approved user", async () => {
    // Arrange
    const deactivated = makeUser({ registrationStatus: "approved", isActive: false });
    mockDb.update.mockReturnValue(createChainable([deactivated]));

    // Act
    const result = await deactivateUser(
      makeUser({ id: "user-2", registrationStatus: "approved", isActive: true }),
      "admin-1",
    );

    // Assert
    expect(result).toEqual(deactivated);
  });

  it("throws SelfActionError when an admin targets their own account", async () => {
    // Arrange
    const user = makeUser({ id: "admin-1", registrationStatus: "approved", isActive: true });

    // Act
    const act = deactivateUser(user, "admin-1");

    // Assert
    await expect(act).rejects.toBeInstanceOf(SelfActionError);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("throws InvalidRegistrationStateError when the user is not approved", async () => {
    // Arrange
    const user = makeUser({ id: "user-2", registrationStatus: "pending" });

    // Act
    const act = deactivateUser(user, "admin-1");

    // Assert
    await expect(act).rejects.toBeInstanceOf(InvalidRegistrationStateError);
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});

describe("changeUserRole", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("changes another user's role", async () => {
    // Arrange
    const updated = makeUser({ id: "user-2", role: "admin" });
    mockDb.update.mockReturnValue(createChainable([updated]));

    // Act
    const result = await changeUserRole(makeUser({ id: "user-2" }), "admin", "admin-1");

    // Assert
    expect(result).toEqual(updated);
  });

  it("throws SelfActionError when an admin targets their own account", async () => {
    // Arrange
    const user = makeUser({ id: "admin-1" });

    // Act
    const act = changeUserRole(user, "technician", "admin-1");

    // Assert
    await expect(act).rejects.toBeInstanceOf(SelfActionError);
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});
