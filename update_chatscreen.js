const fs = require('fs');
const file = 'mobile/src/screens/main/ChatScreen.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
`  useEffect(() => {
    setActiveConversation(conversationId);

    // Fetch historical messages
    if (conversationId) {
      fetchMessages(conversationId).then(history => {
        const formattedHistory = history.map(m => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          content: m.content,
          type: m.type === 'OFFER' ? 'offer' : (m.type === 'OFFER_ACCEPTED' ? 'offer_accepted' : (m.type === 'OFFER_REJECTED' ? 'offer_rejected' : 'text')),
          offerAmount: m.offerAmount ? Number(m.offerAmount) : undefined,
          status: 'sent',
          timestamp: m.createdAt,
        }));
        setMessages(conversationId, formattedHistory);
      }).catch(err => {});
    }`,
`  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    setActiveConversation(conversationId);

    // Fetch historical messages
    if (conversationId) {
      fetchMessages(conversationId).then(res => {
        const history = Array.isArray(res) ? res : (res.data || []);
        const meta = !Array.isArray(res) ? res.meta : {};
        setNextCursor(meta?.nextCursor || null);
        const formattedHistory = history.map((m: any) => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          content: m.content,
          type: m.type === 'OFFER' ? 'offer' : (m.type === 'OFFER_ACCEPTED' ? 'offer_accepted' : (m.type === 'OFFER_REJECTED' ? 'offer_rejected' : 'text')),
          offerAmount: m.offerAmount ? Number(m.offerAmount) : undefined,
          status: 'sent',
          timestamp: m.createdAt,
        }));
        setMessages(conversationId, formattedHistory);
      }).catch(err => {});
    }`
);

const loadMoreCode = `
  const loadMoreMessages = async () => {
    if (isLoadingMore || !nextCursor || !conversationId) return;
    
    setIsLoadingMore(true);
    try {
      const res = await fetchMessages(conversationId, nextCursor);
      const history = res.data || [];
      setNextCursor(res.meta?.nextCursor || null);
      
      const formattedHistory = history.map((m: any) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.content,
        type: m.type === 'OFFER' ? 'offer' : (m.type === 'OFFER_ACCEPTED' ? 'offer_accepted' : (m.type === 'OFFER_REJECTED' ? 'offer_rejected' : 'text')),
        offerAmount: m.offerAmount ? Number(m.offerAmount) : undefined,
        status: 'sent',
        timestamp: m.createdAt,
      }));
      
      // prepend to existing messages
      const current = messages[conversationId] || [];
      setMessages(conversationId, [...formattedHistory, ...current]);
    } catch (err) {} finally {
      setIsLoadingMore(false);
    }
  };
`;

code = code.replace(
  `  const conversationMessages = (messages[conversationId] || []).filter(Boolean);`,
  `${loadMoreCode}\n  const conversationMessages = (messages[conversationId] || []).filter(Boolean);`
);

code = code.replace(
  `        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}`,
  `        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.2}
        onContentSizeChange={() => {
          // Only scroll to end on initial load
          if (!nextCursor) {
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        }}`
);

fs.writeFileSync(file, code);
