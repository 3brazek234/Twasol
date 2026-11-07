import type { ConversationSummary } from '../api/conversations.api';

export interface PartnerConversationGroup {
  groupKey: string;
  isSupport: boolean;
  otherPartyId: string | null;
  otherPartyName: string;
  otherPartyBarNumber: string | null;
  latestMessage: string | null;
  latestMessageAt: string;
  jobCount: number;
  threads: ConversationSummary[];
}

/**
 * Pure helper to group JOB and DIRECT_INQUIRY conversations by the other participant.
 * - SUPPORT conversations are never grouped, never keyed on otherPartyId, and display as "الدعم الفني".
 * - Within each group, threads are sorted by lastMessageAt descending.
 * - All returned groups are sorted by latestMessageAt descending.
 */
export function groupConversationsByPartner(
  conversations: ConversationSummary[]
): PartnerConversationGroup[] {
  const groupsMap = new Map<string, PartnerConversationGroup>();
  const standaloneGroups: PartnerConversationGroup[] = [];

  for (const conv of conversations) {
    if (conv.type === 'SUPPORT') {
      standaloneGroups.push({
        groupKey: `support:${conv.id}`,
        isSupport: true,
        otherPartyId: null,
        otherPartyName: 'الدعم الفني',
        otherPartyBarNumber: null,
        latestMessage: conv.lastMessage,
        latestMessageAt: conv.lastMessageAt,
        jobCount: 0,
        threads: [conv],
      });
      continue;
    }

    const partnerKey = conv.otherPartyId
      ? `partner:${conv.otherPartyId}`
      : `conv:${conv.id}`;

    const existing = groupsMap.get(partnerKey);
    if (!existing) {
      groupsMap.set(partnerKey, {
        groupKey: partnerKey,
        isSupport: false,
        otherPartyId: conv.otherPartyId ?? null,
        otherPartyName: conv.otherPartyName ?? 'الطرف الآخر',
        otherPartyBarNumber: conv.otherPartyBarNumber ?? null,
        latestMessage: conv.lastMessage,
        latestMessageAt: conv.lastMessageAt,
        jobCount: conv.type === 'JOB' ? 1 : 0,
        threads: [conv],
      });
    } else {
      existing.threads.push(conv);
      if (conv.type === 'JOB') {
        existing.jobCount += 1;
      }
      if (!existing.otherPartyBarNumber && conv.otherPartyBarNumber) {
        existing.otherPartyBarNumber = conv.otherPartyBarNumber;
      }
      const existingTime = new Date(existing.latestMessageAt).getTime();
      const candidateTime = new Date(conv.lastMessageAt).getTime();
      if (candidateTime > existingTime) {
        existing.latestMessageAt = conv.lastMessageAt;
        existing.latestMessage = conv.lastMessage;
      }
    }
  }

  const allGroups = [...groupsMap.values(), ...standaloneGroups];

  for (const group of allGroups) {
    group.threads.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
    const newest = group.threads[0];
    if (newest) {
      group.latestMessageAt = newest.lastMessageAt;
      group.latestMessage = newest.lastMessage;
    }
  }

  allGroups.sort(
    (a, b) => new Date(b.latestMessageAt).getTime() - new Date(a.latestMessageAt).getTime()
  );

  return allGroups;
}
