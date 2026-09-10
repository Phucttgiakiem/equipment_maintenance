import { authorizeMaintenanceUpdate } from "./authorize";

describe("authorizeMaintenanceUpdate", () => {
  it("grants full access to an admin regardless of assignment", () => {
    // Arrange
    const user = { id: "admin-1", role: "admin" as const };
    const record = { technicianId: "someone-else" };

    // Act
    const result = authorizeMaintenanceUpdate(user, record);

    // Assert
    expect(result).toEqual({ allowed: true, scope: "full" });
  });

  it("grants self-scoped access to the technician assigned to the record", () => {
    // Arrange
    const user = { id: "tech-1", role: "technician" as const };
    const record = { technicianId: "tech-1" };

    // Act
    const result = authorizeMaintenanceUpdate(user, record);

    // Assert
    expect(result).toEqual({ allowed: true, scope: "self" });
  });

  it("denies a technician who is not assigned to the record", () => {
    // Arrange
    const user = { id: "tech-1", role: "technician" as const };
    const record = { technicianId: "tech-2" };

    // Act
    const result = authorizeMaintenanceUpdate(user, record);

    // Assert
    expect(result).toEqual({ allowed: false });
  });

  it("denies a technician when the record has no assigned technician", () => {
    // Arrange
    const user = { id: "tech-1", role: "technician" as const };
    const record = { technicianId: null };

    // Act
    const result = authorizeMaintenanceUpdate(user, record);

    // Assert
    expect(result).toEqual({ allowed: false });
  });
});
