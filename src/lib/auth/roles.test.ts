import { hasRequiredRole } from "./roles";

describe("hasRequiredRole", () => {
  it("returns true when the role is in the allowed list", () => {
    // Arrange
    const role = "admin";
    const allowed: ("admin" | "technician")[] = ["admin"];

    // Act
    const result = hasRequiredRole(role, allowed);

    // Assert
    expect(result).toBe(true);
  });

  it("returns false when the role is not in the allowed list", () => {
    // Arrange
    const role = "technician";
    const allowed: ("admin" | "technician")[] = ["admin"];

    // Act
    const result = hasRequiredRole(role, allowed);

    // Assert
    expect(result).toBe(false);
  });

  it("returns false when the role is missing", () => {
    // Arrange
    const role = undefined;
    const allowed: ("admin" | "technician")[] = ["admin", "technician"];

    // Act
    const result = hasRequiredRole(role, allowed);

    // Assert
    expect(result).toBe(false);
  });
});
