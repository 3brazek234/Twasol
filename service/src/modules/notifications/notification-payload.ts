import { NotificationType } from '@prisma/client';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  titleAr: string;        // REQUIRED — shown as push title
  messageAr: string;       // REQUIRED — shown as push body
  data?: Record<string, unknown>;  // extra payload for deep-linking
}

export function buildNotification(payload: NotificationPayload) {
  return {
    userId: payload.userId,
    type: payload.type,
    payload: {
      titleAr: payload.titleAr,
      messageAr: payload.messageAr,
      ...(payload.data ?? {}),
    },
  };
}
