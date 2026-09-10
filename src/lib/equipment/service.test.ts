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
  EquipmentCodeConflictError,
  createEquipment,
  deleteEquipment,
  getEquipmentById,
  updateEquipment,
} from "./service";

describe("createEquipment", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the created record on success", async () => {
    // Arrange
    const created = { id: "equip-1", name: "Air Compressor", code: "AC-001" };
    mockDb.insert.mockReturnValue(createChainable([created]));

    // Act
    const result = await createEquipment(
      { name: "Air Compressor", code: "AC-001" },
      "user-1",
    );

    // Assert
    expect(result).toEqual(created);
  });

  it("throws EquipmentCodeConflictError when the code already exists", async () => {
    // Arrange
    mockDb.insert.mockReturnValue(createChainable({ code: "23505" }, true));

    // Act
    const act = createEquipment({ name: "Air Compressor", code: "AC-001" }, "user-1");

    // Assert
    await expect(act).rejects.toBeInstanceOf(EquipmentCodeConflictError);
  });

  it("rethrows unrelated database errors", async () => {
    // Arrange
    const dbError = new Error("connection lost");
    mockDb.insert.mockReturnValue(createChainable(dbError, true));

    // Act
    const act = createEquipment({ name: "Air Compressor", code: "AC-001" }, "user-1");

    // Assert
    await expect(act).rejects.toBe(dbError);
  });
});

describe("updateEquipment", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the updated record on success", async () => {
    // Arrange
    const updated = { id: "equip-1", name: "Air Compressor", code: "AC-002" };
    mockDb.update.mockReturnValue(createChainable([updated]));

    // Act
    const result = await updateEquipment("equip-1", { code: "AC-002" });

    // Assert
    expect(result).toEqual(updated);
  });

  it("returns null when the record does not exist", async () => {
    // Arrange
    mockDb.update.mockReturnValue(createChainable([]));

    // Act
    const result = await updateEquipment("missing-id", { code: "AC-002" });

    // Assert
    expect(result).toBeNull();
  });

  it("throws EquipmentCodeConflictError when the new code already exists", async () => {
    // Arrange
    mockDb.update.mockReturnValue(createChainable({ code: "23505" }, true));

    // Act
    const act = updateEquipment("equip-1", { code: "AC-002" });

    // Assert
    await expect(act).rejects.toBeInstanceOf(EquipmentCodeConflictError);
  });
});

describe("getEquipmentById", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when the record does not exist", async () => {
    // Arrange
    mockDb.select.mockReturnValue(createChainable([]));

    // Act
    const result = await getEquipmentById("missing-id");

    // Assert
    expect(result).toBeNull();
  });
});

describe("deleteEquipment", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the deleted record when found", async () => {
    // Arrange
    const deleted = { id: "equip-1", name: "Air Compressor" };
    mockDb.delete.mockReturnValue(createChainable([deleted]));

    // Act
    const result = await deleteEquipment("equip-1");

    // Assert
    expect(result).toEqual(deleted);
  });

  it("returns null when the record does not exist", async () => {
    // Arrange
    mockDb.delete.mockReturnValue(createChainable([]));

    // Act
    const result = await deleteEquipment("missing-id");

    // Assert
    expect(result).toBeNull();
  });
});
