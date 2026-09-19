import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from "react-native";
import { useAdminVerificationDocuments, useApproveVerification, useRejectVerification } from "../../hooks/useAdminVerifications";
import { tokens } from "../../theme/tokens";
import { CheckCircle, XCircle, ArrowRight, AlertTriangle } from "lucide-react-native";
import { getErrorMessage } from "../../utils/errorMessages";

export const AdminVerificationDetailScreen = ({ route, navigation }: any) => {
  const { user } = route.params;
  const { data: documents, isLoading: isLoadingDocs, isError, refetch } = useAdminVerificationDocuments(user.id, true);
  
  const { mutateAsync: approve, isPending: isApproving } = useApproveVerification();
  const { mutateAsync: reject, isPending: isRejecting } = useRejectVerification();

  const [modalVisible, setModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = () => {
    Alert.alert(
      "تأكيد הקبول",
      "هل أنت متأكد من قبول توثيق هذا المحامي؟",
      [
        { text: "إلغاء", style: "cancel" },
        { 
          text: "تأكيد", 
          onPress: async () => {
            try {
              await approve(user.id);
              Alert.alert("نجاح", "تم قبول توثيق المحامي بنجاح.");
              navigation.goBack();
            } catch (err) {
              Alert.alert("خطأ", getErrorMessage(err));
            }
          }
        }
      ]
    );
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert("تنبيه", "سبب الرفض مطلوب.");
      return;
    }
    try {
      await reject({ userId: user.id, rejectionReason });
      Alert.alert("نجاح", "تم رفض توثيق المحامي.");
      setModalVisible(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert("خطأ", getErrorMessage(err));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowRight size={24} color={tokens.colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مراجعة طلب التوثيق</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.label}>الاسم</Text>
          <Text style={styles.value}>{user.fullName}</Text>
          
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <Text style={styles.value}>{user.email}</Text>

          <Text style={styles.label}>الهاتف</Text>
          <Text style={styles.value}>{user.phone || "غير متوفر"}</Text>
          
          <Text style={styles.label}>رقم القيد</Text>
          <Text style={styles.value}>{user.barNumber || "غير متوفر"}</Text>

          <Text style={styles.label}>رقم العضوية (النقابة)</Text>
          <Text style={styles.value}>{user.barId || "غير متوفر"}</Text>
        </View>

        <Text style={styles.sectionTitle}>المستندات المرفقة</Text>

        {isLoadingDocs ? (
          <View style={styles.docLoader}>
            <ActivityIndicator size="large" color={tokens.colors.signal} />
            <Text style={styles.loaderText}>جاري تحميل المستندات...</Text>
          </View>
        ) : isError ? (
          <View style={styles.errorBox}>
            <AlertTriangle size={32} color={tokens.colors.crimson} style={{ marginBottom: 8 }} />
            <Text style={styles.errorText}>تعذر تحميل المستندات أو انتهت صلاحية الرابط.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryText}>إعادة تحميل الصور</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.docsContainer}>
            {Object.keys(documents || {}).map((key) => (
              <View key={key} style={styles.docWrapper}>
                <Text style={styles.docTitle}>{key === 'ID_CARD' ? 'البطاقة الشخصية' : key === 'SYNDICATE_CARD' ? 'كارنيه النقابة' : key}</Text>
                <Image 
                  source={{ uri: documents[key].viewUrl }} 
                  style={styles.docImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.rejectBtn]} 
          onPress={() => setModalVisible(true)}
          disabled={isApproving || isRejecting}
        >
          <XCircle size={18} color={tokens.colors.crimson} />
          <Text style={[styles.actionBtnText, { color: tokens.colors.crimson }]}>رفض</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.approveBtn]} 
          onPress={handleApprove}
          disabled={isApproving || isRejecting || isLoadingDocs}
        >
          {isApproving ? <ActivityIndicator size="small" color="#FFF" /> : (
            <>
              <CheckCircle size={18} color="#FFF" />
              <Text style={styles.actionBtnText}>قبول ✓</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>سبب الرفض</Text>
            <Text style={styles.modalDesc}>يرجى توضيح سبب الرفض ليتمكن المحامي من تعديل طلبه وإعادة التقديم.</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: الصورة غير واضحة..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitBtn, !rejectionReason.trim() && { opacity: 0.5 }]} 
                onPress={handleRejectSubmit} 
                disabled={isRejecting || !rejectionReason.trim()}
              >
                <Text style={styles.submitText}>{isRejecting ? "جاري الرفض..." : "تأكيد الرفض"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paper },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: tokens.colors.white, borderBottomWidth: 1, borderBottomColor: tokens.colors.line },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: tokens.typography.fonts.displayBold, fontSize: 18, color: tokens.colors.ink },
  content: { flex: 1, padding: 16 },
  infoCard: { backgroundColor: tokens.colors.white, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: tokens.colors.line, marginBottom: 24 },
  label: { fontFamily: tokens.typography.fonts.body, fontSize: 13, color: tokens.colors.muted, marginBottom: 4 },
  value: { fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 15, color: tokens.colors.ink, marginBottom: 16, textAlign: "left" },
  sectionTitle: { fontFamily: tokens.typography.fonts.displayBold, fontSize: 18, color: tokens.colors.ink, marginBottom: 12 },
  docLoader: { padding: 32, alignItems: "center" },
  loaderText: { fontFamily: tokens.typography.fonts.body, fontSize: 14, color: tokens.colors.muted, marginTop: 12 },
  errorBox: { padding: 24, alignItems: "center", backgroundColor: tokens.colors.white, borderRadius: 12, borderWidth: 1, borderColor: tokens.colors.line },
  errorText: { fontFamily: tokens.typography.fonts.body, fontSize: 14, color: tokens.colors.ink, textAlign: "center", marginBottom: 16 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: tokens.colors.signal + "1A", borderRadius: 8 },
  retryText: { fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 14, color: tokens.colors.signal },
  docsContainer: { gap: 16, paddingBottom: 32 },
  docWrapper: { backgroundColor: tokens.colors.white, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: tokens.colors.line },
  docTitle: { fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 14, color: tokens.colors.ink, marginBottom: 8 },
  docImage: { width: "100%", height: 250, backgroundColor: tokens.colors.paper, borderRadius: 8 },
  footer: { flexDirection: "row", padding: 16, backgroundColor: tokens.colors.white, borderTopWidth: 1, borderTopColor: tokens.colors.line, gap: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 8, gap: 8 },
  rejectBtn: { backgroundColor: "transparent", borderWidth: 1, borderColor: tokens.colors.crimson },
  approveBtn: { backgroundColor: tokens.colors.verdant },
  actionBtnText: { fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 15, color: "#FFF" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { backgroundColor: tokens.colors.white, padding: 24, borderRadius: 16, width: "100%" },
  modalTitle: { fontFamily: tokens.typography.fonts.displayBold, fontSize: 18, color: tokens.colors.ink, marginBottom: 8 },
  modalDesc: { fontFamily: tokens.typography.fonts.body, fontSize: 14, color: tokens.colors.muted, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: tokens.colors.line, borderRadius: 8, padding: 12, height: 100, fontFamily: tokens.typography.fonts.body, fontSize: 15, color: tokens.colors.ink, marginBottom: 24 },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  cancelText: { fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 15, color: tokens.colors.muted },
  submitBtn: { flex: 1, backgroundColor: tokens.colors.crimson, alignItems: "center", justifyContent: "center", borderRadius: 8, paddingVertical: 12 },
  submitText: { fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 15, color: "#FFF" }
});
