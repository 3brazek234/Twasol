import { Application, Message, Review, Notification } from "@prisma/client";
import { v4 as randomUUID } from "uuid";

export function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-" + randomUUID(),
    jobId: "job-id",
    lawyerId: "lawyer-id",
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg-" + randomUUID(),
    conversationId: "conv-id",
    senderId: "sender-id",
    content: "Message content",
    type: "TEXT",
    status: "DELIVERED",
    amount: null,
    createdAt: new Date(),
    ...overrides,
  };
}

export function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: "rev-" + randomUUID(),
    jobId: "job-id",
    reviewerId: "reviewer-id",
    revieweeId: "reviewee-id",
    rating: 5,
    comment: null,
    createdAt: new Date(),
    ...overrides,
  };
}

export function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notif-" + randomUUID(),
    userId: "user-id",
    titleAr: "إشعار",
    titleEn: "Notification",
    messageAr: "محتوى",
    messageEn: "Content",
    type: "SYSTEM",
    referenceId: null,
    isRead: false,
    createdAt: new Date(),
    ...overrides,
  };
}
