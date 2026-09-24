import React from "react";
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useAdminPendingVerifications } from "../../hooks/useAdminVerifications";
import { tokens } from "../../theme/tokens";
import { CheckCircle, Clock, ChevronLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

export const AdminVerificationQueueScreen = () => {
  const { data, isLoading, refetch, isRefetching } = useAdminPendingVerifications(1, 20);
  const navigation = useNavigation<any>();

  const renderItem = ({ item }: any) => {
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate("AdminVerificationDetail", { user: item })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.userName}>{item.fullName || "مستخدم مجهول"}</Text>
            <Text style={styles.userEmail}>{item.email || ""}</Text>
          </View>
          <View style={styles.badge}>
            <Clock size={12} color={tokens.colors.amber} />
            <Text style={styles.badgeText}>قيد الانتظار</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.barNumber}>رقم القيد: {item.barNumber || "غير متوفر"}</Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString("ar-EG")}
          </Text>
        </View>
      </TouchableOpacity>
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
    <ScreenContainer scroll={false} >
      <FlatList
        data={data?.data || []}
        keyExtractor={(item: any) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <CheckCircle size={48} color={tokens.colors.verdant} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>قائمة فارغة!</Text>
            <Text style={styles.emptyText}>لا توجد طلبات توثيق قيد الانتظار حالياً.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paper },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: tokens.colors.white, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: tokens.colors.line },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  userName: { fontFamily: tokens.typography.fonts.displayBold, fontSize: 16, color: tokens.colors.ink, textAlign: "left", marginBottom: 4 },
  userEmail: { fontFamily: tokens.typography.fonts.body, fontSize: 13, color: tokens.colors.muted, textAlign: "left" },
  badge: { flexDirection: "row", alignItems: "center", backgroundColor: tokens.colors.amber + "1A", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16, gap: 4 },
  badgeText: { fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 12, color: tokens.colors.amber },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: tokens.colors.line, paddingTop: 12 },
  barNumber: { fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 13, color: tokens.colors.ink },
  date: { fontFamily: tokens.typography.fonts.mono, fontSize: 12, color: tokens.colors.muted },
  empty: { padding: 32, alignItems: "center", justifyContent: "center", marginTop: 100 },
  emptyTitle: { fontFamily: tokens.typography.fonts.displayBold, fontSize: 20, color: tokens.colors.ink, marginBottom: 8 },
  emptyText: { fontFamily: tokens.typography.fonts.body, fontSize: 16, color: tokens.colors.muted, textAlign: "center" }
});
