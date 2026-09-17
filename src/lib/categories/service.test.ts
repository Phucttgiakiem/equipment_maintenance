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
  CategoryInUseError,
  CategoryNameConflictError,
  createCategory,
  deleteCategory,
  updateCategory,
} from "./service";

describe("createCategory", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the created record on success", async () => {
    // Arrange
    const created = { id: "cat-1", name: "Compressors" };
    mockDb.insert.mockReturnValue(createChainable([created]));

    // Act
    const result = await createCategory({ name: "Compressors" });

    // Assert
    expect(result).toEqual(created);
  });

  it("throws CategoryNameConflictError when the name already exists", async () => {
    // Arrange
    mockDb.insert.mockReturnValue(createChainable({ code: "23505" }, true));

    // Act
    const act = createCategory({ name: "Compressors" });

    // Assert
    await expect(act).rejects.toBeInstanceOf(CategoryNameConflictError);
  });

  it("rethrows unrelated database errors", async () => {
    // Arrange
    const dbError = new Error("connection lost");
    mockDb.insert.mockReturnValue(createChainable(dbError, true));

    // Act
    const act = createCategory({ name: "Compressors" });

    // Assert
    await expect(act).rejects.toBe(dbError);
  });
});

describe("updateCategory", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the updated record on success", async () => {
    // Arrange
    const updated = { id: "cat-1", name: "Generators" };
    mockDb.update.mockReturnValue(createChainable([updated]));

    // Act
    const result = await updateCategory("cat-1", { name: "Generators" });

    // Assert
    expect(result).toEqual(updated);
  });

  it("returns null when the record does not exist", async () => {
    // Arrange
    mockDb.update.mockReturnValue(createChainable([]));

    // Act
    const result = await updateCategory("missing-id", { name: "Generators" });

    // Assert
    expect(result).toBeNull();
  });

  it("throws CategoryNameConflictError when the new name already exists", async () => {
    // Arrange
    mockDb.update.mockReturnValue(createChainable({ code: "23505" }, true));

    // Act
    const act = updateCategory("cat-1", { name: "Generators" });

    // Assert
    await expect(act).rejects.toBeInstanceOf(CategoryNameConflictError);
  });
});

describe("deleteCategory", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deletes the category when it is not referenced by any equipment", async () => {
    // Arrange
    mockDb.select.mockReturnValue(createChainable([]));
    const deleted = { id: "cat-1", name: "Compressors" };
    mockDb.delete.mockReturnValue(createChainable([deleted]));

    // Act
    const result = await deleteCategory("cat-1");

    // Assert
    expect(result).toEqual(deleted);
  });

  it("throws CategoryInUseError when equipment references the category", async () => {
    // Arrange
    mockDb.select.mockReturnValue(createChainable([{ id: "equip-1" }]));

    // Act
    const act = deleteCategory("cat-1");

    // Assert
    await expect(act).rejects.toBeInstanceOf(CategoryInUseError);
    expect(mockDb.delete).not.toHaveBeenCalled();
  });

  it("returns null when the record does not exist", async () => {
    // Arrange
    mockDb.select.mockReturnValue(createChainable([]));
    mockDb.delete.mockReturnValue(createChainable([]));

    // Act
    const result = await deleteCategory("missing-id");

    // Assert
    expect(result).toBeNull();
  });
});
