import { uploadFileToR2 } from "../../utils/upload";
import { useState, useCallback, useMemo } from "react";
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
  SafeAreaView
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useNegotiationTimeline, useNegotiationActions } from "../../hooks/useNegotiation";
import { useJob } from "../../hooks/useJobs";
import { useAuthStore } from "../../stores/authStore";
import { FileText, DollarSign, MessageSquare, X, CheckCircle, Clock, XCircle, Download, Camera, Image as ImageIcon, ChevronRight } from "lucide-react-native";
import { safeFormatTime } from "../../utils/dateUtils";
import { colors, fonts, spacing, radius } from "../../theme/tokens";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { apiClient } from "../../api/client";
import { EmptyState } from "../../components/EmptyState";
import { EmptyStateIllustration } from "../../components/EmptyStateIllustration";
import { ContextualTooltip } from "../../components/ContextualTooltip";
import { OfferCard } from "../../components/OfferCard";
import JobLifecycleStepper from "../../components/JobLifecycleStepper";

const isSameDay = (d1: string | Date, d2: string | Date) => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return date1.getFullYear() === date2.getFullYear() && 
         date1.getMonth() === date2.getMonth() && 
         date1.getDate() === date2.getDate();
};

const formatHeaderDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, today)) return "اليوم";
  if (isSameDay(date, yesterday)) return "أمس";
  return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "short", day: "numeric" }).format(date);
};

export const NegotiationScreen = ({ route, navigation }: any) => {
  const { jobId, conversationId } = route.params || {};
  const { data: rawJob, isLoading: isLoadingJob } = useJob(jobId);
  const job = rawJob as any;
  const { data: timeline = [], refetch, isFetching } = useNegotiationTimeline(conversationId);
  const actions = useNegotiationActions(conversationId);
  const currentUser = useAuthStore(state => state.user);

  const [modalType, setModalType] = useState<"OFFER" | "NOTE" | "DOCUMENT" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      actions.markAsRead();
    }, [timeline.length])
  );

  const isPoster = currentUser?.id === job?.postedByUserId || currentUser?.id === job?.posterId;
  const hasApplied = !!job?.applications?.some(
    (application: any) => application.lawyerId === currentUser?.id && application.status !== "REJECTED",
  );
  const isAssignedLawyer = currentUser?.id === job?.assignedLawyerId || currentUser?.id === job?.assignedExecutorId;
  const otherPartyName = isPoster 
    ? (job?.assignedLawyer?.fullName || job?.applications?.[0]?.lawyer?.fullName || "الطرف الآخر")
    : (job?.postedBy?.fullName || "الطرف الآخر");

  const timelineWithDates = useMemo(() => {
    const result: any[] = [];
    let lastDate: Date | null = null;
    
    [...timeline].forEach(item => {
      const itemDate = new Date(item.timestamp || item.createdAt);
      if (!lastDate || !isSameDay(lastDate, itemDate)) {
        result.push({ id: `date-${itemDate.toISOString()}`, type: "DATE_DIVIDER", date: itemDate });
        lastDate = itemDate;
      }
      result.push(item);
    });
    return result;
  }, [timeline]);

  const handleUpload = async (file: any) => {
    try {
      setIsUploading(true);

      const { data: urlData } = await apiClient.post('/uploads/presigned-url', {
        fileName: file.name || "attachment.jpeg",
        fileType: file.mimeType || "application/octet-stream",
        conversationId: conversationId
      });

      await uploadFileToR2({
        localUri: Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri,
        presignedUrl: urlData.uploadUrl,
        contentType: file.mimeType || "application/octet-stream",
      });

      await actions.sendDocument({
        attachmentUrl: urlData.publicUrl,
        attachmentType: file.type === "image" ? "IMAGE" : "DOCUMENT",
        attachmentName: file.name || "مستند",
        attachmentSize: file.size,
      });
      setModalType(null);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentPick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (!res.canceled && res.assets.length > 0) handleUpload(res.assets[0]);
  };

  const handleImagePick = async (fromCamera: boolean) => {
    let result;
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchCameraAsync({});
    } else {
      result = await ImagePicker.launchImageLibraryAsync({});
    }
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      handleUpload({ ...asset, name: asset.fileName || "image.jpg", type: "image", mimeType: asset.mimeType || "image/jpeg" });
    }
  };

  const submitModal = async () => {
    if (!inputValue.trim()) return;
    try {
      if (modalType === "OFFER") {
        await actions.sendOffer(Number(inputValue));
      } else if (modalType === "NOTE") {
        await actions.sendNote(inputValue);
      }
      setModalType(null);
      setInputValue("");
    } catch (e) {
      console.error(e);
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
            <CheckCircle size={14} color={colors.amber} style={{ marginLeft: 6 }} />
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
      const isImage = item.attachmentType === "IMAGE" || item.attachmentName?.match(/\.(jpeg|jpg|gif|png)$/i);

      return (
        <View style={[styles.cardContainer, isMe ? styles.alignMe : styles.alignOther, { opacity }]}>
          <View style={styles.noteCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardSender}>{isMe ? "أنت" : otherPartyName}</Text>
              <Text style={styles.cardTime}>{timeStr}</Text>
            </View>
            
            <View style={styles.docRow}>
              {isImage && item.attachmentUrl ? (
                <RNImage source={{ uri: item.attachmentUrl }} style={styles.docThumbnail} />
              ) : (
                <FileText size={24} color={colors.navy} />
              )}
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>{item.attachmentName || "مستند"}</Text>
                {item.attachmentSize && (
                  <Text style={styles.docSize}>{Math.round(item.attachmentSize / 1024)} KB</Text>
                )}
              </View>
            </View>

            {item.status === "pending" && <Text style={styles.pendingText}>جاري الإرسال...</Text>}
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.cardContainer, isMe ? styles.alignMe : styles.alignOther, { opacity }]}>
        <View style={[styles.noteCard, isMe ? styles.noteCardMe : styles.noteCardOther]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardSender}>{isMe ? "أنت" : otherPartyName}</Text>
            <Text style={styles.cardTime}>{timeStr}</Text>
          </View>
          <Text style={styles.noteText}>{item.content}</Text>
          {item.status === "pending" && <Text style={styles.pendingText}>جاري الإرسال...</Text>}
        </View>
      </View>
    );
  };

  const canOffer = job?.status === "NEGOTIATING" || !job?.status;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Info Bar */}
        {job?.status && (
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>
              {job.status === "NEGOTIATING" ? "قيد التفاوض" : job.status === "AGREED" ? "تم الاتفاق" : job.status}
            </Text>
          </View>
        )}

      {job && (isPoster || isAssignedLawyer || hasApplied) ? (
        <JobLifecycleStepper status={job.status} hasApplied={hasApplied} />
      ) : null}

      {timeline.length === 0 && !isFetching ? (
        <EmptyState
          illustration={<EmptyStateIllustration kind="chat" />}
          headline="ستظهر مفاوضاتك هنا"
          body="قدّم على مهمة لبدء محادثة والتفاوض مباشرة."
        />
      ) : (
        <FlatList
          data={timelineWithDates}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && timeline.length > 0} onRefresh={refetch} />}
          ref={(ref) => {
            setTimeout(() => ref?.scrollToEnd({ animated: true }), 100);
          }}
        />
      )}

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {canOffer ? (
          <ContextualTooltip
            storageKey="@wakeel_tip_chat_offer_v1"
            illustration="offer"
            message="اقترح أتعابك مباشرة من هنا."
          >
            <TouchableOpacity style={styles.actionButton} onPress={() => setModalType("OFFER")}>
              <DollarSign size={18} color={colors.white} />
              <Text style={styles.actionButtonText}>إرسال عرض</Text>
            </TouchableOpacity>
          </ContextualTooltip>
        ) : (
          <View style={[styles.actionButton, { opacity: 0.5 }]}>
            <DollarSign size={18} color={colors.white} />
            <Text style={styles.actionButtonText}>إرسال عرض</Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.actionButton} onPress={() => setModalType("DOCUMENT")}>
          <FileText size={18} color={colors.white} />
          <Text style={styles.actionButtonText}>رفع مستند</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => setModalType("NOTE")}>
          <MessageSquare size={18} color={colors.white} />
          <Text style={styles.actionButtonText}>إضافة ملاحظة</Text>
        </TouchableOpacity>
      </View>

      {/* Input Modal */}
      <Modal visible={!!modalType} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === "OFFER" ? "إرسال عرض مالي" : modalType === "DOCUMENT" ? "رفع مستند" : "إضافة ملاحظة"}
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <X size={24} color={colors.ink} />
              </TouchableOpacity>
            </View>

            {modalType === "OFFER" && (
              <View>
                <TextInput
                  style={styles.modalInput}
                  value={inputValue}
                  onChangeText={setInputValue}
                  keyboardType="numeric"
                  placeholder="أدخل المبلغ (ج.م)"
                  autoFocus
                />
                <View style={styles.chipRow}>
                  {[100, 200, 500, 1000].map(amt => (
                    <TouchableOpacity key={amt} style={styles.chip} onPress={() => setInputValue(amt.toString())}>
                      <Text style={styles.chipText}>{amt} ج.م</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity 
                  style={[styles.submitBtn, { opacity: Number(inputValue) > 0 ? 1 : 0.5 }]} 
                  disabled={Number(inputValue) <= 0} 
                  onPress={submitModal}
                >
                  <Text style={styles.submitBtnText}>إرسال العرض</Text>
                </TouchableOpacity>
              </View>
            )}

            {modalType === "NOTE" && (
              <View>
                <TextInput
                  style={styles.modalInputArea}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder="اكتب ملاحظتك هنا..."
                  multiline
                  autoFocus
                />
                <TouchableOpacity 
                  style={[styles.submitBtn, { opacity: inputValue.trim() ? 1 : 0.5 }]} 
                  disabled={!inputValue.trim()} 
                  onPress={submitModal}
                >
                  <Text style={styles.submitBtnText}>إرسال</Text>
                </TouchableOpacity>
              </View>
            )}

            {modalType === "DOCUMENT" && (
              <View>
                {isUploading ? (
                  <View style={{ alignItems: "center", padding: spacing.lg }}>
                    <ActivityIndicator size="large" color={colors.navy} />
                    <Text style={{ marginTop: spacing.md, fontFamily: fonts.bodySemibold }}>جاري الرفع...</Text>
                  </View>
                ) : (
                  <View style={styles.docOptionRow}>
                    <TouchableOpacity style={styles.docOptionBtn} onPress={() => handleImagePick(true)}>
                      <Camera size={28} color={colors.navy} />
                      <Text style={styles.docOptionText}>كاميرا</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.docOptionBtn} onPress={() => handleImagePick(false)}>
                      <ImageIcon size={28} color={colors.navy} />
                      <Text style={styles.docOptionText}>معرض الصور</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.docOptionBtn} onPress={handleDocumentPick}>
                      <FileText size={28} color={colors.navy} />
                      <Text style={styles.docOptionText}>ملف / مستند</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({ 
  container: { flex: 1, backgroundColor: colors.paper },

  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backBtn: { padding: spacing.xs, marginRight: spacing.xs },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.ink },
  headerSubtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  headerPill: { backgroundColor: colors.paper, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
  headerPillText: { fontFamily: fonts.bodySemibold, fontSize: 11, color: colors.navy },

  listContent: { padding: spacing.md, paddingBottom: 40 },

  dateDividerWrapper: { alignItems: "center", marginVertical: spacing.md },
  dateDivider: { backgroundColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  dateDividerText: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },

  systemCardWrapper: { alignItems: "center", marginVertical: spacing.xs },
  systemCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.amberBg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  systemText: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.amber },

  cardContainer: { marginBottom: spacing.md, maxWidth: "85%" },
  alignMe: { alignSelf: "flex-start" },
  alignOther: { alignSelf: "flex-end" },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  cardSender: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.navy },
  cardTime: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },

  noteCard: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  noteCardMe: { backgroundColor: "#F0F4F8", borderColor: "#D9E2EC" },
  noteCardOther: { backgroundColor: colors.white, borderColor: colors.line },
  noteText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 22, textAlign: "right" },

  docRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xs },
  docThumbnail: { width: 44, height: 44, borderRadius: radius.sm, marginRight: spacing.sm },
  docInfo: { marginLeft: spacing.sm, flex: 1 },
  docName: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink, textAlign: "right" },
  docSize: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textAlign: "right" },

  pendingText: { fontSize: 11, color: colors.muted, fontStyle: "italic", marginTop: 4, textAlign: "right" },

  bottomBar: {
    flexDirection: "row",
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderColor: colors.line,
    justifyContent: "space-between",
    gap: spacing.xxs,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 3,
  },
  actionButtonText: { color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 12 },


  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.ink },
  modalInput: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.sm, fontFamily: fonts.body, fontSize: 16, height: 50, textAlign: "right", marginBottom: spacing.md },
  modalInputArea: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, fontFamily: fonts.body, fontSize: 15, minHeight: 100, textAlignVertical: "top", textAlign: "right", marginBottom: spacing.md },
  chipRow: { flexDirection: "row", gap: spacing.xs, justifyContent: "center", marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  chipText: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.navy },
  submitBtn: { backgroundColor: colors.navy, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: "center" },
  submitBtnText: { color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 15 },

  docOptionRow: { flexDirection: "row", gap: spacing.md, justifyContent: "center", paddingVertical: spacing.md },
  docOptionBtn: { flex: 1, backgroundColor: colors.paper, padding: spacing.md, borderRadius: radius.md, alignItems: "center", borderWidth: 1, borderColor: colors.line },
  docOptionText: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.navy, marginTop: spacing.xs },
});
