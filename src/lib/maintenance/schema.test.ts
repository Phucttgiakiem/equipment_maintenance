import {
  createMaintenanceSchema,
  maintenanceListQuerySchema,
  technicianSelfUpdateSchema,
  updateMaintenanceSchema,
} from "./schema";

const validEquipmentId = "123e4567-e89b-12d3-a456-426614174000";
const validTechnicianId = "223e4567-e89b-12d3-a456-426614174000";

describe("createMaintenanceSchema", () => {
  it("accepts a valid payload with only the required fields", () => {
    // Arrange
    const input = {
      equipmentId: validEquipmentId,
      scheduledDate: "2024-06-01",
      description: "Replace air filter",
    };

    // Act
    const result = createMaintenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing the required equipmentId", () => {
    // Arrange
    const input = { scheduledDate: "2024-06-01", description: "Replace air filter" };

    // Act
    const result = createMaintenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a payload missing the required scheduledDate", () => {
    // Arrange
    const input = { equipmentId: validEquipmentId, description: "Replace air filter" };

    // Act
    const result = createMaintenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects an invalid status value", () => {
    // Arrange
    const input = {
      equipmentId: validEquipmentId,
      scheduledDate: "2024-06-01",
      description: "Replace air filter",
      status: "not-a-status",
    };

    // Act
    const result = createMaintenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("does not require completedDate for non-completed statuses", () => {
    // Arrange
    const input = {
      equipmentId: validEquipmentId,
      scheduledDate: "2024-06-01",
      description: "Replace air filter",
      status: "scheduled",
    };

    // Act
    const result = createMaintenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });
});

describe("updateMaintenanceSchema", () => {
  it("accepts a partial payload with a single field (a status transition)", () => {
    // Arrange
    const input = { status: "in_progress" };

    // Act
    const result = updateMaintenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("accepts reassigning the technician", () => {
    // Arrange
    const input = { technicianId: validTechnicianId };

    // Act
    const result = updateMaintenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("accepts clearing the technician assignment", () => {
    // Arrange
    const input = { technicianId: null };

    // Act
    const result = updateMaintenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects an empty payload", () => {
    // Arrange
    const input = {};

    // Act
    const result = updateMaintenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("technicianSelfUpdateSchema", () => {
  it("accepts a status transition", () => {
    // Arrange
    const input = { status: "completed" };

    // Act
    const result = technicianSelfUpdateSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("accepts status together with completedDate and notes", () => {
    // Arrange
    const input = { status: "completed", completedDate: "2024-06-05", notes: "Done" };

    // Act
    const result = technicianSelfUpdateSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects an attempt to reassign the technician", () => {
    // Arrange
    const input = { technicianId: validTechnicianId };

    // Act
    const result = technicianSelfUpdateSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects an attempt to change the equipment reference", () => {
    // Arrange
    const input = { equipmentId: validEquipmentId };

    // Act
    const result = technicianSelfUpdateSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects an empty payload", () => {
    // Arrange
    const input = {};

    // Act
    const result = technicianSelfUpdateSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("maintenanceListQuerySchema", () => {
  it("accepts an empty query", () => {
    // Arrange
    const input = {};

    // Act
    const result = maintenanceListQuerySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects a non-uuid equipmentId filter", () => {
    // Arrange
    const input = { equipmentId: "not-a-uuid" };

    // Act
    const result = maintenanceListQuerySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
