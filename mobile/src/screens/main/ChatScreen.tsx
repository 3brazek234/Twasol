import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Dimensions, RefreshControl } from 'react-native';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { Message } from '../../schemas/message.schema';
import { colors, spacing, radius, shadows, fonts } from '../../theme/tokens';
import { Send, DollarSign, Plus, Info } from 'lucide-react-native';
import { MessageBubble } from '../../components/MessageBubble';
import { OfferCard } from '../../components/OfferCard';
import { MotiView, AnimatePresence } from 'moti';
import { fetchMessages } from '../../api/conversations.api';

const { width } = Dimensions.get('window');

export const ChatScreen = ({ route, navigation }: any) => {
  const { conversationId, conversationType, otherPartyName, jobTitle, supportStatus } = route.params || {};
  const { user } = useAuthStore();
  const { messages, setActiveConversation, sendMessage, respondToOffer, setMessages } = useChatStore();
  
  const [isConverted, setIsConverted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isOfferMode, setIsOfferMode] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');

  const flatListRef = useRef<FlatList>(null);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
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
        })) as Message[];
        setMessages(conversationId, formattedHistory);
      }).catch(err => {});
    }

    const isSupport = conversationType === 'SUPPORT';
    const isDirect = (conversationType === 'DIRECT_INQUIRY' && !isConverted);
    const showJobBanner = !isSupport && !isDirect && jobTitle;

    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitleText}>
            {isSupport ? (otherPartyName ? `دعم فني · ${otherPartyName}` : 'دعم فني') : otherPartyName}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: '#38A169' }]} />
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity style={styles.infoBtn}>
          <Info size={20} color={colors.signal} />
        </TouchableOpacity>
      )
    });

    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation, conversationType, isConverted, otherPartyName, jobTitle, navigation]);


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
      setMessages(conversationId, [...formattedHistory, ...current] as Message[]);
    } catch (err) {} finally {
      setIsLoadingMore(false);
    }
  };

  const conversationMessages = (messages[conversationId] || []).filter(Boolean);

  const handleSend = () => {
    if (!inputText.trim() && !offerAmount) return;
    if (!user) return;

    if (isOfferMode && offerAmount) {
      sendMessage(conversationId, inputText.trim(), user.id, parseFloat(offerAmount));
      setIsOfferMode(false);
      setOfferAmount('');
    } else {
      sendMessage(conversationId, inputText.trim(), user.id);
    }
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleOfferResponse = (msgId: string, action: 'accept' | 'reject') => {
    respondToOffer(conversationId, msgId, action);
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;

    if (item.type.startsWith('offer')) {
      return (
        <OfferCard 
          item={item} 
          isMe={isMe} 
          onResponse={handleOfferResponse} 
        />
      );
    }

    return <MessageBubble item={item} isMe={isMe} />;
  };

  const hasAcceptedOffer = conversationMessages.some((m: Message) => m.type === 'offer_accepted');
  const showFormalizeBanner = (conversationType === 'DIRECT_INQUIRY') && !isConverted && hasAcceptedOffer;
  const isSupport = conversationType === 'SUPPORT';
  const isDirect = (conversationType === "DIRECT_INQUIRY" && !isConverted);
  const showResolvedBanner = isSupport && supportStatus === 'RESOLVED';

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {(!isSupport && (!isDirect || isConverted) && jobTitle) && (
        <View style={styles.jobBanner}>
          <Text style={styles.jobBannerText}>تفاصيل القضية ▼</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={conversationMessages}
        keyExtractor={(item, index) => item?.id || `msg_${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
        refreshControl={<RefreshControl refreshing={isLoadingMore} onRefresh={loadMoreMessages} />}
        onContentSizeChange={() => {
          // Only scroll to end on initial load
          if (!nextCursor) {
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        }}
      />
      
      <AnimatePresence>
        {showFormalizeBanner && (
          <MotiView
            from={{ translateY: 50, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 50, opacity: 0 }}
            style={styles.formalizeBanner}
          >
            <View style={styles.bannerIcon}>
              <Plus size={16} color={colors.white} />
            </View>
            <Text style={styles.formalizeText}>تم قبول العرض. تحويل إلى قضية؟</Text>
            <TouchableOpacity style={styles.formalizeBtn} onPress={() => setIsConverted(true)}>
              <Text style={styles.formalizeBtnText}>متابعة</Text>
            </TouchableOpacity>
          </MotiView>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResolvedBanner && (
          <MotiView
            from={{ translateY: 50, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 50, opacity: 0 }}
            style={styles.formalizeBanner}
          >
            <View style={[styles.bannerIcon, { backgroundColor: colors.muted }]}>
              <Info size={16} color={colors.white} />
            </View>
            <Text style={styles.formalizeText}>تم إغلاق المحادثة كدعم فني.</Text>
          </MotiView>
        )}
      </AnimatePresence>

      <View style={styles.bottomSection}>
        <AnimatePresence>
          {isOfferMode && (
            <MotiView
              from={{ height: 0, opacity: 0 }}
              animate={{ height: 60, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={styles.offerInputContainer}
            >
              <Text style={styles.offerInputLabel}>Contract rate ($):</Text>
              <View style={styles.offerInputBox}>
                <DollarSign size={16} color={colors.signal} style={{ marginEnd: 2 }} />
                <TextInput
                  style={styles.offerAmountInput}
                  value={offerAmount}
                  onChangeText={setOfferAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  autoFocus
                />
              </View>
            </MotiView>
          )}
        </AnimatePresence>

        <View style={styles.inputContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.sendButton, !inputText.trim() && !offerAmount && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() && !offerAmount}
          >
            <Send color="#fff" size={18}  />
          </TouchableOpacity>

          <View style={[styles.textInputWrapper, isSupport && { marginEnd: spacing.sm }]}>
            <TextInput
              style={[styles.input, { textAlign: 'right' }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isOfferMode ? "أرسل عرضاً مالياً..." : "اكتب رسالة..."}
              placeholderTextColor={colors.muted}
              multiline
            />
          </View>

          {!isSupport && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.toggleOfferBtn, isOfferMode && styles.toggleOfferBtnActive]}
              onPress={() => setIsOfferMode(!isOfferMode)}
            >
              <DollarSign size={20} color={isOfferMode ? colors.white : colors.signal} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  messageList: { padding: spacing.md, paddingBottom: 40 },

  headerInfo: {
    alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
  },
  headerTitleText: {
    fontSize: 17,
    fontFamily: fonts.bodySemibold,
    color: colors.ink,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginEnd: 4,
  },
  jobBanner: { width: "100%", backgroundColor: colors.white, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line, alignItems: "center" },
  jobBannerText: { fontSize: 12, fontFamily: fonts.bodySemibold, color: colors.signal },
  headerStatusText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  infoBtn: {
    padding: 8,
  },

  formalizeBanner: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.md,
    position: 'absolute',
    bottom: 80,
    width: width - spacing.md * 2,
    zIndex: 100,
  },
  bannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.signal,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 10,
  },
  formalizeText: {
    color: colors.ink,
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    flex: 1,
  },
  formalizeBtn: {
    backgroundColor: colors.paper,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  formalizeBtnText: {
    color: colors.signal,
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
  },

  bottomSection: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  offerInputContainer: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.paper,
    height: 60,
  },
  offerInputLabel: {
    fontFamily: fonts.bodySemibold,
    color: colors.ink,
    fontSize: 14,
  },
  offerInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    width: 120,
    height: 40,
    borderWidth: 1,
    borderColor: colors.line,
  },
  offerAmountInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    fontFamily: fonts.mono,
    padding: 0
  },

  inputContainer: {
    flexDirection: 'row',
    padding: spacing.sm,
    alignItems: 'center',
  },
  toggleOfferBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.paper,
    justifyContent: 'center',
    alignItems: 'center',
    marginStart: spacing.xs,
  },
  toggleOfferBtnActive: {
    backgroundColor: colors.signal,
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    maxHeight: 100,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: {
    color: colors.ink,
    fontSize: 16,
    fontFamily: fonts.body,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendButton: {
    marginEnd: spacing.sm,
    backgroundColor: colors.signal,
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
