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
  InvalidMaintenanceTransitionError,
  MaintenanceReferenceError,
  createMaintenanceRecord,
  deleteMaintenanceRecord,
  getMaintenanceById,
  isValidMaintenanceTransition,
  updateMaintenanceRecord,
} from "./service";

describe("createMaintenanceRecord", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the created record on success", async () => {
    // Arrange
    const created = { id: "maint-1", description: "Replace filter" };
    mockDb.insert.mockReturnValue(createChainable([created]));

    // Act
    const result = await createMaintenanceRecord(
      {
        equipmentId: "equip-1",
        scheduledDate: new Date("2024-06-01"),
        description: "Replace filter",
      },
      "user-1",
    );

    // Assert
    expect(result).toEqual(created);
  });

  it("throws MaintenanceReferenceError when the equipment or technician does not exist", async () => {
    // Arrange
    mockDb.insert.mockReturnValue(createChainable({ code: "23503" }, true));

    // Act
    const act = createMaintenanceRecord(
      {
        equipmentId: "missing-equipment",
        scheduledDate: new Date("2024-06-01"),
        description: "Replace filter",
      },
      "user-1",
    );

    // Assert
    await expect(act).rejects.toBeInstanceOf(MaintenanceReferenceError);
  });

  it("rethrows unrelated database errors", async () => {
    // Arrange
    const dbError = new Error("connection lost");
    mockDb.insert.mockReturnValue(createChainable(dbError, true));

    // Act
    const act = createMaintenanceRecord(
      {
        equipmentId: "equip-1",
        scheduledDate: new Date("2024-06-01"),
        description: "Replace filter",
      },
      "user-1",
    );

    // Assert
    await expect(act).rejects.toBe(dbError);
  });
});

describe("updateMaintenanceRecord", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the updated record on success (a status transition)", async () => {
    // Arrange
    const updated = { id: "maint-1", status: "in_progress" };
    mockDb.update.mockReturnValue(createChainable([updated]));

    // Act
    const result = await updateMaintenanceRecord("maint-1", { status: "in_progress" });

    // Assert
    expect(result).toEqual(updated);
  });

  it("returns null when the record does not exist", async () => {
    // Arrange
    mockDb.update.mockReturnValue(createChainable([]));

    // Act
    const result = await updateMaintenanceRecord("missing-id", { status: "completed" });

    // Assert
    expect(result).toBeNull();
  });

  it("throws MaintenanceReferenceError when reassigned to a non-existent technician", async () => {
    // Arrange
    mockDb.update.mockReturnValue(createChainable({ code: "23503" }, true));

    // Act
    const act = updateMaintenanceRecord("maint-1", { technicianId: "missing-user" });

    // Assert
    await expect(act).rejects.toBeInstanceOf(MaintenanceReferenceError);
  });

  it.each([
    ["scheduled", "in_progress"],
    ["in_progress", "completed"],
    ["scheduled", "cancelled"],
    ["in_progress", "cancelled"],
  ] as const)("allows the %s -> %s transition", async (from, to) => {
    // Arrange
    const updated = { id: "maint-1", status: to };
    mockDb.update.mockReturnValue(createChainable([updated]));

    // Act
    const result = await updateMaintenanceRecord("maint-1", { status: to }, from);

    // Assert
    expect(result).toEqual(updated);
  });

  it.each([
    ["scheduled", "completed"],
    ["in_progress", "scheduled"],
    ["completed", "in_progress"],
    ["completed", "cancelled"],
    ["cancelled", "scheduled"],
    ["cancelled", "in_progress"],
  ] as const)("rejects the %s -> %s transition", async (from, to) => {
    // Arrange
    // Act
    const act = updateMaintenanceRecord("maint-1", { status: to }, from);

    // Assert
    await expect(act).rejects.toBeInstanceOf(InvalidMaintenanceTransitionError);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("allows a no-op status update (same status) without treating it as a transition", async () => {
    // Arrange
    const updated = { id: "maint-1", status: "scheduled", notes: "checked in" };
    mockDb.update.mockReturnValue(createChainable([updated]));

    // Act
    const result = await updateMaintenanceRecord(
      "maint-1",
      { status: "scheduled", notes: "checked in" },
      "scheduled",
    );

    // Assert
    expect(result).toEqual(updated);
  });

  it("does not validate a transition when no current status is provided", async () => {
    // Arrange
    const updated = { id: "maint-1", notes: "updated" };
    mockDb.update.mockReturnValue(createChainable([updated]));

    // Act
    const result = await updateMaintenanceRecord("maint-1", { notes: "updated" });

    // Assert
    expect(result).toEqual(updated);
  });
});

describe("isValidMaintenanceTransition", () => {
  it.each([
    ["scheduled", "in_progress", true],
    ["in_progress", "completed", true],
    ["scheduled", "cancelled", true],
    ["in_progress", "cancelled", true],
    ["scheduled", "completed", false],
    ["in_progress", "scheduled", false],
    ["completed", "scheduled", false],
    ["completed", "in_progress", false],
    ["cancelled", "scheduled", false],
    ["cancelled", "in_progress", false],
  ] as const)("%s -> %s is valid: %s", (from, to, expected) => {
    // Act
    const result = isValidMaintenanceTransition(from, to);

    // Assert
    expect(result).toBe(expected);
  });
});

describe("getMaintenanceById", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when the record does not exist", async () => {
    // Arrange
    mockDb.select.mockReturnValue(createChainable([]));

    // Act
    const result = await getMaintenanceById("missing-id");

    // Assert
    expect(result).toBeNull();
  });
});

describe("deleteMaintenanceRecord", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the deleted record when found", async () => {
    // Arrange
    const deleted = { id: "maint-1", description: "Replace filter" };
    mockDb.delete.mockReturnValue(createChainable([deleted]));

    // Act
    const result = await deleteMaintenanceRecord("maint-1");

    // Assert
    expect(result).toEqual(deleted);
  });

  it("returns null when the record does not exist", async () => {
    // Arrange
    mockDb.delete.mockReturnValue(createChainable([]));

    // Act
    const result = await deleteMaintenanceRecord("missing-id");

    // Assert
    expect(result).toBeNull();
  });
});
