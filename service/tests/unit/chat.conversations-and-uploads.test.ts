import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../mocks/prisma";
import { expectAppError } from "../helpers/errors";
import { ChatConversationsService } from "../../src/modules/chat/chat.conversations.service";
import { ChatInquiryService } from "../../src/modules/chat/chat.inquiry.service";
import { SupportController } from "../../src/modules/support/support.controller";
import { generateUploadUrl } from "../../src/common/utils/r2";
import { presignedUrlSchema } from "../../src/modules/uploads/uploads.schema";
import { cache } from "../../src/common/utils/cache";
import { groupConversationsByPartner } from "../../../mobile/src/utils/groupConversations";

describe("ChatConversationsService.getOrCreateDirectInquiryConversation", () => {
  const u1 = "user-1";
  const u2 = "user-2";

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
    prismaMock.$executeRaw.mockResolvedValue(1 as any);
  });

  it("does NOT match a one-participant or three-participant conversation and creates a new 2-participant DIRECT_INQUIRY", async () => {
    prismaMock.conversation.findMany.mockResolvedValue([
      {
        id: "conv-1p",
        type: "DIRECT_INQUIRY",
        jobId: null,
        participants: [{ id: "p1", conversationId: "conv-1p", userId: u1 }],
      },
      {
        id: "conv-3p",
        type: "DIRECT_INQUIRY",
        jobId: null,
        participants: [
          { id: "p2", conversationId: "conv-3p", userId: u1 },
          { id: "p3", conversationId: "conv-3p", userId: u2 },
          { id: "p4", conversationId: "conv-3p", userId: "user-3" },
        ],
      },
    ] as any);

    prismaMock.conversation.create.mockResolvedValue({
      id: "conv-new",
      type: "DIRECT_INQUIRY",
      jobId: null,
      participants: [
        { id: "p5", conversationId: "conv-new", userId: u1 },
        { id: "p6", conversationId: "conv-new", userId: u2 },
      ],
    } as any);

    const res = await ChatConversationsService.getOrCreateDirectInquiryConversation(u1, u2);

    expect(res.created).toBe(true);
    expect(res.conversation.id).toBe("conv-new");
    expect(prismaMock.conversation.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: "DIRECT_INQUIRY",
          jobId: null,
        }),
      })
    );
  });

  it("returns the existing DIRECT_INQUIRY for the same pair with created=false", async () => {
    const existingConv = {
      id: "conv-existing",
      type: "DIRECT_INQUIRY",
      jobId: null,
      participants: [
        { id: "p1", conversationId: "conv-existing", userId: u1 },
        { id: "p2", conversationId: "conv-existing", userId: u2 },
      ],
    };
    prismaMock.conversation.findMany.mockResolvedValue([existingConv] as any);

    const res = await ChatConversationsService.getOrCreateDirectInquiryConversation(u1, u2);

    expect(res.created).toBe(false);
    expect(res.conversation.id).toBe("conv-existing");
    expect(prismaMock.conversation.create).not.toHaveBeenCalled();
  });

  it("serialized concurrent calls via advisory lock produce one conversation", async () => {
    let store: any[] = [];
    let lockChain = Promise.resolve();

    prismaMock.$transaction.mockImplementation((cb: any) => {
      const next = lockChain.then(() => cb(prismaMock));
      lockChain = next.catch(() => {});
      return next;
    });

    prismaMock.conversation.findMany.mockImplementation((async () => [...store]) as any);
    prismaMock.conversation.create.mockImplementation((async () => {
      const created = {
        id: "conv-single",
        type: "DIRECT_INQUIRY",
        jobId: null,
        participants: [
          { id: "p1", conversationId: "conv-single", userId: u1 },
          { id: "p2", conversationId: "conv-single", userId: u2 },
        ],
      };
      store.push(created);
      return created;
    }) as any);

    const [r1, r2] = await Promise.all([
      ChatConversationsService.getOrCreateDirectInquiryConversation(u1, u2),
      ChatConversationsService.getOrCreateDirectInquiryConversation(u2, u1),
    ]);

    expect(r1.conversation.id).toBe("conv-single");
    expect(r2.conversation.id).toBe("conv-single");
    expect([r1.created, r2.created].sort()).toEqual([false, true]);
    expect(prismaMock.conversation.create).toHaveBeenCalledTimes(1);
  });

  it("enforces Conversation.jobId immutability: no chat or jobs service method exposes convertDirectInquiryToJob or updates conversation.jobId", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const dirs = [
      path.resolve(__dirname, "../../src/modules/chat"),
      path.resolve(__dirname, "../../src/modules/jobs"),
    ];

    for (const dir of dirs) {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts"));
      for (const file of files) {
        const content = fs.readFileSync(path.join(dir, file), "utf8");
        expect(content).not.toMatch(/convertDirectInquiryToJob|convertInquiryToJob/);
        expect(content).not.toMatch(/conversation\.update\s*\(\s*\{[^}]*data\s*:\s*\{[^}]*\bjobId\s*:/);
      }
    }
    expect((ChatConversationsService as any).getOrCreateConversation).toBeUndefined();
    expect(prismaMock.conversation.update).not.toHaveBeenCalled();
  });
});

describe("ChatConversationsService.getMyConversations — SUPPORT and barNumber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null otherParty fields for SUPPORT and returns barNumber for JOB/DIRECT_INQUIRY", async () => {
    const now = new Date("2026-10-29T10:00:00Z");
    prismaMock.conversation.findMany.mockResolvedValue([
      {
        id: "conv-support",
        type: "SUPPORT",
        jobId: null,
        createdAt: now,
        job: null,
        participants: [
          {
            userId: "me",
            user: { id: "me", fullName: "Me", avatarUrl: null, barNumber: "111" },
          },
        ],
        messages: [{ content: "أحتاج مساعدة", createdAt: now }],
      },
      {
        id: "conv-job",
        type: "JOB",
        jobId: "job-1",
        createdAt: now,
        job: { id: "job-1", title: "مهمة قضائية", status: "NEGOTIATING", courtName: "محكمة القاهرة" },
        participants: [
          {
            userId: "me",
            user: { id: "me", fullName: "Me", avatarUrl: null, barNumber: "111" },
          },
          {
            userId: "other-1",
            user: { id: "other-1", fullName: "الأستاذ أحمد", avatarUrl: null, barNumber: "54321" },
          },
        ],
        messages: [{ content: "عرض سعر", createdAt: now }],
      },
    ] as any);

    const list = await ChatConversationsService.getMyConversations("me");

    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({
      id: "conv-support",
      type: "SUPPORT",
      otherPartyId: null,
      otherPartyName: null,
      otherPartyBarNumber: null,
    });
    expect(list[1]).toMatchObject({
      id: "conv-job",
      type: "JOB",
      otherPartyId: "other-1",
      otherPartyName: "الأستاذ أحمد",
      otherPartyBarNumber: "54321",
    });
  });
});

describe("ChatInquiryService.createDirectInquiry — rate limit only on newly created threads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
    prismaMock.$executeRaw.mockResolvedValue(1 as any);
  });

  it("increments daily counter when a new conversation is created, and does NOT increment or block when re-opening an existing conversation", async () => {
    const getSpy = vi.fn().mockResolvedValue("15");
    const incrSpy = vi.fn().mockResolvedValue(16);
    const expireSpy = vi.fn().mockResolvedValue(1);
    (cache as any).get = getSpy;
    (cache as any).incr = incrSpy;
    (cache as any).expire = expireSpy;

    prismaMock.user.findFirst.mockResolvedValue({
      id: "lawyer-2",
      role: "LAWYER",
      verificationStatus: "APPROVED",
    } as any);
    prismaMock.auditLog.create.mockResolvedValue({ id: "audit-1" } as any);

    // 1. Existing conversation found while at quota (15) -> succeeds and does NOT increment
    prismaMock.conversation.findMany.mockResolvedValue([
      {
        id: "conv-existing",
        type: "DIRECT_INQUIRY",
        jobId: null,
        participants: [
          { id: "p1", conversationId: "conv-existing", userId: "lawyer-1" },
          { id: "p2", conversationId: "conv-existing", userId: "lawyer-2" },
        ],
      },
    ] as any);

    const existingAtLimit = await ChatInquiryService.createDirectInquiry("lawyer-1", "lawyer-2");
    expect(existingAtLimit.id).toBe("conv-existing");
    expect(incrSpy).not.toHaveBeenCalled();

    // 2. Re-opening existing conversation when under quota (count=2) -> created=false, does NOT increment
    getSpy.mockResolvedValue("2");
    const existingUnderLimit = await ChatInquiryService.createDirectInquiry("lawyer-1", "lawyer-2");
    expect(existingUnderLimit.id).toBe("conv-existing");
    expect(incrSpy).not.toHaveBeenCalled();

    // 3. Creating a brand-new conversation when under quota (count=2) -> created=true, increments once
    incrSpy.mockResolvedValue(3);
    prismaMock.conversation.findMany.mockResolvedValue([]);
    prismaMock.conversation.create.mockResolvedValue({
      id: "conv-brand-new",
      type: "DIRECT_INQUIRY",
      jobId: null,
      participants: [
        { id: "p1", conversationId: "conv-brand-new", userId: "lawyer-1" },
        { id: "p2", conversationId: "conv-brand-new", userId: "lawyer-2" },
      ],
    } as any);

    const created = await ChatInquiryService.createDirectInquiry("lawyer-1", "lawyer-2");
    expect(created.id).toBe("conv-brand-new");
    expect(incrSpy).toHaveBeenCalledTimes(1);
  });
});

describe("groupConversationsByPartner", () => {
  it("groups multiple jobs and direct inquiries for the same partner, keeps SUPPORT standalone and ungrouped, and sorts by latest activity", () => {
    const raw = [
      {
        id: "c-job-old",
        type: "JOB" as const,
        jobId: "j1",
        jobTitle: "مهمة 1",
        jobStatus: "NEGOTIATING",
        courtName: "محكمة الجيزة",
        otherPartyId: "partner-a",
        otherPartyName: "محمد علي",
        otherPartyAvatar: null,
        otherPartyBarNumber: "9988",
        lastMessage: "رسالة قديمة",
        lastMessageAt: "2026-10-29T08:00:00.000Z",
      },
      {
        id: "c-support-1",
        type: "SUPPORT" as const,
        jobId: null,
        jobTitle: "محادثة دعم",
        jobStatus: null,
        courtName: null,
        otherPartyId: null,
        otherPartyName: null,
        otherPartyAvatar: null,
        otherPartyBarNumber: null,
        lastMessage: "رد الدعم الفني",
        lastMessageAt: "2026-10-29T11:00:00.000Z",
      },
      {
        id: "c-job-new",
        type: "JOB" as const,
        jobId: "j2",
        jobTitle: "مهمة 2",
        jobStatus: "AGREED",
        courtName: "محكمة القاهرة",
        otherPartyId: "partner-a",
        otherPartyName: "محمد علي",
        otherPartyAvatar: null,
        otherPartyBarNumber: "9988",
        lastMessage: "رسالة أحدث",
        lastMessageAt: "2026-10-29T12:00:00.000Z",
      },
      {
        id: "c-di-a",
        type: "DIRECT_INQUIRY" as const,
        jobId: null,
        jobTitle: "استفسار مباشر",
        jobStatus: null,
        courtName: null,
        otherPartyId: "partner-a",
        otherPartyName: "محمد علي",
        otherPartyAvatar: null,
        otherPartyBarNumber: "9988",
        lastMessage: "استفسار",
        lastMessageAt: "2026-10-29T09:00:00.000Z",
      },
      {
        id: "c-single",
        type: "JOB" as const,
        jobId: "j3",
        jobTitle: "مهمة منفردة",
        jobStatus: "NEGOTIATING",
        courtName: "محكمة الإسكندرية",
        otherPartyId: "partner-b",
        otherPartyName: "سارة حسن",
        otherPartyAvatar: null,
        otherPartyBarNumber: "4455",
        lastMessage: "مرحبا",
        lastMessageAt: "2026-10-29T10:00:00.000Z",
      },
    ];

    const groups = groupConversationsByPartner(raw);

    expect(groups).toHaveLength(3);

    // 1st group: partner-a (newest at 12:00)
    expect(groups[0].groupKey).toBe("partner:partner-a");
    expect(groups[0].isSupport).toBe(false);
    expect(groups[0].jobCount).toBe(2); // 2 JOB threads, 1 DIRECT_INQUIRY
    expect(groups[0].threads).toHaveLength(3);
    expect(groups[0].threads.map((t) => t.id)).toEqual(["c-job-new", "c-di-a", "c-job-old"]);
    expect(groups[0].latestMessage).toBe("رسالة أحدث");
    expect(groups[0].otherPartyBarNumber).toBe("9988");

    // 2nd group: SUPPORT (at 11:00), never keyed on otherPartyId
    expect(groups[1].groupKey).toBe("support:c-support-1");
    expect(groups[1].isSupport).toBe(true);
    expect(groups[1].otherPartyId).toBeNull();
    expect(groups[1].otherPartyName).toBe("الدعم الفني");
    expect(groups[1].threads).toHaveLength(1);

    // 3rd group: partner-b single thread (at 10:00)
    expect(groups[2].groupKey).toBe("partner:partner-b");
    expect(groups[2].jobCount).toBe(1);
    expect(groups[2].threads).toHaveLength(1);
  });
});

describe("SupportController.createConversation — concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$executeRaw.mockResolvedValue(1 as any);
  });

  it("two concurrent creations produce one SUPPORT conversation", async () => {
    let supportConv: any = null;
    let lockChain = Promise.resolve();

    prismaMock.$transaction.mockImplementation((cb: any) => {
      const next = lockChain.then(() => cb(prismaMock));
      lockChain = next.catch(() => {});
      return next;
    });

    prismaMock.conversation.findFirst.mockImplementation((async () => supportConv) as any);
    prismaMock.conversation.create.mockImplementation((async () => {
      supportConv = {
        id: "support-conv-1",
        type: "SUPPORT",
        supportStatus: "OPEN",
        participants: [{ id: "sp1", conversationId: "support-conv-1", userId: "lawyer-1" }],
      };
      return supportConv;
    }) as any);

    const makeRes = () => {
      const res: any = { statusCode: 200, body: null };
      res.status = vi.fn((code: number) => {
        res.statusCode = code;
        return res;
      });
      res.json = vi.fn((payload: any) => {
        res.body = payload;
        return res;
      });
      return res;
    };

    const req1: any = { user: { userId: "lawyer-1" } };
    const req2: any = { user: { userId: "lawyer-1" } };
    const res1 = makeRes();
    const res2 = makeRes();
    const next = vi.fn();

    await Promise.all([
      SupportController.createConversation(req1, res1, next),
      SupportController.createConversation(req2, res2, next),
    ]);

    expect(res1.body.data.id).toBe("support-conv-1");
    expect(res2.body.data.id).toBe("support-conv-1");
    expect([res1.statusCode, res2.statusCode].sort()).toEqual([200, 201]);
    expect(prismaMock.conversation.create).toHaveBeenCalledTimes(1);
  });
});

describe("Upload purpose allowlist & schema", () => {
  it("accepts png and webp for NEGOTIATION_ATTACHMENT", async () => {
    const pngPayload = JSON.parse(
      await generateUploadUrl("conv/1/a.png", "image/png", "NEGOTIATION_ATTACHMENT")
    );
    const webpPayload = JSON.parse(
      await generateUploadUrl("conv/1/b.webp", "image/webp", "NEGOTIATION_ATTACHMENT")
    );

    expect(pngPayload.allowed_formats).toBe("jpg,jpeg,png,webp");
    expect(webpPayload.allowed_formats).toBe("jpg,jpeg,png,webp");
  });

  it("rejects pdf and executable content types for NEGOTIATION_ATTACHMENT", async () => {
    await expectAppError(
      () => generateUploadUrl("conv/1/doc.pdf", "application/pdf", "NEGOTIATION_ATTACHMENT"),
      "UNSUPPORTED_FILE_TYPE"
    );
    await expectAppError(
      () => generateUploadUrl("conv/1/run.exe", "application/x-msdownload", "NEGOTIATION_ATTACHMENT"),
      "UNSUPPORTED_FILE_TYPE"
    );
  });

  it("still accepts pdf for VERIFICATION_DOCUMENT", async () => {
    const pdfPayload = JSON.parse(
      await generateUploadUrl("verification/u1/doc.pdf", "application/pdf", "VERIFICATION_DOCUMENT")
    );
    expect(pdfPayload.allowed_formats).toBe("jpg,jpeg,png,pdf");
  });

  it("accepts webp for SUBSCRIPTION_RECEIPT and rejects pdf (both via generateUploadUrl and SubscriptionService.getReceiptUploadUrl)", async () => {
    const { SubscriptionService } = await import("../../src/modules/subscription/subscription.service");
    const webpPayload = JSON.parse(
      await generateUploadUrl("subscription-receipts/u1/r.webp", "image/webp", "SUBSCRIPTION_RECEIPT")
    );
    expect(webpPayload.allowed_formats).toBe("jpg,jpeg,png,webp");

    const receiptRes = await SubscriptionService.getReceiptUploadUrl("u1", "image/webp");
    expect(JSON.parse(receiptRes.uploadUrl).allowed_formats).toBe("jpg,jpeg,png,webp");

    await expectAppError(
      () => generateUploadUrl("subscription-receipts/u1/r.pdf", "application/pdf", "SUBSCRIPTION_RECEIPT"),
      "UNSUPPORTED_FILE_TYPE"
    );
    await expectAppError(
      () => SubscriptionService.getReceiptUploadUrl("u1", "application/pdf"),
      "UNSUPPORTED_FILE_TYPE"
    );
  });

  it("prevents client from passing a purpose field in presignedUrlSchema", () => {
    const parsed = presignedUrlSchema.safeParse({
      fileName: "doc.pdf",
      fileType: "application/pdf",
      fileSize: 1024,
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
      purpose: "VERIFICATION_DOCUMENT",
    });
    expect(parsed.success).toBe(false);
  });
});
