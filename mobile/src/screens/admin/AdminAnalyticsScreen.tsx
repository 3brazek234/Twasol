import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { apiClient } from "../../api/client";
import { tokens } from "../../theme/tokens";
import { Users, CreditCard, Briefcase, ChevronRight, Activity, Clock, CheckCircle } from "lucide-react-native";

export const useAdminAnalyticsOverview = () => {
  return useQuery({
    queryKey: ['admin', 'analytics', 'overview'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/analytics/overview');
      return res.data.data;
    },
    staleTime: 60_000,
  });
};

export const AdminAnalyticsScreen = () => {
  const { data, isLoading, isRefetching, refetch, isError } = useAdminAnalyticsOverview();
  const navigation = useNavigation<any>();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={tokens.colors.signal} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>تعذر تحميل البيانات</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { funnel, revenue, fillRate, throughput, queues } = data;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      
      {/* TOP KPI ROW */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <CreditCard size={20} color={tokens.colors.signal} style={styles.kpiIcon} />
          <Text style={styles.kpiValue}>{(revenue.mrr / 100).toLocaleString()}</Text>
          <Text style={styles.kpiLabel}>إجمالي الإيرادات الشهرية (ج.م)</Text>
        </View>
        <View style={styles.kpiCard}>
          <Users size={20} color={tokens.colors.signal} style={styles.kpiIcon} />
          <Text style={styles.kpiValue}>{funnel.totalActiveSubscriptions.toLocaleString()}</Text>
          <Text style={styles.kpiLabel}>محامين نشطين</Text>
        </View>
        <View style={styles.kpiCard}>
          <Briefcase size={20} color={tokens.colors.signal} style={styles.kpiIcon} />
          <Text style={styles.kpiValue}>{throughput.decisionsLast7Days.toLocaleString()}</Text>
          <Text style={styles.kpiLabel}>القرارات خلال 7 أيام</Text>
        </View>
      </View>

      {/* FUNNEL SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الحالة الحالية للمحامين (قمع التحويل)</Text>
        <View style={styles.card}>
          <View style={styles.funnelStep}>
            <Text style={styles.funnelValue}>{funnel.totalRegistered}</Text>
            <Text style={styles.funnelLabel}>إجمالي المسجلين</Text>
          </View>
          
          <View style={styles.funnelArrow}>
            <View style={styles.funnelLine} />
            <Text style={styles.funnelPercent}>
              {funnel.totalRegistered > 0 ? Math.round((funnel.totalVerified / funnel.totalRegistered) * 100) : 0}%
            </Text>
          </View>

          <View style={styles.funnelStep}>
            <Text style={styles.funnelValue}>{funnel.totalVerified}</Text>
            <Text style={styles.funnelLabel}>الموثقون</Text>
          </View>

          <View style={styles.funnelArrow}>
            <View style={styles.funnelLine} />
            <Text style={styles.funnelPercent}>
              {funnel.totalVerified > 0 ? Math.round((funnel.totalActiveSubscriptions / funnel.totalVerified) * 100) : 0}%
            </Text>
          </View>

          <View style={styles.funnelStep}>
            <Text style={styles.funnelValue}>{funnel.totalActiveSubscriptions}</Text>
            <Text style={styles.funnelLabel}>المشتركون (نشط)</Text>
          </View>
        </View>
      </View>

      {/* OPERATIONS SHORTCUTS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>العمليات</Text>
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.shortcutRow}
            onPress={() => navigation.navigate("SettingsStack", { screen: "AdminVerificationQueue" })}
          >
            <View style={styles.shortcutIconBox}>
              <CheckCircle size={20} color={tokens.colors.signal} />
            </View>
            <Text style={styles.shortcutLabel}>طابور التوثيق</Text>
            {queues.pendingVerifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{queues.pendingVerifications}</Text>
              </View>
            )}
            <ChevronRight size={20} color={tokens.colors.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.shortcutRow}
            onPress={() => navigation.navigate("SettingsStack", { screen: "AdminSubscriptionQueue" })}
          >
            <View style={styles.shortcutIconBox}>
              <Activity size={20} color={tokens.colors.signal} />
            </View>
            <Text style={styles.shortcutLabel}>طابور الدفعات</Text>
            {queues.pendingPayments > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{queues.pendingPayments}</Text>
              </View>
            )}
            <ChevronRight size={20} color={tokens.colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* LIQUIDITY STATS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>مؤشرات الأداء</Text>
        <View style={styles.card}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>معدل إتمام المهام (30 يوم)</Text>
            <Text style={styles.statValue}>{Math.round(fillRate.fillRate * 100)}%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>متوسط وقت الانتظار الحالي للتوثيق</Text>
            <View style={styles.statValueBox}>
              <Clock size={14} color={tokens.colors.muted} style={{ marginEnd: 4 }} />
              <Text style={styles.statValueText}>
                {throughput.averageWaitTimeHours > 24 
                  ? `${Math.round(throughput.averageWaitTimeHours / 24)} يوم` 
                  : `${Math.round(throughput.averageWaitTimeHours)} ساعة`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.paper },
  errorText: { fontFamily: tokens.typography.fonts.body, color: tokens.colors.crimson, marginBottom: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: tokens.colors.white, borderRadius: 8, borderWidth: 1, borderColor: tokens.colors.line },
  retryBtnText: { fontFamily: tokens.typography.fonts.bodySemibold, color: tokens.colors.ink },
  container: { flex: 1, backgroundColor: tokens.colors.paper },
  content: { padding: 16 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  kpiCard: { flex: 1, backgroundColor: tokens.colors.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: tokens.colors.line, alignItems: 'center' },
  kpiIcon: { marginBottom: 8 },
  kpiValue: { fontFamily: tokens.typography.fonts.displayBold, fontSize: 18, color: tokens.colors.ink, marginBottom: 4 },
  kpiLabel: { fontFamily: tokens.typography.fonts.body, fontSize: 10, color: tokens.colors.muted, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: tokens.typography.fonts.displayBold, fontSize: 16, color: tokens.colors.ink, marginBottom: 12, textAlign: 'left' },
  card: { backgroundColor: tokens.colors.white, borderRadius: 12, borderWidth: 1, borderColor: tokens.colors.line, padding: 16 },
  funnelStep: { alignItems: 'center', paddingVertical: 8 },
  funnelValue: { fontFamily: tokens.typography.fonts.displayBold, fontSize: 24, color: tokens.colors.ink },
  funnelLabel: { fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 14, color: tokens.colors.muted },
  funnelArrow: { alignItems: 'center', marginVertical: -4, zIndex: -1 },
  funnelLine: { height: 40, width: 2, backgroundColor: tokens.colors.signal + "40" },
  funnelPercent: { position: 'absolute', top: 10, backgroundColor: tokens.colors.white, paddingHorizontal: 8, fontFamily: tokens.typography.fonts.mono, fontSize: 12, color: tokens.colors.signal, borderRadius: 12, borderWidth: 1, borderColor: tokens.colors.signal + "40" },
  shortcutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  shortcutIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: tokens.colors.signal + "1A", justifyContent: 'center', alignItems: 'center', marginEnd: 12 },
  shortcutLabel: { flex: 1, fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 15, color: tokens.colors.ink, textAlign: 'left' },
  badge: { backgroundColor: tokens.colors.amber, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginEnd: 8 },
  badgeText: { fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 12, color: tokens.colors.white },
  divider: { height: 1, backgroundColor: tokens.colors.line, marginVertical: 4 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  statLabel: { fontFamily: tokens.typography.fonts.body, fontSize: 14, color: tokens.colors.ink },
  statValue: { fontFamily: tokens.typography.fonts.displayBold, fontSize: 16, color: tokens.colors.signal },
  statValueBox: { flexDirection: 'row', alignItems: 'center' },
  statValueText: { fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 14, color: tokens.colors.muted },
});
