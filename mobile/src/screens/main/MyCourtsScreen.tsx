import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, Modal, Alert } from 'react-native';
import { useMyCourts, useRegisterCourt, useRemoveCourt, useToggleCourtStatus } from '../../hooks/useCourts';
import { LawyerCourt, CourtTypeLabelAr } from '../../schemas/court.schema';
import { tokens } from '../../theme/tokens';
import { Plus, Trash2, MapPin, Scale, Bell, BellOff } from 'lucide-react-native';
import { CourtPicker } from '../../components/CourtPicker';

export const MyCourtsScreen = () => {
  const { data: myCourts, isLoading: isLoadingMyCourts } = useMyCourts();
  const { mutate: registerCourt, isPending: isRegistering } = useRegisterCourt();
  const { mutate: removeCourt, isPending: isRemoving } = useRemoveCourt();
  const { mutate: toggleStatus, isPending: isToggling } = useToggleCourtStatus();

  const [pickerVisible, setPickerVisible] = useState(false);

  const activeCount = myCourts?.filter(c => c.isActive).length || 0;

  const handleRemove = (item: LawyerCourt) => {
    Alert.alert(
      'حذف المحكمة',
      `هل أنت متأكد من حذف "${item.court?.nameAr || 'المحكمة'}" من قائمتك؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => removeCourt(item.courtId) },
      ]
    );
  };

  const renderMyCourtItem = ({ item }: { item: LawyerCourt }) => (
    <View style={[styles.courtItem, !item.isActive && styles.courtItemInactive]}>
      <View style={styles.courtHeader}>
        <View style={styles.courtInfo}>
          <View style={styles.nameRow}>
            <View style={[styles.statusDot, { backgroundColor: item.isActive ? tokens.colors.verdant : tokens.colors.muted }]} />
            <Text style={styles.courtName}>{item.court?.nameAr || 'محكمة'}</Text>
          </View>
          
          <View style={styles.metaRow}>
            {item.court?.type && (
              <View style={[styles.badge, !item.isActive && styles.badgeInactive]}>
                <Text style={styles.badgeText}>{CourtTypeLabelAr[item.court.type]}</Text>
              </View>
            )}
            {item.court?.governorate && (
              <View style={styles.locationRow}>
                <MapPin size={12} color={tokens.colors.muted} />
                <Text style={styles.courtLocation}>{item.court.governorate.nameAr}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={() => handleRemove(item)}
          disabled={isRemoving}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={16} color={tokens.colors.crimson} />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextContainer}>
          <View style={styles.toggleLabelRow}>
            {item.isActive 
              ? <Bell size={14} color={tokens.colors.verdant} />
              : <BellOff size={14} color={tokens.colors.muted} />
            }
            <Text style={styles.toggleLabel}>
              {item.isActive ? 'الإشعارات مفعلة' : 'الإشعارات متوقفة'}
            </Text>
          </View>
          <Text style={styles.toggleDesc}>
            {item.isActive 
              ? 'ستتلقى إشعارات القضايا الجديدة في هذه المحكمة' 
              : 'لن تتلقى إشعارات لهذه المحكمة حالياً'}
          </Text>
        </View>
        <Switch
          trackColor={{ false: tokens.colors.line, true: 'rgba(47, 111, 94, 0.3)' }}
          thumbColor={item.isActive ? tokens.colors.verdant : tokens.colors.muted}
          value={item.isActive}
          onValueChange={(val) => toggleStatus({ id: item.courtId, isActive: val })}
          disabled={isToggling}
        />
      </View>
    </View>
  );

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.headerTitle}>محاكمي</Text>
      <Text style={styles.headerSubtitle}>
        {myCourts && myCourts.length > 0
          ? `${myCourts.length} محكمة مسجلة · ${activeCount} نشطة`
          : 'أضف المحاكم التي تمارس فيها لتتلقى إشعارات القضايا الجديدة'}
      </Text>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <Scale size={40} color={tokens.colors.signal} />
      </View>
      <Text style={styles.emptyTitle}>لا توجد محاكم مسجلة</Text>
      <Text style={styles.emptyDesc}>
        أضف المحاكم التي تعمل بها لتتلقى إشعارات فورية عند نشر قضايا جديدة في نطاق تخصصك.
      </Text>
      <TouchableOpacity 
        style={styles.emptyAction}
        onPress={() => setPickerVisible(true)}
      >
        <Plus size={18} color={tokens.colors.white} />
        <Text style={styles.emptyActionText}>إضافة أول محكمة</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoadingMyCourts ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={tokens.colors.navy} />
        </View>
      ) : (
        <FlatList
          data={myCourts}
          keyExtractor={(item) => item.id}
          renderItem={renderMyCourtItem}
          ListHeaderComponent={<ListHeader />}
          contentContainerStyle={{ padding: tokens.spacing.md, paddingBottom: 100 }}
          ListEmptyComponent={<EmptyState />}
        />
      )}

      {myCourts && myCourts.length > 0 && (
        <TouchableOpacity 
          activeOpacity={0.9}
          style={styles.fab} 
          onPress={() => setPickerVisible(true)}
        >
          <Plus size={18} color="#fff" style={{ marginEnd: 6 }} />
          <Text style={styles.fabText}>إضافة محكمة</Text>
        </TouchableOpacity>
      )}

      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet">
        <CourtPicker 
          onClose={() => setPickerVisible(false)}
          onSelectCourt={(court) => {
            registerCourt(court.id);
            setPickerVisible(false);
          }}
          myCourtsIds={myCourts?.map(mc => mc.courtId) || []}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paper },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listHeader: {
    marginBottom: tokens.spacing.lg,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: tokens.typography.sizes.xxl,
    fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.ink,
    textAlign: 'right',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: tokens.typography.sizes.sm,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    textAlign: 'right',
  },
  
  courtItem: { 
    backgroundColor: tokens.colors.white, 
    borderRadius: 16, 
    marginBottom: tokens.spacing.md, 
    borderWidth: 1,
    borderColor: tokens.colors.line,
    padding: tokens.spacing.md,
    shadowColor: tokens.colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  courtItemInactive: {
    opacity: 0.7,
    borderColor: tokens.colors.line,
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.sm,
  },
  courtInfo: { flex: 1, alignItems: 'flex-end' },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginStart: 8,
  },
  courtName: { 
    fontSize: tokens.typography.sizes.base, 
    fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.navy, 
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: tokens.colors.navy,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.radius.pill,
  },
  badgeInactive: {
    backgroundColor: tokens.colors.muted,
  },
  badgeText: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.paper,
  },
  locationRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  courtLocation: { 
    fontSize: tokens.typography.sizes.sm, 
    color: tokens.colors.muted, 
    marginEnd: 4, 
    fontFamily: tokens.typography.fonts.body 
  },
  removeButton: { 
    padding: tokens.spacing.xs, 
    borderRadius: 8, 
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  
  divider: {
    height: 1,
    backgroundColor: tokens.colors.line,
    marginVertical: tokens.spacing.xs,
  },
  
  toggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.xs,
  },
  toggleTextContainer: {
    flex: 1,
    marginStart: tokens.spacing.md,
    alignItems: 'flex-end',
  },
  toggleLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  toggleLabel: {
    fontSize: tokens.typography.sizes.sm,
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.ink,
    textAlign: 'right',
  },
  toggleDesc: {
    fontSize: tokens.typography.sizes.xs,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    lineHeight: 16,
    textAlign: 'right',
  },

  fab: { 
    position: 'absolute', 
    bottom: 30, 
    end: 20, 
    backgroundColor: tokens.colors.navy, 
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    borderRadius: 24, 
    elevation: 4,
    shadowColor: tokens.colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { 
    color: tokens.colors.white, 
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
    marginStart: 6,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: tokens.spacing.lg,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30, 64, 175, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  emptyTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.sm,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: tokens.typography.sizes.sm,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: tokens.spacing.xl,
  },
  emptyAction: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: tokens.colors.signal,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: tokens.radius.pill,
    gap: 8,
  },
  emptyActionText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.base,
  },
});
