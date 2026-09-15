import { registerSchema, userListQuerySchema } from "./schema";

describe("registerSchema", () => {
  it("accepts a valid name/email/password payload", () => {
    // Arrange
    const input = { name: "Jamie Tech", email: "jamie@example.com", password: "password123" };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("lowercases and trims the email", () => {
    // Arrange
    const input = { name: "Jamie Tech", email: "  Jamie@Example.com  ", password: "password123" };

    // Act
    const result = registerSchema.parse(input);

    // Assert
    expect(result.email).toBe("jamie@example.com");
  });

  it("rejects a payload with a client-supplied role", () => {
    // Arrange
    const input = {
      name: "Jamie Tech",
      email: "jamie@example.com",
      password: "password123",
      role: "admin",
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a payload with any other unexpected field", () => {
    // Arrange
    const input = {
      name: "Jamie Tech",
      email: "jamie@example.com",
      password: "password123",
      isActive: true,
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    // Arrange
    const input = { name: "Jamie Tech", email: "jamie@example.com", password: "short" };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a missing name", () => {
    // Arrange
    const input = { email: "jamie@example.com", password: "password123" };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("userListQuerySchema", () => {
  it("accepts an empty query", () => {
    // Arrange
    const input = {};

    // Act
    const result = userListQuerySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("transforms the isActive string filter into a boolean", () => {
    // Arrange
    const input = { isActive: "true" };

    // Act
    const result = userListQuerySchema.parse(input);

    // Assert
    expect(result.isActive).toBe(true);
  });

  it("rejects an invalid registrationStatus filter", () => {
    // Arrange
    const input = { registrationStatus: "unknown" };

    // Act
    const result = userListQuerySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
