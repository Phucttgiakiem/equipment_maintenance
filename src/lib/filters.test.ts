import { buildFilterKey } from "./filters";

describe("buildFilterKey", () => {
  it("joins defined values with a separator", () => {
    // Arrange
    const values = ["pump", "active", "cat-1"];

    // Act
    const key = buildFilterKey(values);

    // Assert
    expect(key).toBe("pump|active|cat-1");
  });

  it("treats undefined values as empty segments", () => {
    // Arrange
    const values = [undefined, "active", undefined];

    // Act
    const key = buildFilterKey(values);

    // Assert
    expect(key).toBe("|active|");
  });

  it("returns the same key for equivalent filter states", () => {
    // Arrange
    const first = ["pump", undefined, "cat-1"];
    const second = ["pump", undefined, "cat-1"];

    // Act
    const firstKey = buildFilterKey(first);
    const secondKey = buildFilterKey(second);

    // Assert
    expect(firstKey).toBe(secondKey);
  });

  it("returns a different key when filters are cleared", () => {
    // Arrange
    const filtered = ["pump", "active", "cat-1"];
    const cleared = [undefined, undefined, undefined];

    // Act
    const filteredKey = buildFilterKey(filtered);
    const clearedKey = buildFilterKey(cleared);

    // Assert
    expect(filteredKey).not.toBe(clearedKey);
  });
});
