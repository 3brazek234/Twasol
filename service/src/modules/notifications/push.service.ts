import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from '../../prisma';
import { logger } from '../../common/utils/logger';

const expo = new Expo();

export class PushNotificationService {
  /**
   * Send a push notification to a specific user.
   * This is meant to be called whenever a new in-app notification is created.
   */
  static async sendPushToUser(userId: string, title: string, body: string, data?: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushTokens: true }
      });

      if (!user || !user.pushTokens || user.pushTokens.length === 0) {
        return; // User has no registered devices
      }

      const messages: ExpoPushMessage[] = [];
      for (const pushToken of user.pushTokens) {
        if (!Expo.isExpoPushToken(pushToken)) {
          logger.warn({ pushToken }, 'Push token is not a valid Expo push token');
          continue;
        }

        messages.push({
          to: pushToken,
          sound: 'default',
          title,
          body,
          data: data || {},
        });
      }

      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      // Send the chunks to the Expo push notification service
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (err) {
          logger.error({ err }, 'Error sending push notification chunk');
        }
      }

      // In a production environment, you would also want to process the receipts
      // to remove invalid/unregistered tokens, but this is sufficient for MVP.

    } catch (err) {
      logger.error({ err, userId }, 'Failed to send push notification to user');
    }
  }
}
