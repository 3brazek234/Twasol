
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Platform, KeyboardAvoidingView, Image as RNImage, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useNegotiationTimeline, useNegotiationActions } from "../../hooks/useNegotiation";
import { useJob } from "../../hooks/useJobs";
import { useAuthStore } from "../../stores/authStore";
import { FileText, DollarSign, MessageSquare, X, CheckCircle, Clock, XCircle, Download, Camera, Image as ImageIcon, Handshake, ChevronRight } from "lucide-react-native";
import { safeFormatTime, formatCurrency } from "../../utils/dateUtils";
import { colors, fonts, spacing, radius } from "../../theme/tokens";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, Layout } from "react-native-reanimated";
import { apiClient } from "../../api/client";

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
  const { jobId, conversationId } = route.params;
  const { data: rawJob, isLoading: isLoadingJob } = useJob(jobId);
  const job = rawJob as any;
  const { data: timeline = [], refetch, isFetching } = useNegotiationTimeline(conversationId);
  const actions = useNegotiationActions(conversationId);
  const currentUser = useAuthStore(state => state.user);

  const [modalType, setModalType] = useState<"OFFER" | "NOTE" | "DOCUMENT" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      actions.markAsRead();
    }, [timeline.length])
  );

  const isPoster = currentUser?.id === job?.postedByUserId;
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
      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri,
        type: file.mimeType || "application/octet-stream",
        name: file.name || "attachment.jpeg",
      } as any);

      const uploadRes = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await actions.sendDocument({
        attachmentUrl: uploadRes.data.url,
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

  const getStatusPill = (status: string) => {
    switch (status) {
      case "NEGOTIATING": return { label: "قيد التفاوض", bg: "rgba(255,255,255,0.2)", text: "#fff" };
      case "AGREED": return { label: "تم الاتفاق", bg: "rgba(25,135,84,0.9)", text: "#fff" };
      case "IN_PROGRESS": return { label: "قيد التنفيذ", bg: "rgba(25,135,84,0.9)", text: "#fff" };
      default: return { label: status, bg: "rgba(255,255,255,0.2)", text: "#fff" };
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
        <Animated.View entering={FadeInUp.duration(200)} layout={Layout} style={styles.systemCardWrapper}>
          <View style={styles.systemCard}>
            <CheckCircle size={14} color="#92400E" style={{ marginLeft: 6 }} />
            <Text style={styles.systemText}>{item.content}</Text>
          </View>
        </Animated.View>
      );
    }

    const isMe = item.senderId === currentUser?.id;
    const timeStr = safeFormatTime(item.timestamp || item.createdAt);
    const opacity = item.status === "pending" ? 0.6 : 1;

    if (item.type === "OFFER") {
      const isPending = item.offerStatus === "PENDING";
      const isAccepted = item.offerStatus === "ACCEPTED";
      const isRejected = item.offerStatus === "REJECTED";
      const isWithdrawn = item.offerStatus === "WITHDRAWN";

      const borderColor = isPending ? "#C0973B" : isAccepted ? "#198754" : isRejected ? "#DC3545" : "#ADB5BD";
      const bgColor = isAccepted ? "#F0FDF4" : "#fff";
      const wrapOpacity = (isRejected || isWithdrawn) ? 0.7 : opacity;

      return (
        <Animated.View entering={FadeInUp.duration(200)} layout={Layout} style={[styles.offerCardWrapper, { opacity: wrapOpacity }]}>
          <View style={[styles.offerCard, { borderRightColor: borderColor, backgroundColor: bgColor }]}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardTime}>{timeStr}</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.offerLabel}>عرض مالي</Text>
                <View style={[styles.offerIconWrap, { backgroundColor: borderColor }]}>
                  <DollarSign size={14} color="white" />
                </View>
              </View>
            </View>

            <Text style={styles.offerAmountValue}>{formatCurrency(Number(item.offerAmount))}</Text>
            <Text style={styles.offerSender}>من: {isMe ? "أنت" : otherPartyName}</Text>

            <View style={styles.offerFooter}>
              {isPending && !isMe && (
                <View style={styles.offerActionRow}>
                  <TouchableOpacity style={styles.offerAcceptBtn} onPress={() => actions.acceptOffer(item.id)}>
                    <Text style={styles.offerAcceptText}>قبول العرض ✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.offerRejectBtn} onPress={() => actions.rejectOffer(item.id)}>
                    <Text style={styles.offerRejectText}>رفض</Text>
                  </TouchableOpacity>
                </View>
              )}
              {isPending && isMe && (
                <View style={styles.offerPendingRow}>
                  <Text style={styles.offerPendingText}>بانتظار رد الطرف الآخر...</Text>
                  <ActivityIndicator size="small" color="#C0973B" style={{ marginLeft: 6 }} />
                </View>
              )}
              {isAccepted && (
                <View style={styles.offerResultRow}>
                  <Text style={[styles.offerResultText, { color: "#198754" }]}>تم القبول</Text>
                  <CheckCircle size={16} color="#198754" style={{ marginLeft: 6 }} />
                </View>
              )}
              {isRejected && (
                <View style={styles.offerResultRow}>
                  <Text style={[styles.offerResultText, { color: "#DC3545" }]}>تم الرفض</Text>
                  <XCircle size={16} color="#DC3545" style={{ marginLeft: 6 }} />
                </View>
              )}
              {isWithdrawn && (
                <View style={styles.offerResultRow}>
                  <Text style={[styles.offerResultText, { color: "#6C757D" }]}>تم سحب العرض تلقائياً</Text>
                  <Clock size={16} color="#6C757D" style={{ marginLeft: 6 }} />
                </View>
              )}
            </View>
            {item.status === "pending" && <Text style={styles.pendingIndicator}>جاري الإرسال...</Text>}
          </View>
        </Animated.View>
      );
    }

    if (item.attachmentType || item.attachmentUrl) {
      const isImage = item.attachmentType === "IMAGE" || item.attachmentName?.match(/\.(jpeg|jpg|gif|png)$/i);
      const isPdf = item.attachmentType === "PDF" || item.attachmentName?.match(/\.pdf$/i);
      
      const iconBg = isPdf ? "#F8D7DA" : isImage ? "#CFE2FF" : "#E2E3E5";
      const IconComponent = isPdf ? FileText : isImage ? ImageIcon : FileText;
      const iconColor = isPdf ? "#DC3545" : isImage ? "#0D6EFD" : "#495057";

      return (
        <Animated.View entering={FadeInUp.duration(200)} layout={Layout} style={[styles.docCardWrapper, { opacity }]}>
          <View style={styles.docCardRow}>
            <TouchableOpacity style={styles.docDownloadBtn}>
              <Download size={20} color="#1B4F72" />
            </TouchableOpacity>
            
            <View style={styles.docInfoCol}>
              <Text style={styles.docName} numberOfLines={1}>{item.attachmentName || "مستند"}</Text>
              <Text style={styles.docSize}>{item.attachmentSize ? `${Math.round(item.attachmentSize/1024)} KB` : ""}</Text>
            </View>
            
            <View style={styles.docIconContainer}>
               {isImage && item.attachmentUrl ? (
                 <RNImage source={{ uri: item.attachmentUrl }} style={styles.docThumbnail} />
               ) : (
                 <View style={[styles.docIconBg, { backgroundColor: iconBg }]}>
                   <IconComponent size={24} color={iconColor} />
                 </View>
               )}
            </View>
          </View>
          <Text style={styles.docAttribution}>رفعه {isMe ? "أنت" : otherPartyName} · {timeStr}</Text>
          {item.status === "pending" && <Text style={styles.pendingIndicator}>جاري الإرسال...</Text>}
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeInUp.duration(200)} layout={Layout} style={[styles.noteCardWrapper, { opacity }]}>
        <View style={[styles.noteCard, isMe ? styles.noteCardMe : styles.noteCardOther]}>
          <Text style={styles.noteSender}>{isMe ? "أنت" : otherPartyName}</Text>
          <Text style={styles.noteText}>{item.content}</Text>
          <Text style={styles.noteTime}>{timeStr}</Text>
          {item.status === "pending" && <Text style={styles.pendingIndicator}>جاري الإرسال...</Text>}
        </View>
      </Animated.View>
    );
  };

  const pill = job ? getStatusPill(job.status) : null;
  const canOffer = job?.status === "NEGOTIATING";

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1B4F72", "#2E86C1"]} style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronRight size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            {isLoadingJob ? (
               <View style={[styles.skeletonLine, { width: 120, height: 16 }]} />
            ) : (
               <Text style={styles.headerTitle} numberOfLines={1}>{job?.title}</Text>
            )}
          </View>
          <View style={styles.headerStatusRight}>
             {pill && (
               <View style={[styles.headerBadge, { backgroundColor: pill.bg }]}>
                 <Text style={[styles.headerBadgeText, { color: pill.text }]}>{pill.label}</Text>
               </View>
             )}
          </View>
        </View>
        
        <View style={styles.headerBottomRow}>
           {isLoadingJob ? (
             <View style={[styles.skeletonLine, { width: 180, height: 12 }]} />
           ) : (
             <Text style={styles.headerSubtitle} numberOfLines={1}>
               {otherPartyName} {job?.court?.nameAr ? `· ${job.court.nameAr}` : ""}
             </Text>
           )}
           
           {job?.status === "AGREED" && job?.agreedSalary && (
             <Text style={styles.headerAgreedSalary}>{formatCurrency(Number(job.agreedSalary))} ✓</Text>
           )}
        </View>
      </LinearGradient>

      {timeline.length === 0 && !isFetching ? (
        <View style={styles.emptyState}>
          <Handshake size={64} color="#C0973B" style={{ opacity: 0.5, marginBottom: 16 }} />
          <Text style={styles.emptyStateTitle}>ابدأ التفاوض</Text>
          <Text style={styles.emptyStateSub}>أرسل عرضاً مالياً أو أضف ملاحظة لبدء النقاش مع الطرف الآخر</Text>
        </View>
      ) : (
        <FlatList
          data={timelineWithDates}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && timeline.length > 0} onRefresh={refetch} />}
          ref={(ref) => { setTimeout(() => ref?.scrollToEnd({ animated: true }), 100); }}
          onContentSizeChange={(w, h) => { /* Auto-scroll handled by ref */ }}
        />
      )}

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setModalType("NOTE")}>
          <MessageSquare size={24} color="#6C757D" style={{ marginBottom: 4 }} />
          <Text style={[styles.actionBtnText, { color: "#6C757D" }]}>ملاحظة</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn} onPress={() => setModalType("DOCUMENT")}>
          <FileText size={24} color="#1B4F72" style={{ marginBottom: 4 }} />
          <Text style={[styles.actionBtnText, { color: "#1B4F72" }]}>مستند</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, !canOffer && { opacity: 0.5 }]} 
          disabled={!canOffer}
          onPress={() => setModalType("OFFER")}
        >
          <DollarSign size={24} color="#C0973B" style={{ marginBottom: 4 }} />
          <Text style={[styles.actionBtnText, { color: "#C0973B" }]}>عرض مالي</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!modalType} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <X size={24} color="#1C2333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {modalType === "OFFER" ? "إرسال عرض مالي" : modalType === "DOCUMENT" ? "رفع مستند" : "إضافة ملاحظة"}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {modalType === "OFFER" && (
              <View style={styles.modalBody}>
                <View style={styles.offerInputWrapper}>
                  <TextInput 
                    style={styles.offerInput}
                    keyboardType="numeric"
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder="0"
                    autoFocus
                  />
                  <Text style={styles.offerSuffix}>ج.م</Text>
                </View>
                <View style={styles.chipRow}>
                  {[500, 1000, 2000, 5000].map(amt => (
                    <TouchableOpacity key={amt} style={styles.chip} onPress={() => setInputValue(amt.toString())}>
                      <Text style={styles.chipText}>{amt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity 
                  style={[styles.modalSubmitBtn, { backgroundColor: "#C0973B", opacity: Number(inputValue) > 0 ? 1 : 0.5 }]} 
                  disabled={Number(inputValue) <= 0} 
                  onPress={submitModal}
                >
                  <Text style={styles.modalSubmitText}>إرسال العرض</Text>
                </TouchableOpacity>
              </View>
            )}

            {modalType === "NOTE" && (
              <View style={styles.modalBody}>
                <TextInput
                  style={styles.modalInput}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder="اكتب ملاحظتك هنا..."
                  multiline
                  autoFocus
                />
                <TouchableOpacity 
                  style={[styles.modalSubmitBtn, { backgroundColor: "#1B4F72", opacity: inputValue.trim() ? 1 : 0.5 }]} 
                  disabled={!inputValue.trim()} 
                  onPress={submitModal}
                >
                  <Text style={styles.modalSubmitText}>إرسال</Text>
                </TouchableOpacity>
              </View>
            )}

            {modalType === "DOCUMENT" && (
              <View style={styles.modalBody}>
                {isUploading ? (
                  <View style={{ alignItems: "center", padding: 32 }}>
                    <ActivityIndicator size="large" color="#1B4F72" />
                    <Text style={{ marginTop: 16, fontFamily: fonts.bodySemibold }}>جاري الرفع...</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
                    <TouchableOpacity style={styles.docOptionBtn} onPress={() => handleImagePick(true)}>
                      <Camera size={32} color="#1B4F72" style={{ marginBottom: 8 }} />
                      <Text style={styles.docOptionText}>كاميرا</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.docOptionBtn} onPress={() => handleImagePick(false)}>
                      <ImageIcon size={32} color="#1B4F72" style={{ marginBottom: 8 }} />
                      <Text style={styles.docOptionText}>صورة</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.docOptionBtn} onPress={handleDocumentPick}>
                      <FileText size={32} color="#1B4F72" style={{ marginBottom: 8 }} />
                      <Text style={styles.docOptionText}>ملف</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  headerContainer: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, elevation: 4, shadowColor: "#000", shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.1, shadowRadius: 4 },
  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 4 },
  headerTitleGroup: { flex: 1, alignItems: "center", marginHorizontal: 8 },
  headerTitle: { fontFamily: fonts.bodySemibold, fontSize: 16, color: "#fff" },
  headerStatusRight: { width: 60, alignItems: "flex-end" },
  headerBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingHorizontal: 8 },
  headerSubtitle: { fontFamily: fonts.body, fontSize: 12, color: "rgba(255,255,255,0.75)", flex: 1 },
  headerAgreedSalary: { fontFamily: fonts.bodySemibold, fontSize: 12, color: "#C0973B" },
  headerBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  headerBadgeText: { fontFamily: fonts.bodySemibold, fontSize: 10 },
  skeletonLine: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4 },
  
  listContent: { padding: 16, paddingBottom: 40, gap: 12 },
  
  dateDividerWrapper: { alignItems: "center", marginVertical: 16 },
  dateDivider: { backgroundColor: "#E9ECEF", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  dateDividerText: { fontFamily: fonts.body, fontSize: 11, color: "#6C757D" },

  systemCardWrapper: { alignItems: "center", marginVertical: 8 },
  systemCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(192,151,59,0.1)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: "rgba(192,151,59,0.3)" },
  systemText: { fontFamily: fonts.bodySemibold, fontSize: 12, color: "#92400E" },

  offerCardWrapper: { marginBottom: 8 },
  offerCard: { borderRadius: 16, borderWidth: 1, borderColor: "#DEE2E6", borderRightWidth: 4, padding: 16, elevation: 2, shadowColor: "#000", shadowOffset: { height: 1, width: 0 }, shadowOpacity: 0.05, shadowRadius: 3 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTime: { fontFamily: fonts.body, fontSize: 11, color: "#6C757D" },
  offerLabel: { fontFamily: fonts.bodySemibold, fontSize: 12, color: "#1B4F72", marginRight: 6 },
  offerIconWrap: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  offerAmountValue: { fontFamily: fonts.bodySemibold, fontSize: 32, color: "#1B4F72", textAlign: "center", marginVertical: 16 },
  offerSender: { fontFamily: fonts.body, fontSize: 12, color: "#6C757D", textAlign: "center", marginBottom: 16 },
  offerFooter: { borderTopWidth: 1, borderTopColor: "#F1F3F5", paddingTop: 16 },
  offerActionRow: { flexDirection: "row", gap: 12 },
  offerAcceptBtn: { flex: 1, backgroundColor: "#198754", height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  offerAcceptText: { color: "#fff", fontFamily: fonts.bodySemibold, fontSize: 14 },
  offerRejectBtn: { flex: 1, backgroundColor: "transparent", height: 44, borderRadius: 12, borderWidth: 1, borderColor: "#DC3545", alignItems: "center", justifyContent: "center" },
  offerRejectText: { color: "#DC3545", fontFamily: fonts.bodySemibold, fontSize: 14 },
  offerPendingRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  offerPendingText: { fontFamily: fonts.body, fontSize: 12, color: "#6C757D", fontStyle: "italic" },
  offerResultRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  offerResultText: { fontFamily: fonts.bodySemibold, fontSize: 14 },
  
  docCardWrapper: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#DEE2E6", padding: 12, marginBottom: 8 },
  docCardRow: { flexDirection: "row", alignItems: "center" },
  docIconContainer: { width: 44, height: 44, borderRadius: 10, overflow: "hidden", marginLeft: 12 },
  docIconBg: { flex: 1, alignItems: "center", justifyContent: "center" },
  docThumbnail: { width: "100%", height: "100%" },
  docInfoCol: { flex: 1, alignItems: "flex-end" },
  docName: { fontFamily: fonts.bodySemibold, fontSize: 14, color: "#212529" },
  docSize: { fontFamily: fonts.body, fontSize: 11, color: "#6C757D", marginTop: 2 },
  docDownloadBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F8F9FA", alignItems: "center", justifyContent: "center", marginRight: 8 },
  docAttribution: { fontFamily: fonts.body, fontSize: 11, color: "#6C757D", textAlign: "right", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F8F9FA" },

  noteCardWrapper: { marginBottom: 8 },
  noteCard: { borderRadius: 14, padding: 14, maxWidth: "85%" },
  noteCardMe: { backgroundColor: "#F1F5F9", alignSelf: "flex-start" },
  noteCardOther: { backgroundColor: "#F8F9FA", alignSelf: "flex-end", borderWidth: 1, borderColor: "#E9ECEF" },
  noteSender: { fontFamily: fonts.bodySemibold, fontSize: 12, color: "#1B4F72", textAlign: "right", marginBottom: 4 },
  noteText: { fontFamily: fonts.body, fontSize: 14, color: "#212529", lineHeight: 20, textAlign: "right" },
  noteTime: { fontFamily: fonts.body, fontSize: 10, color: "#ADB5BD", textAlign: "left", marginTop: 8 },

  pendingIndicator: { fontSize: 11, color: "#ADB5BD", fontStyle: "italic", textAlign: "center", marginTop: 4 },

  actionBar: { flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#DEE2E6", padding: 12, paddingBottom: 24, elevation: 8, shadowColor: "#000", shadowOffset: { height: -2, width: 0 }, shadowOpacity: 0.05, shadowRadius: 4 },
  actionBtn: { flex: 1, height: 64, backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#DEE2E6", borderRadius: 14, alignItems: "center", justifyContent: "center", marginHorizontal: 4 },
  actionBtnText: { fontFamily: fonts.bodySemibold, fontSize: 12 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyStateTitle: { fontFamily: fonts.bodySemibold, fontSize: 18, color: "#212529", marginBottom: 8 },
  emptyStateSub: { fontFamily: fonts.body, fontSize: 14, color: "#6C757D", textAlign: "center", lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  dragHandle: { width: 40, height: 4, backgroundColor: "#DEE2E6", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontFamily: fonts.bodySemibold, fontSize: 18, color: "#212529" },
  modalBody: { paddingBottom: 24 },
  modalInput: { borderWidth: 1, borderColor: "#DEE2E6", borderRadius: 14, padding: 16, fontFamily: fonts.body, fontSize: 16, minHeight: 120, textAlignVertical: "top", textAlign: "right" },
  modalSubmitBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 16 },
  modalSubmitText: { color: "#fff", fontFamily: fonts.bodySemibold, fontSize: 16 },
  offerInputWrapper: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  offerInput: { fontFamily: fonts.bodySemibold, fontSize: 32, color: "#1B4F72", textAlign: "center", minWidth: 100 },
  offerSuffix: { fontFamily: fonts.bodySemibold, fontSize: 24, color: "#6C757D", marginLeft: 8 },
  chipRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#DEE2E6" },
  chipText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: "#1B4F72" },
  docOptionBtn: { flex: 1, backgroundColor: "#F8F9FA", padding: 16, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#DEE2E6" },
  docOptionText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: "#1B4F72" }
});
