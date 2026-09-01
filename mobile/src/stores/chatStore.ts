import { create } from 'zustand';
import { Message } from '../schemas/message.schema';
import { useSocketStore } from './socketStore';

interface ChatState {
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // conversationId -> messages[]
  setActiveConversation: (conversationId: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: 'pending' | 'sent' | 'error', newType?: string) => void;
  sendMessage: (conversationId: string, content: string, senderId: string, offerAmount?: number) => void;
  respondToOffer: (conversationId: string, messageId: string, action: 'accept' | 'reject') => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeConversationId: null,
  messages: {},
  
  setActiveConversation: (conversationId) => {
    const currentId = get().activeConversationId;
    const socket = useSocketStore.getState().socket;
    
    if (currentId && currentId !== conversationId) {
      socket?.emit('conversation:leave', { conversationId: currentId });
    }
    
    set({ activeConversationId: conversationId });
    
    if (conversationId) {
      socket?.emit('conversation:join', { conversationId });
    }
  },

  setMessages: (conversationId, messages) => set((state) => ({
    messages: { ...state.messages, [conversationId]: messages }
  })),

  addMessage: (message) => set((state) => {
    const convMessages = state.messages[message.conversationId] || [];
    // If it already exists, update it (e.g., from an ack)
    if (message.id && convMessages.some(m => m.id === message.id)) {
      return {
        messages: {
          ...state.messages,
          [message.conversationId]: convMessages.map(m => m.id === message.id ? message : m)
        }
      };
    }
    return {
      messages: {
        ...state.messages,
        [message.conversationId]: [...convMessages, message]
      }
    };
  }),

  updateMessageStatus: (messageId, status, newType) => set((state) => {
    const newMessages = { ...state.messages };
    for (const convId of Object.keys(newMessages)) {
      newMessages[convId] = newMessages[convId].map(m => 
        m.id === messageId ? { ...m, status, type: newType || m.type } as Message : m
      );
    }
    return { messages: newMessages };
  }),

  sendMessage: (conversationId, content, senderId, offerAmount) => {
    const socket = useSocketStore.getState().socket;
    const tempId = `temp_${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      conversationId,
      senderId,
      content,
      type: offerAmount ? 'offer' : 'text',
      offerAmount,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    // Optimistic add
    get().addMessage(newMessage);

    if (socket?.connected) {
      socket.emit('message:send', { 
        conversationId, 
        content: content || (offerAmount ? 'Offer sent' : ' '), 
        type: newMessage.type === 'offer' ? 'OFFER' : 'TEXT', 
        offerAmount: offerAmount ? String(offerAmount) : undefined 
      }, (ack: any) => {
        // Callback ack from server to replace temp id and mark sent
        if (ack?.error) {
          get().updateMessageStatus(tempId, 'error');
        } else {
          set((state) => {
            const msgs = state.messages[conversationId] || [];
            // Remove the temporary message
            const filtered = msgs.filter(m => m.id !== tempId);
            
            // Check if message:receive already added the real message
            const exists = filtered.some(m => m.id === ack.id);
            if (exists) {
              return { messages: { ...state.messages, [conversationId]: filtered } };
            } else {
              const finalMessage = { ...newMessage, id: ack.id, status: 'sent' as const };
              return { messages: { ...state.messages, [conversationId]: [...filtered, finalMessage] } };
            }
          });
        }
      });
    } else {
      get().updateMessageStatus(tempId, 'error');
    }
  },

  respondToOffer: (conversationId, messageId, action) => {
    const socket = useSocketStore.getState().socket;
    const newType = action === 'accept' ? 'offer_accepted' : 'offer_rejected';

    // Optimistic update
    get().updateMessageStatus(messageId, 'pending', newType);

    if (socket?.connected) {
      const payload: any = { conversationId, messageId };
      if (action === 'accept') {
        payload.conflictsCheckPassed = true;
      }
      socket.emit(`offer:${action}`, payload, (ack: any) => {
        if (ack?.error) {
          // Rollback
          console.error('Offer response failed:', ack.error);
          get().updateMessageStatus(messageId, 'error', 'offer'); // rollback to offer
          // In real app, trigger a toast here
        } else {
          get().updateMessageStatus(messageId, 'sent');
        }
      });
    } else {
      get().updateMessageStatus(messageId, 'error', 'offer');
    }
  }
}));

useSocketStore.subscribe((state) => {
  if (state.socket && state.isConnected) {
    state.socket.off('message:receive');
    state.socket.on('message:receive', (payload: any) => {
      // Map backend message format to frontend schema
      const formattedMessage: Message = {
        id: payload.id,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        content: payload.content,
        type: payload.type === 'OFFER' ? 'offer' : (payload.type === 'OFFER_ACCEPTED' ? 'offer_accepted' : (payload.type === 'OFFER_REJECTED' ? 'offer_rejected' : 'text')),
        offerAmount: payload.offerAmount ? Number(payload.offerAmount) : undefined,
        status: 'sent',
        timestamp: payload.createdAt || payload.timestamp || new Date().toISOString(),
      };
      useChatStore.getState().addMessage(formattedMessage);
    });
  }
});
