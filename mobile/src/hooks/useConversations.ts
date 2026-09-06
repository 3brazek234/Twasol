import { useQuery } from '@tanstack/react-query';
import { fetchConversations, fetchMessages } from '../api/conversations.api';

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
  });
};
