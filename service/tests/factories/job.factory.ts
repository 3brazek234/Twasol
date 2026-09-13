import { Job } from "@prisma/client";
import { v4 as randomUUID } from "uuid";

export function makeJob(overrides: Partial<Job> = {}): Job {
  const now = new Date();
  const deadline = new Date(now);
  deadline.setDate(deadline.getDate() + 7);

  return {
    id: "job-" + randomUUID(),
    posterId: "poster-id",
    courtId: "court-id",
    title: "تقديم مذكرة دفاع",
    description: null,
    taskType: "PLEADING",
    salaryMin: 1000,
    salaryMax: 2000,
    agreedSalary: null,
    expiresAt: deadline,
    status: "OPEN",
    version: 0,
    agreedAt: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
    assignedExecutorId: null,
    invitedLawyerId: null,
    postedByUserId: "poster-id",
    assignedLawyerId: null,
    posterName: "Poster Name",
    assignedLawyerName: null,
    conversationId: null,
    ...overrides,
  };
}
