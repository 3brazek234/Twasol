import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../mocks/prisma";
import { expectAppError } from "../helpers/errors";

vi.mock("../../src/modules/notifications/notifications.service", () => ({
  NotificationsService: { notifyManyUsers: vi.fn().mockResolvedValue(undefined) },
}));

import { ChatMessagesService } from "../../src/modules/chat/chat.messages.service";

const jobId = "job-1";
const conversationId = "conv-1";
const messageId = "msg-1";
const posterId = "poster-1";
const lawyerId = "lawyer-1";

function offerMessage(senderId: string) {
  return {
    id: messageId,
    conversationId,
    senderId,
    type: "OFFER",
    offerAmount: 1500,
    offerStatus: "PENDING",
    conversation: {
      id: conversationId,
      jobId,
      type: "JOB",
      job: { postedByUserId: posterId, title: "حضور جلسة" },
      participants: [
        { id: "p1", conversationId, userId: posterId },
        { id: "p2", conversationId, userId: lawyerId },
      ],
    },
  } as any;
}

describe("ChatMessagesService.acceptOffer — lawyer assignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
    prismaMock.conflictDeclaration.findUnique.mockResolvedValue(null);
    prismaMock.message.updateMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.job.findUnique.mockResolvedValue({ id: jobId, postedByUserId: posterId, status: "NEGOTIATING", version: 3 } as any);
    prismaMock.user.findUnique.mockResolvedValue({ role: "LAWYER", accountMode: "GIG" } as any);
    prismaMock.job.updateMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.message.findUnique.mockResolvedValue({ id: messageId } as any);
  });

  const assignedLawyerId = () =>
    (prismaMock.job.updateMany.mock.calls[0][0] as any).data.assignedLawyerId;

  it("Scenario A: lawyer sends offer, poster accepts → assigns the lawyer", async () => {
    prismaMock.message.findUniqueOrThrow.mockResolvedValue(offerMessage(lawyerId));

    await ChatMessagesService.acceptOffer(messageId, posterId);

    expect(assignedLawyerId()).toBe(lawyerId);
  });

  it("Scenario B: poster sends counter-offer, lawyer accepts → STILL assigns the lawyer", async () => {
    prismaMock.message.findUniqueOrThrow.mockResolvedValue(offerMessage(posterId));

    await ChatMessagesService.acceptOffer(messageId, lawyerId);

    expect(assignedLawyerId()).toBe(lawyerId);
    expect(assignedLawyerId()).not.toBe(posterId);
    expect(prismaMock.conflictDeclaration.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { jobId_lawyerId: { jobId, lawyerId } },
    }));
  });

  it("rejects the sender accepting their own offer", async () => {
    prismaMock.message.findUniqueOrThrow.mockResolvedValue(offerMessage(lawyerId));

    await expectAppError(() => ChatMessagesService.acceptOffer(messageId, lawyerId), "FORBIDDEN");
    expect(prismaMock.job.updateMany).not.toHaveBeenCalled();
  });
});
