import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from "react-native";
import { usePendingVerifications, useReviewVerification, getDocumentViewUrl } from "../../hooks/useAdmin";
import { tokens } from "../../theme/tokens";
import { FileText, CheckCircle, XCircle } from "lucide-react-native";
import { getErrorMessage } from "../../utils/errorMessages";

export const AdminVerificationQueueScreen = () => {
  const { data, isLoading } = usePendingVerifications(1, 20);
  const { mutateAsync: reviewDocument } = useReviewVerification();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleReview = async (documentId: string, status: "APPROVED" | "REJECTED") => {
    setProcessingId(documentId);
    try {
      await reviewDocument({ documentId, status });
      Alert.alert("نجاح", `تم ${status === "APPROVED" ? "قبول" : "رفض"} المستند.`);
    } catch (err: any) {
      Alert.alert("خطأ", getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      const url = await getDocumentViewUrl(documentId);
      if (url) {
        Linking.openURL(url);
      }
    } catch (err: any) {
      Alert.alert("خطأ", getErrorMessage(err));
    }
  };

  const renderItem = ({ item }: any) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.userName}>{item.user?.fullName || "مستخدم مجهول"}</Text>
            <Text style={styles.userEmail}>{item.user?.email || ""}</Text>
          </View>
          <Text style={styles.date}>{new Date(item.submittedAt).toLocaleDateString("ar-EG")}</Text>
        </View>

        <TouchableOpacity style={styles.docButton} onPress={() => handleViewDocument(item.id)}>
          <FileText size={20} color={tokens.colors.signal} />
          <Text style={styles.docButtonText}>عرض المستند ({item.documentType})</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.approveBtn]} 
            onPress={() => handleReview(item.id, "APPROVED")}
            disabled={processingId === item.id}
          >
            {processingId === item.id ? <ActivityIndicator size="small" color="#FFF" /> : (
              <>
                <CheckCircle size={18} color="#FFF" />
                <Text style={styles.actionBtnText}>قبول</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.rejectBtn]} 
            onPress={() => handleReview(item.id, "REJECTED")}
            disabled={processingId === item.id}
          >
            {processingId === item.id ? <ActivityIndicator size="small" color="#FFF" /> : (
              <>
                <XCircle size={18} color="#FFF" />
                <Text style={styles.actionBtnText}>رفض</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={tokens.colors.signal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.items || []}
        keyExtractor={(item: any) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>لا توجد طلبات توثيق معلقة.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paper },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: tokens.colors.white, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: tokens.colors.line },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  userName: { fontFamily: tokens.typography.fonts.displayBold, fontSize: 16, color: tokens.colors.ink, textAlign: "left" },
  userEmail: { fontFamily: tokens.typography.fonts.body, fontSize: 13, color: tokens.colors.muted, textAlign: "left" },
  date: { fontFamily: tokens.typography.fonts.mono, fontSize: 12, color: tokens.colors.muted },
  docButton: { flexDirection: "row", alignItems: "center", backgroundColor: tokens.colors.navy + "1A", padding: 12, borderRadius: 8, marginBottom: 16 },
  docButtonText: { fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 14, color: tokens.colors.signal, marginLeft: 8 },
  actions: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 8, gap: 8 },
  approveBtn: { backgroundColor: tokens.colors.verdant },
  rejectBtn: { backgroundColor: tokens.colors.crimson },
  actionBtnText: { fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 14, color: "#FFF" },
  empty: { padding: 32, alignItems: "center" },
  emptyText: { fontFamily: tokens.typography.fonts.body, fontSize: 16, color: tokens.colors.muted }
});
