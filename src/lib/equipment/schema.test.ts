import {
  createEquipmentSchema,
  equipmentListQuerySchema,
  updateEquipmentSchema,
} from "./schema";

describe("createEquipmentSchema", () => {
  it("accepts a valid payload with only the required fields", () => {
    // Arrange
    const input = { name: "Air Compressor", code: "AC-001" };

    // Act
    const result = createEquipmentSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("defaults status to undefined when not provided, letting the DB default apply", () => {
    // Arrange
    const input = { name: "Air Compressor", code: "AC-001" };

    // Act
    const result = createEquipmentSchema.parse(input);

    // Assert
    expect(result.status).toBeUndefined();
  });

  it("rejects a payload missing the required name", () => {
    // Arrange
    const input = { code: "AC-001" };

    // Act
    const result = createEquipmentSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a payload missing the required code", () => {
    // Arrange
    const input = { name: "Air Compressor" };

    // Act
    const result = createEquipmentSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects an invalid status value", () => {
    // Arrange
    const input = { name: "Air Compressor", code: "AC-001", status: "broken" };

    // Act
    const result = createEquipmentSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("coerces a valid purchase date string into a Date", () => {
    // Arrange
    const input = { name: "Air Compressor", code: "AC-001", purchaseDate: "2024-01-15" };

    // Act
    const result = createEquipmentSchema.parse(input);

    // Assert
    expect(result.purchaseDate).toBeInstanceOf(Date);
  });
});

describe("updateEquipmentSchema", () => {
  it("accepts a partial payload with a single field", () => {
    // Arrange
    const input = { status: "under_maintenance" };

    // Act
    const result = updateEquipmentSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects an empty payload", () => {
    // Arrange
    const input = {};

    // Act
    const result = updateEquipmentSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects an invalid status value", () => {
    // Arrange
    const input = { status: "broken" };

    // Act
    const result = updateEquipmentSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("equipmentListQuerySchema", () => {
  it("accepts an empty query", () => {
    // Arrange
    const input = {};

    // Act
    const result = equipmentListQuerySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status filter", () => {
    // Arrange
    const input = { status: "broken" };

    // Act
    const result = equipmentListQuerySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
