import { User } from "@prisma/client";
import { v4 as randomUUID } from "uuid";

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-" + randomUUID(),
    fullName: "أحمد سالم",
    email: `test-${Date.now()}@example.com`,
    phone: "01000000000",
    barId: "BAR-" + Math.floor(Math.random() * 100000),
    passwordHash: "hashed",
    role: "BOTH",
    status: "ACTIVE",
    verificationStatus: "APPROVED",
    expoPushToken: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    resetToken: null,
    resetTokenExpiry: null,
    ...overrides,
  };
}
