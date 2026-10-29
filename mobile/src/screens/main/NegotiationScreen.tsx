import { uploadFileToR2 } from "../../utils/upload";
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Image as RNImage,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { useNegotiationTimeline, useNegotiationActions } from "../../hooks/useNegotiation";
import { useJob } from "../../hooks/useJobs";
import { useAuthStore } from "../../stores/authStore";
import {
  FileText,
  DollarSign,
  Send,
  X,
  CheckCircle,
  Camera,
  Image as ImageIcon,
} from "lucide-react-native";
import { safeFormatTime } from "../../utils/dateUtils";
import { colors, fonts, spacing, radius, layout } from "../../theme/tokens";
import * as ImagePicker from "expo-image-picker";
import { apiClient } from "../../api/client";
import { EmptyState } from "../../components/EmptyState";
import { EmptyStateIllustration } from "../../components/EmptyStateIllustration";
import { ContextualTooltip } from "../../components/ContextualTooltip";
import { OfferCard } from "../../components/OfferCard";
import JobLifecycleStepper from "../../components/JobLifecycleStepper";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 2000;

const isSameDay = (d1: string | Date, d2: string | Date) => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const formatHeaderDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, today)) return "اليوم";
  if (isSameDay(date, yesterday)) return "أمس";
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export const NegotiationScreen = ({ route }: any) => {
  const {
    jobId,
    conversationId: initialConversationId,
    conversationType,
    jobStatus: paramJobStatus,
    otherPartyName: paramOtherPartyName,
  } = route.params || {};

  const [resolvedConversationId, setResolvedConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [isResolvingSupport, setIsResolvingSupport] = useState(false);
  const supportResolvePromiseRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    if (initialConversationId) {
      setResolvedConversationId(initialConversationId);
    }
  }, [initialConversationId]);

  // When entering SupportChat (conversationType === 'SUPPORT') with no conversationId,
  // check if an existing support conversation exists without surfacing a 404 toast.
  useEffect(() => {
    let active = true;
    if (conversationType === "SUPPORT" && !initialConversationId && !resolvedConversationId) {
      apiClient
        .get("/support/conversations/mine")
        .then((res) => {
          const existingId = res.data?.id;
          if (active && existingId) {
            setResolvedConversationId(existingId);
          }
        })
        .catch((err) => {
          // 404 is the expected new-user state before first message; never toast it.
          if (err?.response?.status && err.response.status !== 404) {
            Toast.show({
              type: "error",
              text1: "خطأ",
              text2: err.message || "تعذر تحميل محادثة الدعم",
            });
          }
        });
    }
    return () => {
      active = false;
    };
  }, [conversationType, initialConversationId, resolvedConversationId]);

  const ensureConversationId = useCallback(async (): Promise<string> => {
    if (resolvedConversationId) return resolvedConversationId;
    if (supportResolvePromiseRef.current) return supportResolvePromiseRef.current;

    const promise = (async () => {
      setIsResolvingSupport(true);
      try {
        try {
          const res = await apiClient.get("/support/conversations/mine");
          if (res.data?.id) {
            setResolvedConversationId(res.data.id);
            return res.data.id as string;
          }
        } catch (err: any) {
          // Ignore 404 and fall through to create
        }
        const createRes = await apiClient.post("/support/conversations");
        const newId = createRes.data?.id;
        if (!newId) {
          throw new Error("تعذر إنشاء محادثة الدعم");
        }
        setResolvedConversationId(newId);
        return newId as string;
      } finally {
        setIsResolvingSupport(false);
        supportResolvePromiseRef.current = null;
      }
    })();

    supportResolvePromiseRef.current = promise;
    return promise;
  }, [resolvedConversationId]);

  const { data: rawJob } = useJob(jobId);
  const job = rawJob as any;
  const activeConversationId = resolvedConversationId || "";
  const {
    data: timeline = [],
    refetch,
    isFetching,
  } = useNegotiationTimeline(activeConversationId);
  const actions = useNegotiationActions(activeConversationId, jobId);
  const currentUser = useAuthStore((state) => state.user);

  const [modalType, setModalType] = useState<"OFFER" | "IMAGE" | null>(null);
  const [offerValue, setOfferValue] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (activeConversationId) {
        actions.markAsRead();
      }
    }, [activeConversationId, timeline.length])
  );

  const isPoster =
    currentUser?.id === job?.postedByUserId || currentUser?.id === job?.posterId;
  const hasApplied = !!job?.applications?.some(
    (application: any) =>
      application.lawyerId === currentUser?.id && application.status !== "REJECTED"
  );
  const isAssignedLawyer =
    currentUser?.id === job?.assignedLawyerId ||
    currentUser?.id === job?.assignedExecutorId;
  const otherPartyName =
    paramOtherPartyName ||
    (isPoster
      ? job?.assignedLawyer?.fullName ||
        job?.applications?.[0]?.lawyer?.fullName ||
        "الطرف الآخر"
      : job?.postedBy?.fullName || "الطرف الآخر");

  const effectiveJobStatus = job?.status ?? paramJobStatus ?? null;
  // 3a: canOffer must be explicit: conversationType === 'JOB' && job status === 'NEGOTIATING'
  // Never infer from a missing job and never key off route.name.
  const canOffer =
    conversationType === "JOB" && effectiveJobStatus === "NEGOTIATING";

  const timelineWithDates = useMemo(() => {
    const result: any[] = [];
    let lastDate: Date | null = null;

    [...timeline].forEach((item) => {
      const itemDate = new Date(item.timestamp || item.createdAt);
      if (!lastDate || !isSameDay(lastDate, itemDate)) {
        result.push({
          id: `date-${itemDate.toISOString()}`,
          type: "DATE_DIVIDER",
          date: itemDate,
        });
        lastDate = itemDate;
      }
      result.push(item);
    });
    return result;
  }, [timeline]);

  const handleUploadImage = async (file: {
    uri: string;
    name: string;
    mimeType: string;
    fileSize: number;
  }) => {
    if (file.fileSize && file.fileSize > MAX_IMAGE_BYTES) {
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: "حجم الملف كبير جدًا. الحد الأقصى 5 ميجابايت",
      });
      return;
    }

    try {
      setIsUploading(true);
      const targetConvId = await ensureConversationId();

      const { data: urlData } = await apiClient.post("/uploads/presigned-url", {
        fileName: file.name || "attachment.jpeg",
        fileType: file.mimeType || "image/jpeg",
        fileSize: file.fileSize || 1024,
        conversationId: targetConvId,
      });

      await uploadFileToR2({
        localUri:
          Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri,
        presignedUrl: urlData.uploadUrl,
        contentType: file.mimeType || "image/jpeg",
      });

      if (targetConvId === activeConversationId) {
        await actions.sendDocument({
          attachmentUrl: urlData.publicUrl,
          attachmentType: "IMAGE",
          attachmentName: file.name || "صورة",
          attachmentSize: file.fileSize || 0,
        });
      } else {
        await apiClient.post(`/conversations/${targetConvId}/messages`, {
          content: "صورة",
          type: "TEXT",
          attachmentUrl: urlData.publicUrl,
          attachmentType: "IMAGE",
          attachmentName: file.name || "صورة",
          attachmentSize: file.fileSize || 0,
        });
      }

      setModalType(null);
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "فشل الرفع",
        text2: err?.message || "تعذر رفع الصورة",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImagePick = async (fromCamera: boolean) => {
    let result;
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      });
    }

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const size = asset.fileSize || 0;
      if (size > MAX_IMAGE_BYTES) {
        Toast.show({
          type: "error",
          text1: "خطأ",
          text2: "حجم الملف كبير جدًا. الحد الأقصى 5 ميجابايت",
        });
        return;
      }

      handleUploadImage({
        uri: asset.uri,
        name: asset.fileName || "image.jpg",
        mimeType: asset.mimeType || "image/jpeg",
        fileSize: size || 1024,
      });
    }
  };

  const handleSendText = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || actions.isSendingNote || isResolvingSupport) return;

    setMessageText("");
    try {
      if (activeConversationId) {
        await actions.sendNote(trimmed);
      } else {
        const targetConvId = await ensureConversationId();
        await apiClient.post(`/conversations/${targetConvId}/messages`, {
          content: trimmed,
          type: "TEXT",
        });
      }
    } catch (err: any) {
      setMessageText(trimmed);
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: err?.message || "تعذر إرسال الرسالة",
      });
    }
  };

  const submitOfferModal = async () => {
    const amount = Number(offerValue);
    if (!offerValue.trim() || amount <= 0 || actions.isSendingOffer) return;
    try {
      await actions.sendOffer(amount);
      setModalType(null);
      setOfferValue("");
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "خطأ",
        text2: err?.message || "تعذر إرسال العرض",
      });
    }
  };

  const renderCard = ({ item }: { item: any }) => {
    if (item.type === "DATE_DIVIDER") {
      return (
        <View style={styles.dateDividerWrapper}>
          <View style={styles.dateDivider}>
            <Text style={styles.dateDividerText}>{formatHeaderDate(item.date)}</Text>
          </View>
        </View>
      );
    }

    if (item.type === "SYSTEM") {
      return (
        <View style={styles.systemCardWrapper}>
          <View style={styles.systemCard}>
            <CheckCircle size={14} color={colors.amber} style={styles.systemIcon} />
            <Text style={styles.systemText}>{item.content}</Text>
          </View>
        </View>
      );
    }

    const isMe = item.senderId === currentUser?.id;
    const timeStr = safeFormatTime(item.timestamp || item.createdAt);
    const opacity = item.status === "pending" ? 0.6 : 1;

    if (item.type === "OFFER") {
      return (
        <View style={{ opacity }}>
          <OfferCard
            item={item}
            isMe={isMe}
            otherPartyName={otherPartyName}
            timeLabel={timeStr}
            onResponse={(messageId, action) => {
              if (action === "accept") actions.acceptOffer(messageId);
              else actions.rejectOffer(messageId);
            }}
          />
        </View>
      );
    }

    if (item.attachmentType || item.attachmentUrl) {
      const isImage =
        item.attachmentType === "IMAGE" ||
        !!item.attachmentName?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ||
        !!item.attachmentUrl?.match(/\.(jpeg|jpg|gif|png|webp)(\?|$)/i);

      return (
        <View
          style={[
            styles.cardContainer,
            isMe ? styles.alignMe : styles.alignOther,
            { opacity },
          ]}
        >
          <View style={styles.noteCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardSender}>{isMe ? "أنت" : otherPartyName}</Text>
              <Text style={styles.cardTime}>{timeStr}</Text>
            </View>

            <TouchableOpacity
              style={{ marginTop: spacing.xs }}
              onPress={() => {
                if (isImage && item.attachmentUrl) {
                  setSelectedImage(item.attachmentUrl);
                } else if (item.attachmentUrl) {
                  Linking.openURL(item.attachmentUrl);
                }
              }}
              activeOpacity={0.8}
            >
              {isImage && item.attachmentUrl ? (
                <RNImage
                  source={{ uri: item.attachmentUrl }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.docRow}>
                  <FileText size={24} color={colors.navy} />
                  <View style={styles.docInfo}>
                    <Text style={styles.docName} numberOfLines={1}>
                      {item.attachmentName || "مستند"}
                    </Text>
                    {item.attachmentSize ? (
                      <Text style={styles.docSize}>
                        {Math.round(item.attachmentSize / 1024)} KB
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {item.status === "pending" && (
              <Text style={styles.pendingText}>جاري الإرسال...</Text>
            )}
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.cardContainer,
          isMe ? styles.alignMe : styles.alignOther,
          { opacity },
        ]}
      >
        <View style={[styles.noteCard, isMe ? styles.noteCardMe : styles.noteCardOther]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardSender}>{isMe ? "أنت" : otherPartyName}</Text>
            <Text style={styles.cardTime}>{timeStr}</Text>
          </View>
          <Text style={styles.noteText}>{item.content}</Text>
          {item.status === "pending" && (
            <Text style={styles.pendingText}>جاري الإرسال...</Text>
          )}
        </View>
      </View>
    );
  };

  const isSendDisabled =
    !messageText.trim() || actions.isSendingNote || isResolvingSupport;

  return (
    <ScreenContainer
      scroll={false}
      paddingHorizontal={0}
      edges={["left", "right", "bottom"]}
      style={styles.screenInner}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Top Info Bar */}
        {effectiveJobStatus && conversationType === "JOB" && (
          <View style={styles.headerPillWrapper}>
            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>
                {effectiveJobStatus === "NEGOTIATING"
                  ? "قيد التفاوض"
                  : effectiveJobStatus === "AGREED"
                    ? "تم الاتفاق"
                    : effectiveJobStatus}
              </Text>
            </View>
          </View>
        )}

        {job && (isPoster || isAssignedLawyer || hasApplied) ? (
          <JobLifecycleStepper status={job.status} hasApplied={hasApplied} />
        ) : null}

        <View style={styles.timelineArea}>
          {timeline.length === 0 && !isFetching ? (
            <EmptyState
              illustration={<EmptyStateIllustration kind="chat" />}
              headline="ستظهر مفاوضاتك هنا"
              body="أرسل رسالة أو صورة لبدء المحادثة مباشرة."
            />
          ) : (
            <FlatList
              data={timelineWithDates}
              keyExtractor={(item) => item.id}
              renderItem={renderCard}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={isFetching && timeline.length > 0}
                  onRefresh={refetch}
                />
              }
              ref={(ref) => {
                setTimeout(() => ref?.scrollToEnd({ animated: true }), 100);
              }}
            />
          )}
        </View>

        {/* Bottom Inline Composer + Action Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.composerRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="إرسال الرسالة"
              style={[
                styles.sendButton,
                isSendDisabled && styles.sendButtonDisabled,
              ]}
              disabled={isSendDisabled}
              onPress={handleSendText}
            >
              {actions.isSendingNote || isResolvingSupport ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Send size={18} color={colors.white} />
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.composerInput}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="اكتب رسالتك هنا..."
              placeholderTextColor={colors.muted}
              multiline
              maxLength={MAX_MESSAGE_LENGTH}
            />

            <View style={styles.iconActionsGroup}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="إرفاق صورة"
                style={styles.iconActionBtn}
                onPress={() => setModalType("IMAGE")}
              >
                <ImageIcon size={18} color={colors.navy} />
                <Text style={styles.iconActionText}>إرفاق صورة</Text>
              </TouchableOpacity>

              {canOffer && (
                <ContextualTooltip
                  storageKey="@wakeel_tip_chat_offer_v1"
                  illustration="offer"
                  message="اقترح أتعابك مباشرة من هنا."
                  style={styles.tooltipAnchor}
                >
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="إرسال عرض"
                    style={[styles.iconActionBtn, styles.offerActionBtn]}
                    onPress={() => setModalType("OFFER")}
                  >
                    <DollarSign size={18} color={colors.white} />
                    <Text style={styles.offerActionText}>إرسال عرض</Text>
                  </TouchableOpacity>
                </ContextualTooltip>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Offer & Image Attachment Modal */}
      <Modal visible={!!modalType} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === "OFFER" ? "إرسال عرض مالي" : "إرفاق صورة"}
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <X size={24} color={colors.ink} />
              </TouchableOpacity>
            </View>

            {modalType === "OFFER" && (
              <View>
                <TextInput
                  style={styles.modalInput}
                  value={offerValue}
                  onChangeText={setOfferValue}
                  keyboardType="numeric"
                  placeholder="أدخل المبلغ (ج.م)"
                  placeholderTextColor={colors.muted}
                  autoFocus
                />
                <View style={styles.chipRow}>
                  {[100, 200, 500, 1000].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={styles.chip}
                      onPress={() => setOfferValue(amt.toString())}
                    >
                      <Text style={styles.chipText}>{amt} ج.م</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { opacity: Number(offerValue) > 0 && !actions.isSendingOffer ? 1 : 0.5 },
                  ]}
                  disabled={Number(offerValue) <= 0 || actions.isSendingOffer}
                  onPress={submitOfferModal}
                >
                  <Text style={styles.submitBtnText}>إرسال العرض</Text>
                </TouchableOpacity>
              </View>
            )}

            {modalType === "IMAGE" && (
              <View>
                {isUploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="large" color={colors.navy} />
                    <Text style={styles.uploadingText}>جاري الرفع...</Text>
                  </View>
                ) : (
                  <View style={styles.docOptionRow}>
                    <TouchableOpacity
                      style={styles.docOptionBtn}
                      onPress={() => handleImagePick(true)}
                    >
                      <Camera size={28} color={colors.navy} />
                      <Text style={styles.docOptionText}>كاميرا</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.docOptionBtn}
                      onPress={() => handleImagePick(false)}
                    >
                      <ImageIcon size={28} color={colors.navy} />
                      <Text style={styles.docOptionText}>معرض الصور</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fullscreen Image Viewer Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.imageViewerBackdrop}>
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setSelectedImage(null)}
          >
            <X size={32} color={colors.white} />
          </TouchableOpacity>
          {selectedImage && (
            <RNImage
              source={{ uri: selectedImage }}
              style={styles.imageViewerFull}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenInner: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  keyboardContainer: {
    flex: 1,
  },
  timelineArea: {
    flex: 1,
  },
  headerPillWrapper: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  headerPill: {
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerPillText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    color: colors.navy,
  },

  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },

  dateDividerWrapper: {
    alignItems: "center",
    marginVertical: spacing.md,
  },
  dateDivider: {
    backgroundColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  dateDividerText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
  },

  systemCardWrapper: {
    alignItems: "center",
    marginVertical: spacing.xs,
  },
  systemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.amberBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  systemIcon: {
    marginStart: spacing.xs,
  },
  systemText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    color: colors.amber,
  },

  cardContainer: {
    marginBottom: spacing.md,
    maxWidth: "85%",
  },
  alignMe: {
    alignSelf: "flex-start",
  },
  alignOther: {
    alignSelf: "flex-end",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  cardSender: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    color: colors.navy,
  },
  cardTime: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
  },

  noteCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  noteCardMe: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
  },
  noteCardOther: {
    backgroundColor: colors.white,
    borderColor: colors.line,
  },
  noteText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 22,
    textAlign: "right",
  },

  attachmentImage: {
    width: 220,
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.line,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  docInfo: {
    marginStart: spacing.sm,
    flex: 1,
  },
  docName: {
    fontFamily: fonts.bodySemibold,
    fontSize: 14,
    color: colors.ink,
    textAlign: "right",
  },
  docSize: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: "right",
  },

  pendingText: {
    fontSize: 11,
    color: colors.muted,
    fontStyle: "italic",
    marginTop: spacing.xxs,
    textAlign: "right",
  },

  bottomBar: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.xs,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.line,
  },
  composerInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    textAlign: "right",
  },
  iconActionsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  tooltipAnchor: {
    alignSelf: "flex-end",
  },
  iconActionBtn: {
    height: 42,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
  },
  iconActionText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    color: colors.navy,
  },
  offerActionBtn: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  offerActionText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    color: colors.white,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: 16,
    color: colors.ink,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    height: 50,
    textAlign: "right",
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    color: colors.navy,
  },
  submitBtn: {
    backgroundColor: colors.navy,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  submitBtnText: {
    color: colors.white,
    fontFamily: fonts.bodySemibold,
    fontSize: 15,
  },

  uploadingContainer: {
    alignItems: "center",
    padding: spacing.lg,
  },
  uploadingText: {
    marginTop: spacing.md,
    fontFamily: fonts.bodySemibold,
    color: colors.ink,
  },
  docOptionRow: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  docOptionBtn: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  docOptionText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    color: colors.navy,
    marginTop: spacing.xs,
  },

  imageViewerBackdrop: {
    flex: 1,
    backgroundColor: colors.ink,
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerClose: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    end: 20,
    zIndex: 10,
    padding: spacing.xs,
  },
  imageViewerFull: {
    width: "100%",
    height: "80%",
  },
});
