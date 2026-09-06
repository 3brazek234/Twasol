import { buildNotification } from "../notifications/notification-payload";
import { NotificationsService } from "../notifications/notifications.service";

import { Server, Socket } from 'socket.io';
import { withValidation } from '../../socket/withValidation';
import { joinConversationSchema, sendMessageSchema, acceptOfferSchema, rejectOfferSchema } from './chat.schema';
import { ChatService } from './chat.service';
import { prisma } from '../../prisma';
import { NotificationType } from '@prisma/client';

export function registerChatHandlers(io: Server, socket: Socket, userId: string) {
  socket.on('conversation:join', withValidation(joinConversationSchema, async (data) => {
    const conversation = await prisma.conversation.findUnique({
      where: { id: data.conversationId },
      include: { participants: true }
    });
    if (!conversation) {
      socket.emit('error', { code: 'NOT_FOUND', message: 'Conversation not found' });
      return;
    }

    const isParticipant = conversation.participants.some(p => p.userId === userId);
    const isAdmin = socket.data.role === 'ADMIN' || socket.data.role === 'SUPER_ADMIN';

    if (!isParticipant && !(conversation.type === 'SUPPORT' && isAdmin)) {
      socket.emit('error', { code: 'FORBIDDEN', message: 'Not a participant' });
      return;
    }
    socket.join(`conversation:${data.conversationId}`);
  }));

  socket.on('message:send', withValidation(sendMessageSchema, async (data) => {
    const message = await ChatService.sendMessage(data.conversationId, userId, {
      content: data.content,
      type: data.type ?? 'TEXT',
      offerAmount: data.offerAmount
    }, socket.data.role);
    
    io.to(`conversation:${data.conversationId}`).emit('message:receive', message);
    
    const conversation = await prisma.conversation.findUnique({
      where: { id: data.conversationId },
      include: { participants: true }
    });
    
    if (conversation) {
      const receiver = conversation.participants.find(p => p.userId !== userId);
      if (receiver) {
        const job = conversation.jobId ? await prisma.job.findUnique({ where: { id: conversation.jobId }, select: { title: true } }) : null;
        const sender = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
        const truncatedBody = message.content && message.content.length > 80 ? message.content.slice(0, 80) + '…' : (message.content || 'رسالة جديدة');
        
        const type = data.type === 'OFFER' ? NotificationType.OFFER_RECEIVED : NotificationType.NEW_MESSAGE;
        const titleAr = data.type === 'OFFER' ? 'عرض جديد 💰' : sender?.fullName || 'رسالة جديدة';
        const messageAr = data.type === 'OFFER' ? 'لقد تلقيت عرضاً مالياً جديداً للمهمة' : truncatedBody;

        await prisma.notification.create({
          data: buildNotification({
            userId: receiver.userId,
            type,
            titleAr,
            messageAr,
            data: { jobId: conversation.jobId, conversationId: conversation.id, messageId: message.id, jobTitle: job?.title },
          })
        });

        io.to(`user:${receiver.userId}`).emit('notification:new', {
          type,
          messageId: message.id
        });
      }

      if (conversation.type === 'SUPPORT' && socket.data.role === 'LAWYER') {
        io.to('admins').emit('admin:new_support_message', {
          conversationId: conversation.id,
          message
        });

        const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } });
        if (admins.length > 0) {
          await NotificationsService.notifyManyUsers(
            admins.map(a => a.id),
            {
              type: 'NEW_MESSAGE',
              titleAr: 'رسالة دعم فني جديدة 💬',
              messageAr: 'يوجد رسالة جديدة في قسم الدعم الفني تحتاج لردك',
              data: { conversationId: conversation.id }
            }
          );
        }
      }
    }

    return message;
  }));

  socket.on('offer:accept', withValidation(acceptOfferSchema, async (data) => {
    let ipAddress = socket.handshake.headers['x-forwarded-for'] as string;
    if (!ipAddress) ipAddress = socket.handshake.address;
    if (ipAddress && ipAddress.includes(',')) ipAddress = ipAddress.split(',')[0].trim();

    const message = await ChatService.acceptOffer(data.messageId, userId, ipAddress);
    if (!message) return;

    io.to(`conversation:${message.conversationId}`).emit('offer:accepted', message);
    
    const conversation = await prisma.conversation.findUnique({
      where: { id: message.conversationId },
      include: { participants: true }
    });
    
    if (conversation) {
      const job = conversation.jobId ? await prisma.job.findUnique({ where: { id: conversation.jobId }, select: { title: true } }) : null;
      for (const p of conversation.participants) {
        if (p.userId !== userId) {
          await prisma.notification.create({
            data: buildNotification({
              userId: p.userId,
              type: NotificationType.OFFER_ACCEPTED,
              titleAr: 'تم قبول العرض ✅',
              messageAr: `تم قبول عرضك المالي لمهمة: ${job?.title || 'غير معروف'}`,
              data: { jobId: conversation.jobId, conversationId: conversation.id }
            })
          });
        }
        io.to(`user:${p.userId}`).emit('notification:new', {
          type: NotificationType.OFFER_ACCEPTED,
          jobId: conversation.jobId
        });
      }
    }
    
    return message;
  }));

  socket.on('offer:reject', withValidation(rejectOfferSchema, async (data) => {
    const message = await ChatService.rejectOffer(data.messageId, userId);
    if (message) {
      io.to(`conversation:${message.conversationId}`).emit('offer:rejected', message);
      return message;
    }
  }));
}
