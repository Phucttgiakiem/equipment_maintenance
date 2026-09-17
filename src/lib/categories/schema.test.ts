import { createCategorySchema, updateCategorySchema } from "./schema";

describe("createCategorySchema", () => {
  it("accepts a valid name", () => {
    // Arrange
    const input = { name: "Compressors" };

    // Act
    const result = createCategorySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    // Arrange
    const input = { name: "" };

    // Act
    const result = createCategorySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a missing name", () => {
    // Arrange
    const input = {};

    // Act
    const result = createCategorySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("trims whitespace from the name", () => {
    // Arrange
    const input = { name: "  Compressors  " };

    // Act
    const result = createCategorySchema.parse(input);

    // Assert
    expect(result.name).toBe("Compressors");
  });
});

describe("updateCategorySchema", () => {
  it("accepts a valid name", () => {
    // Arrange
    const input = { name: "Generators" };

    // Act
    const result = updateCategorySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    // Arrange
    const input = { name: "" };

    // Act
    const result = updateCategorySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
