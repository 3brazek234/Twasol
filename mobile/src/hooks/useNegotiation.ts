import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export function useNegotiationTimeline(conversationId: string) {
  return useQuery({
    queryKey: ['negotiation', conversationId],
    queryFn: async () => {
      const res = await apiClient.get(`/conversations/${conversationId}/messages?limit=100`);
      return res.data?.data || [];
    },
    refetchInterval: 6000,
    refetchIntervalInBackground: false,
    enabled: !!conversationId,
  });
}

export function useNegotiationActions(conversationId: string, jobId?: string) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore.getState().user?.id;

  const handleMutate = async (optimisticMessage: any) => {
    await queryClient.cancelQueries({ queryKey: ['negotiation', conversationId] });
    const previous = queryClient.getQueryData(['negotiation', conversationId]);

    queryClient.setQueryData(['negotiation', conversationId], (old: any) => {
      if (!old) return [optimisticMessage];
      return [...old, optimisticMessage];
    });

    return { previous };
  };

  const handleError = (err: any, variables: any, context: any) => {
    queryClient.setQueryData(['negotiation', conversationId], context?.previous);
  };

  const handleSettled = () => {
    queryClient.invalidateQueries({ queryKey: ['negotiation', conversationId] });
  };

  const sendOfferMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiClient.post(`/conversations/${conversationId}/messages`, {
        content: `عرض مالي: ${amount} ج.م`,
        type: 'OFFER',
        offerAmount: amount,
      });
      return res.data;
    },
    onMutate: (amount) => handleMutate({
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: currentUserId,
      type: 'OFFER',
      offerAmount: amount,
      status: 'pending',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      offerStatus: 'PENDING',
    }),
    onError: handleError,
    onSettled: handleSettled,
  });

  const sendNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiClient.post(`/conversations/${conversationId}/messages`, {
        content,
        type: 'TEXT',
      });
      return res.data;
    },
    onMutate: (content) => handleMutate({
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: currentUserId,
      content,
      type: 'TEXT',
      status: 'pending',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }),
    onError: handleError,
    onSettled: handleSettled,
  });

  const sendDocumentMutation = useMutation({
    mutationFn: async ({ attachmentUrl, attachmentType, attachmentName, attachmentSize }: any) => {
      const res = await apiClient.post(`/conversations/${conversationId}/messages`, {
        content: 'مستند',
        type: 'TEXT',
        attachmentUrl,
        attachmentType,
        attachmentName,
        attachmentSize,
      });
      return res.data;
    },
    onMutate: (data) => handleMutate({
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: currentUserId,
      content: 'مستند',
      type: 'TEXT',
      status: 'pending',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...data,
    }),
    onError: handleError,
    onSettled: handleSettled,
  });

  const acceptOfferMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await apiClient.post(`/conversations/messages/${messageId}/accept`);
      return res.data;
    },
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: ['negotiation', conversationId] });
      const previous = queryClient.getQueryData(['negotiation', conversationId]);
      queryClient.setQueryData(['negotiation', conversationId], (old: any) => {
        if (!old) return old;
        return old.map((m: any) => m.id === messageId ? { ...m, offerStatus: 'ACCEPTED', status: 'pending' } : m);
      });
      return { previous };
    },
    onError: handleError,
    onSettled: handleSettled,
  });

  const rejectOfferMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await apiClient.post(`/conversations/messages/${messageId}/reject`);
      return res.data;
    },
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: ['negotiation', conversationId] });
      const previous = queryClient.getQueryData(['negotiation', conversationId]);
      queryClient.setQueryData(['negotiation', conversationId], (old: any) => {
        if (!old) return old;
        return old.map((m: any) => m.id === messageId ? { ...m, offerStatus: 'REJECTED', status: 'pending' } : m);
      });
      return { previous };
    },
    onError: handleError,
    onSettled: handleSettled,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch(`/conversations/${conversationId}/messages/read`);
      return res.data;
    },
    onSettled: handleSettled,
  });

  return {
    sendOffer: sendOfferMutation.mutateAsync,
    sendNote: sendNoteMutation.mutateAsync,
    sendDocument: sendDocumentMutation.mutateAsync,
    acceptOffer: acceptOfferMutation.mutateAsync,
    rejectOffer: rejectOfferMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    isSendingOffer: sendOfferMutation.isPending,
    isSendingNote: sendNoteMutation.isPending,
    isUploadingDoc: sendDocumentMutation.isPending,
  };
}
