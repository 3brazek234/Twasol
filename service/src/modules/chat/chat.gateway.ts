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
        io.to(`user:${receiver.userId}`).emit('notification:new', {
          type: data.type === 'OFFER' ? NotificationType.OFFER_RECEIVED : NotificationType.NEW_MESSAGE,
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
          await prisma.notification.createMany({
            data: admins.map(admin => ({
              userId: admin.id,
              type: 'NEW_MESSAGE',
              title: 'New Support Message',
              body: `New message from lawyer.`,
              referenceId: conversation.id,
              payload: {}
            }))
          });
        }
      }
    }
  }));

  socket.on('offer:accept', withValidation(acceptOfferSchema, async (data) => {
    // Check for standard proxy headers first, fallback to socket address
    let ipAddress = socket.handshake.headers['x-forwarded-for'] as string;
    if (!ipAddress) {
      ipAddress = socket.handshake.address;
    }
    // If it's a comma-separated list, take the first one
    if (ipAddress && ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim();
    }

    const message = await ChatService.acceptOffer(data.messageId, userId, ipAddress);
    if (!message) return;

    io.to(`conversation:${message.conversationId}`).emit('offer:accepted', message);
    
    const conversation = await prisma.conversation.findUnique({
      where: { id: message.conversationId },
      include: { participants: true }
    });
    
    if (conversation) {
      for (const p of conversation.participants) {
        io.to(`user:${p.userId}`).emit('notification:new', {
          type: NotificationType.OFFER_ACCEPTED,
          jobId: conversation.jobId
        });
      }
    }
  }));

  socket.on('offer:reject', withValidation(rejectOfferSchema, async (data) => {
    const message = await ChatService.rejectOffer(data.messageId, userId);
    if (message) {
      io.to(`conversation:${message.conversationId}`).emit('offer:rejected', message);
    }
  }));
}
