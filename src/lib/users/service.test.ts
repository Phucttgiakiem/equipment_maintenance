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

import bcrypt from "bcryptjs";
import {
  EmailConflictError,
  InvalidCurrentPasswordError,
  InvalidRegistrationStateError,
  SelfActionError,
  activateUser,
  approveUser,
  changePassword,
  deactivateUser,
  registerUser,
  rejectUser,
  resetPassword,
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
    mockDb.select.mockReturnValue(createChainable([]));
    mockDb.insert.mockReturnValue(createChainable([created]));

    // Act
    const result = await registerUser({
      name: "Jamie Tech",
      email: "jamie@example.com",
      password: "password123",
      confirmPassword: "password123",
    });

    // Assert
    expect(result).toEqual(created);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("throws EmailConflictError when a pending registration already exists", async () => {
    // Arrange
    mockDb.select.mockReturnValue(
      createChainable([{ id: "user-1", registrationStatus: "pending" }]),
    );

    // Act
    const act = registerUser({
      name: "Jamie Tech",
      email: "jamie@example.com",
      password: "password123",
      confirmPassword: "password123",
    });

    // Assert
    await expect(act).rejects.toBeInstanceOf(EmailConflictError);
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("throws EmailConflictError when an approved account already exists", async () => {
    // Arrange
    mockDb.select.mockReturnValue(
      createChainable([{ id: "user-1", registrationStatus: "approved" }]),
    );

    // Act
    const act = registerUser({
      name: "Jamie Tech",
      email: "jamie@example.com",
      password: "password123",
      confirmPassword: "password123",
    });

    // Assert
    await expect(act).rejects.toBeInstanceOf(EmailConflictError);
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("reuses a rejected registration and resets it to pending/inactive", async () => {
    // Arrange
    const reactivated = makeUser({ registrationStatus: "pending", isActive: false });
    mockDb.select.mockReturnValue(
      createChainable([{ id: "user-1", registrationStatus: "rejected" }]),
    );
    mockDb.update.mockReturnValue(createChainable([reactivated]));

    // Act
    const result = await registerUser({
      name: "Jamie Tech",
      email: "jamie@example.com",
      password: "password123",
      confirmPassword: "password123",
    });

    // Assert
    expect(result).toEqual(reactivated);
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("rethrows unrelated database errors", async () => {
    // Arrange
    const dbError = new Error("connection lost");
    mockDb.select.mockReturnValue(createChainable([]));
    mockDb.insert.mockReturnValue(createChainable(dbError, true));

    // Act
    const act = registerUser({
      name: "Jamie Tech",
      email: "jamie@example.com",
      password: "password123",
      confirmPassword: "password123",
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

describe("changePassword", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("updates the password hash when the current password is correct", async () => {
    // Arrange
    const passwordHash = await bcrypt.hash("oldpassword1", 10);
    mockDb.select.mockReturnValue(createChainable([{ passwordHash }]));
    mockDb.update.mockReturnValue(createChainable([]));

    // Act
    await changePassword("user-1", "oldpassword1", "newpassword1");

    // Assert
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("throws InvalidCurrentPasswordError when the current password is wrong", async () => {
    // Arrange
    const passwordHash = await bcrypt.hash("actualpassword1", 10);
    mockDb.select.mockReturnValue(createChainable([{ passwordHash }]));

    // Act
    const act = changePassword("user-1", "wrongpassword", "newpassword1");

    // Assert
    await expect(act).rejects.toBeInstanceOf(InvalidCurrentPasswordError);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("throws InvalidCurrentPasswordError when the user record is not found", async () => {
    // Arrange
    mockDb.select.mockReturnValue(createChainable([]));

    // Act
    const act = changePassword("missing-user", "anypassword", "newpassword1");

    // Assert
    await expect(act).rejects.toBeInstanceOf(InvalidCurrentPasswordError);
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});

describe("resetPassword", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("sets a new password hash for another user", async () => {
    // Arrange
    const updated = makeUser({ id: "user-2" });
    mockDb.update.mockReturnValue(createChainable([updated]));

    // Act
    const result = await resetPassword(makeUser({ id: "user-2" }), "temppassword1", "admin-1");

    // Assert
    expect(result).toEqual(updated);
  });

  it("throws SelfActionError when an admin targets their own account", async () => {
    // Arrange
    const user = makeUser({ id: "admin-1" });

    // Act
    const act = resetPassword(user, "temppassword1", "admin-1");

    // Assert
    await expect(act).rejects.toBeInstanceOf(SelfActionError);
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});
