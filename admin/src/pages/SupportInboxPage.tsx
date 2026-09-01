import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { adminSocket } from '../api/socket';

export default function SupportInboxPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'OPEN' | 'RESOLVED'>('OPEN');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData, isLoading: isLoadingList } = useQuery({
    queryKey: ['admin-support', activeTab],
    queryFn: async () => {
      const res = await api.get('/admin/support/conversations', {
        params: { status: activeTab, page: 1, limit: 50 }
      });
      return res.data;
    }
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['admin-support-messages', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return null;
      const res = await api.get(`/admin/support/conversations/${selectedConversationId}/messages`);
      return res.data;
    },
    enabled: !!selectedConversationId,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/support/conversations/${id}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support'] });
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      if (activeTab === 'OPEN') {
        setSelectedConversationId(null);
      }
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { id: string, content: string }) => api.post(`/admin/support/conversations/${data.id}/messages`, { content: data.content }),
    onSuccess: () => {
      setMessageContent('');
      queryClient.invalidateQueries({ queryKey: ['admin-support-messages', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['admin-support'] });
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support'] });
      if (selectedConversationId) {
        queryClient.invalidateQueries({ queryKey: ['admin-support-messages', selectedConversationId] });
      }
    };

    adminSocket.on('admin:new_support_message', handleNewMessage);
    return () => adminSocket.off('admin:new_support_message', handleNewMessage);
  }, [queryClient, selectedConversationId]);

  const conversations = conversationsData?.data || [];
  const selectedConvDetails = conversations.find((c: any) => c.id === selectedConversationId);

  return (
    <div className="flex h-[calc(100vh-100px)] border rounded-lg bg-white overflow-hidden shadow-sm">
      {/* Left Pane - Inbox List */}
      <div className="w-1/3 border-r flex flex-col bg-brand-paper">
        <div className="p-4 border-b bg-white">
          <h2 className="text-xl font-bold mb-4">Support Inbox</h2>
          <Tabs value={activeTab} onValueChange={(v: any) => { setActiveTab(v); setSelectedConversationId(null); }} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="OPEN">Open</TabsTrigger>
              <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingList ? (
            <div className="p-4 text-center text-sm text-brand-muted">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-brand-muted">No {activeTab.toLowerCase()} conversations.</div>
          ) : (
            conversations.map((conv: any) => {
              const lawyer = conv.participants?.[0]?.user;
              const lastMessage = conv.messages?.[0];
              const isSelected = selectedConversationId === conv.id;
              
              return (
                <div 
                  key={conv.id} 
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`p-4 border-b cursor-pointer transition-colors ${isSelected ? 'bg-brand-signal/10 border-l-4 border-l-brand-signal' : 'hover:bg-brand-paper border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm truncate pr-2">{lawyer?.fullName || 'Unknown Lawyer'}</span>
                    <span className="text-xs text-brand-muted whitespace-nowrap">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-brand-muted truncate mb-2">
                    {lastMessage?.content || 'No messages'}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${conv.assignedAdminId ? 'bg-brand-paper text-brand-ink' : 'bg-orange-100 text-orange-800'}`}>
                      {conv.assignedAdmin?.fullName || 'Unassigned'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane - Conversation Details */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversationId ? (
          <>
            <div className="p-4 border-b flex justify-between items-center shadow-sm z-10">
              <div>
                <h3 className="font-bold">{selectedConvDetails?.participants?.[0]?.user?.fullName}</h3>
                <p className="text-xs text-brand-muted">{selectedConvDetails?.participants?.[0]?.user?.email}</p>
              </div>
              {!selectedConvDetails?.isResolved && (
                <Button variant="outline" size="sm" onClick={() => resolveMutation.mutate(selectedConversationId)}>
                  Mark Resolved
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {isLoadingMessages ? (
                <div className="text-center text-sm text-brand-muted">Loading messages...</div>
              ) : messages?.length === 0 ? (
                <div className="text-center text-sm text-brand-muted">No messages yet.</div>
              ) : (
                messages?.map((msg: any) => {
                  const isAdmin = msg.sender.role === 'ADMIN' || msg.sender.role === 'SUPER_ADMIN';
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-lg ${isAdmin ? 'bg-brand-signal text-white rounded-br-none' : 'bg-white border text-brand-ink rounded-bl-none shadow-sm'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <span className={`text-[10px] mt-1 block ${isAdmin ? 'text-blue-100' : 'text-brand-muted'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {msg.sender.fullName}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {!selectedConvDetails?.isResolved && (
              <div className="p-4 border-t bg-white">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (messageContent.trim()) {
                      sendMessageMutation.mutate({ id: selectedConversationId, content: messageContent });
                    }
                  }}
                  className="flex gap-2"
                >
                  <Input 
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type a response... (You will automatically claim this ticket)"
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!messageContent.trim() || sendMessageMutation.isPending}>
                    Send
                  </Button>
                </form>
              </div>
            )}
            
            {selectedConvDetails?.isResolved && (
              <div className="p-4 border-t bg-slate-100 text-center text-sm text-brand-muted">
                This conversation is resolved.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-brand-muted flex-col">
            <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Select a conversation to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
