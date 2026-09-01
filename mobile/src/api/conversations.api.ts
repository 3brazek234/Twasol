// src/api/conversations.api.ts
import { apiClient } from './client';

export interface ConversationSummary {
  id: string;
  type: string;
  jobId: string | null;
  jobTitle: string | null;
  otherPartyName: string;
  lastMessage: string | null;
  lastMessageAt: string;
}

/**
 * Fetch all conversations the logged-in user is a participant of.
 */
export const fetchConversations = async (): Promise<ConversationSummary[]> => {
  const res = await apiClient.get<any>('/conversations');
  return res.data;
};

export const fetchMessages = async (conversationId: string, cursor?: string): Promise<{data: any[], meta: any}> => {
  const res = await apiClient.get<any>(`/conversations/${conversationId}/messages`, { params: { cursor } });
  return res.data;
};

/**
 * Creates (or fetches existing) a conversation for a given job.
 * The backend creates this automatically when applying — this is a fallback.
 */
export const createConversation = async (payload: {
  jobId: string;
  posterId: string;
}): Promise<string> => {
  // Use the job-apply endpoint which auto-creates the conversation
  const res = await apiClient.post<any>(`/jobs/${payload.jobId}/chat`);
  return res.data.data?.id || res.data.id;
};
