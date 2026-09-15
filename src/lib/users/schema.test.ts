import { changePasswordSchema, registerSchema, resetPasswordSchema, userListQuerySchema } from "./schema";

describe("registerSchema", () => {
  it("accepts a valid name/email/password/confirmPassword payload", () => {
    // Arrange
    const input = {
      name: "Jamie Tech",
      email: "jamie@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("lowercases and trims the email", () => {
    // Arrange
    const input = {
      name: "Jamie Tech",
      email: "  Jamie@Example.com  ",
      password: "password123",
      confirmPassword: "password123",
    };

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
      confirmPassword: "password123",
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
      confirmPassword: "password123",
      isActive: true,
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    // Arrange
    const input = {
      name: "Jamie Tech",
      email: "jamie@example.com",
      password: "short",
      confirmPassword: "short",
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a missing name", () => {
    // Arrange
    const input = {
      email: "jamie@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a password/confirmPassword mismatch", () => {
    // Arrange
    const input = {
      name: "Jamie Tech",
      email: "jamie@example.com",
      password: "password123",
      confirmPassword: "different123",
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts a valid current/new/confirm payload", () => {
    // Arrange
    const input = {
      currentPassword: "oldpassword1",
      newPassword: "newpassword1",
      confirmPassword: "newpassword1",
    };

    // Act
    const result = changePasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects a newPassword/confirmPassword mismatch", () => {
    // Arrange
    const input = {
      currentPassword: "oldpassword1",
      newPassword: "newpassword1",
      confirmPassword: "different1",
    };

    // Act
    const result = changePasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a newPassword shorter than 8 characters", () => {
    // Arrange
    const input = {
      currentPassword: "oldpassword1",
      newPassword: "short",
      confirmPassword: "short",
    };

    // Act
    const result = changePasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a missing currentPassword", () => {
    // Arrange
    const input = { newPassword: "newpassword1", confirmPassword: "newpassword1" };

    // Act
    const result = changePasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects an unexpected extra field", () => {
    // Arrange
    const input = {
      currentPassword: "oldpassword1",
      newPassword: "newpassword1",
      confirmPassword: "newpassword1",
      userId: "user-1",
    };

    // Act
    const result = changePasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts a valid newPassword", () => {
    // Arrange
    const input = { newPassword: "temppassword1" };

    // Act
    const result = resetPasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects a newPassword shorter than 8 characters", () => {
    // Arrange
    const input = { newPassword: "short" };

    // Act
    const result = resetPasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects an unexpected extra field", () => {
    // Arrange
    const input = { newPassword: "temppassword1", confirmPassword: "temppassword1" };

    // Act
    const result = resetPasswordSchema.safeParse(input);

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
