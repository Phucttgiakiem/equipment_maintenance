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
  MaintenanceReferenceError,
  createMaintenanceRecord,
  deleteMaintenanceRecord,
  getMaintenanceById,
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
