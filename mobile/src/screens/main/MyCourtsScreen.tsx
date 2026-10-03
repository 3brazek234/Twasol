import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, Modal } from 'react-native';
import { useMyCourts, useRegisterCourt, useRemoveCourt, useToggleCourtStatus } from '../../hooks/useCourts';
import { LawyerCourt, CourtTypeLabelAr } from '../../schemas/court.schema';
import { tokens } from '../../theme/tokens';
import { Plus, Trash2, MapPin, X } from 'lucide-react-native';
import { CourtPicker } from '../../components/CourtPicker';
import { EmptyState } from '../../components/EmptyState';
import { EmptyStateIllustration } from '../../components/EmptyStateIllustration';

export const MyCourtsScreen = () => {
  const { data: myCourts, isLoading: isLoadingMyCourts } = useMyCourts();
  const { mutate: registerCourt, isPending: isRegistering } = useRegisterCourt();
  const { mutate: removeCourt, isPending: isRemoving } = useRemoveCourt();
  const { mutate: toggleStatus, isToggling } = useToggleCourtStatus() as any;

  const [pickerVisible, setPickerVisible] = useState(false);

  const renderMyCourtItem = ({ item }: { item: LawyerCourt }) => (
    <View style={styles.courtItem}>
      <View style={styles.courtHeader}>
        <View style={styles.courtInfo}>
          <Text style={styles.courtName}>{item.court?.nameAr || 'محكمة'}</Text>
          
          <View style={styles.metaRow}>
            {item.court?.type && (
              <View style={styles.badge}>
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
          onPress={() => removeCourt(item.courtId)}
          disabled={isRemoving}
        >
          <Trash2 size={16} color={tokens.colors.crimson} />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextContainer}>
          <Text style={styles.toggleLabel}>حالة المحكمة</Text>
          <Text style={styles.toggleDesc}>
            {item.isActive 
              ? "مفعل: ستتلقى إشعارات القضايا في هذه المحكمة" 
              : "معطل: لن تتلقى إشعارات لهذه المحكمة"}
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
          contentContainerStyle={{ padding: tokens.spacing.md, paddingBottom: 100, flexGrow: myCourts?.length ? 0 : 1 }}
          ListEmptyComponent={
            <EmptyState
              illustration={<EmptyStateIllustration kind="courts" />}
              headline="أضف المحاكم التي تعمل بها"
              body="أضف محاكمك لتظهر لك فرص حصرية في نطاقها."
            />
          }
        />
      )}

      <TouchableOpacity 
        activeOpacity={0.9}
        style={styles.fab} 
        onPress={() => setPickerVisible(true)}
      >
        <Plus size={18} color="#fff" style={{ marginEnd: 6 }} />
        <Text style={styles.fabText}>إضافة محكمة</Text>
      </TouchableOpacity>

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
  
  courtItem: { 
    backgroundColor: tokens.colors.white, 
    borderRadius: 16, 
    marginBottom: tokens.spacing.md, 
    borderWidth: 1,
    borderColor: tokens.colors.line,
    padding: tokens.spacing.md,
    shadowColor: tokens.colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.sm,
  },
  courtInfo: { flex: 1, alignItems: 'flex-end' },
  courtName: { 
    fontSize: tokens.typography.sizes.base, 
    fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.navy, 
    marginBottom: 6,
    textAlign: 'right'
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
  },
  toggleLabel: {
    fontSize: tokens.typography.sizes.sm,
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.ink,
    marginBottom: 2,
    textAlign: 'right'
  },
  toggleDesc: {
    fontSize: tokens.typography.sizes.xs,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    lineHeight: 16,
    textAlign: 'right'
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
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { 
    color: tokens.colors.white, 
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
    marginStart: 6 
  },
  empty: { 
    textAlign: 'center', 
    marginTop: 40, 
    color: tokens.colors.muted, 
    fontSize: tokens.typography.sizes.sm, 
    fontFamily: tokens.typography.fonts.body 
  }
});
