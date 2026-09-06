import { apiClient } from './client';
import { AppNotification } from '../schemas/notification.schema';

export const getNotifications = async (page: number = 1): Promise<{ data: AppNotification[], totalPages: number }> => {
  const response = await apiClient.get<any>(`/notifications?page=${page}`);
  const rawItems = response.data.items || response.data.data || [];
  const mappedData = rawItems.map((n: any) => ({
    id: n.id,
    userId: n.userId,
    title: n.payload?.titleAr || n.payload?.title || 'إشعار جديد',
    body: n.payload?.messageAr || n.payload?.body || 'لديك إشعار جديد.',
    type: n.type?.toLowerCase() || 'unknown',
    referenceId: n.payload?.jobId || n.payload?.conversationId,
    metadata: n.payload,
    isRead: n.isRead,
    createdAt: n.createdAt,
  }));

  return {
    data: mappedData,
    totalPages: response.data.meta?.totalPages || response.data.meta?.pages || 1,
  };
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await apiClient.patch(`/notifications/${id}/read`);
};
