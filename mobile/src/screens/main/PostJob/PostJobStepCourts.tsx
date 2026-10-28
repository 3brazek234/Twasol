import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, TextInput, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { tokens } from '../../../theme/tokens';
import { Landmark, MapPin, ChevronDown, Search, Check } from 'lucide-react-native';
import { useAllCourts, useGovernorates } from '../../../hooks/useCourts';
import { useAuthStore } from '../../../stores/authStore';
import { SelectedCourt } from './usePostJob';
import { CourtRow } from '../../../components/courts/CourtRow';

type CourtType = 'PARTIAL' | 'PRIMARY' | 'APPEAL' | 'CASSATION';

const COURT_LEVELS: { value: CourtType | null; label: string }[] = [
  { value: null,        label: 'الكل' },
  { value: 'PARTIAL',   label: 'جزئي' },
  { value: 'PRIMARY',   label: 'ابتدائي' },
  { value: 'APPEAL',    label: 'استئناف' },
  { value: 'CASSATION', label: 'نقض / عليا' },
];

interface Props {
  selectedCourt: SelectedCourt | null;
  onCourtSelected: (court: SelectedCourt) => void;
  errors: any;
}

export const PostJobStepCourts: React.FC<Props> = ({
  selectedCourt,
  onCourtSelected,
  errors,
}) => {
  const { user } = useAuthStore();
  const { data: governorates = [], isLoading: isLoadingGovs } = useGovernorates();

  const [selectedGovId, setSelectedGovId] = useState<string | null>(
    selectedCourt?.governorateId ?? (user as any)?.governorateId ?? null
  );
  const [isPickingGov, setIsPickingGov] = useState<boolean>(
    !(selectedCourt?.governorateId ?? (user as any)?.governorateId)
  );
  const [govSearchQuery, setGovSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<CourtType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCourts, setExpandedCourts] = useState<Set<string>>(new Set());

  const selectedGov = useMemo(
    () => governorates.find(g => g.id === selectedGovId) || null,
    [governorates, selectedGovId]
  );

  // Only fetches courts once a single governorate is selected (or when CASSATION is selected)
  const { data: courts = [], isFetching: isLoadingCourts } = useAllCourts({
    governorateId: selectedLevel === 'CASSATION' ? undefined : (selectedGovId || undefined),
    type: selectedLevel || undefined,
  });

  const toggleExpand = useCallback((id: string) => {
    setExpandedCourts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredGovernorates = useMemo(() => {
    if (!govSearchQuery.trim()) return governorates;
    const q = govSearchQuery.trim().toLowerCase();
    return governorates.filter(
      g => g.nameAr.toLowerCase().includes(q) || g.nameEn.toLowerCase().includes(q)
    );
  }, [governorates, govSearchQuery]);

  const filteredCourts = useMemo(() => {
    if (!searchQuery.trim()) return courts;
    const q = searchQuery.trim().toLowerCase();
    return courts.filter(court =>
      court.nameAr.toLowerCase().includes(q) ||
      (court.governorate?.nameAr || '').toLowerCase().includes(q)
    );
  }, [courts, searchQuery]);

  const handleSelectGovernorate = (govId: string) => {
    setSelectedGovId(govId);
    setIsPickingGov(false);
    setGovSearchQuery('');
    setSearchQuery('');
    setExpandedCourts(new Set());
    if (selectedLevel === 'CASSATION') {
      setSelectedLevel(null);
    }
  };

  const handleLevelPress = (level: CourtType | null) => {
    setSelectedLevel(level);
    setSearchQuery('');
    setExpandedCourts(new Set());
    if (level === 'CASSATION') {
      setIsPickingGov(false);
    } else if (!selectedGovId) {
      setIsPickingGov(true);
    }
  };

  const handleCourtPress = (court: any) => {
    onCourtSelected({
      id: court.id,
      nameAr: court.nameAr,
      type: court.type,
      cityAr: court.governorate?.nameAr,
      governorateId: court.governorateId || selectedGovId || undefined,
    });
  };

  const canShowCourts = selectedLevel === 'CASSATION' || (Boolean(selectedGovId) && !isPickingGov);

  return (
    <MotiView
      from={{ opacity: 0, translateX: 50 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -50 }}
      style={styles.stepContent}
    >
      {/* ─── Step 1: Single Governorate Selection ─── */}
      <Text style={styles.sectionLabel}>الخطوة ١: اختر المحافظة</Text>

      {selectedGov && !isPickingGov && selectedLevel !== 'CASSATION' ? (
        <TouchableOpacity
          style={styles.selectedGovBar}
          onPress={() => setIsPickingGov(true)}
          activeOpacity={0.8}
        >
          <View style={styles.selectedGovInfo}>
            <MapPin size={18} color={tokens.colors.gold} />
            <Text style={styles.selectedGovName}>محافظة {selectedGov.nameAr}</Text>
          </View>
          <View style={styles.changeGovBtn}>
            <Text style={styles.changeGovText}>تغيير المحافظة</Text>
            <ChevronDown size={16} color={tokens.colors.navy} />
          </View>
        </TouchableOpacity>
      ) : null}

      {(isPickingGov || (!selectedGovId && selectedLevel !== 'CASSATION')) && (
        <View style={styles.govPickerBox}>
          <View style={styles.searchContainer}>
            <Search size={16} color={tokens.colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث عن المحافظة..."
              placeholderTextColor={tokens.colors.muted}
              value={govSearchQuery}
              onChangeText={setGovSearchQuery}
            />
          </View>

          {isLoadingGovs ? (
            <ActivityIndicator color={tokens.colors.navy} style={{ marginVertical: tokens.spacing.lg }} />
          ) : (
            <View style={styles.govChipsGrid}>
              {filteredGovernorates.map(gov => {
                const isSelected = gov.id === selectedGovId;
                return (
                  <TouchableOpacity
                    key={gov.id}
                    style={[styles.govChip, isSelected && styles.govChipActive]}
                    onPress={() => handleSelectGovernorate(gov.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.govChipText, isSelected && styles.govChipTextActive]}>
                      {gov.nameAr}
                    </Text>
                    {isSelected && <Check size={14} color={tokens.colors.white} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* ─── Step 2: Court Level Filter & Court List for Selected Governorate ─── */}
      {canShowCourts && (
        <>
          <Text style={styles.sectionLabel}>الخطوة ٢: اختر درجة المحكمة والمحكمة المختصة</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            style={styles.levelScroll}
            contentContainerStyle={styles.levelRow}
          >
            {COURT_LEVELS.map(level => {
              const isActive = selectedLevel === level.value;
              return (
                <TouchableOpacity
                  key={level.value ?? 'ALL'}
                  style={[styles.levelChip, isActive && styles.levelChipActive]}
                  onPress={() => handleLevelPress(level.value)}
                >
                  <Text style={[styles.levelChipText, isActive && styles.levelChipTextActive]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.searchContainer}>
            <Search size={16} color={tokens.colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                selectedLevel === 'CASSATION'
                  ? 'ابحث في المحاكم العليا...'
                  : `ابحث في محاكم ${selectedGov?.nameAr || ''}...`
              }
              placeholderTextColor={tokens.colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {isLoadingCourts ? (
            <ActivityIndicator
              size="large"
              color={tokens.colors.signal}
              style={{ marginTop: tokens.spacing.xl }}
            />
          ) : filteredCourts.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد محاكم مطابقة في هذا النطاق</Text>
          ) : (
            <FlatList
              data={filteredCourts}
              keyExtractor={item => item.id}
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
              contentContainerStyle={{ paddingBottom: tokens.spacing.xl }}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <CourtRow
                  item={item as any}
                  isSelected={selectedCourt?.id === item.id}
                  isExpanded={expandedCourts.has(item.id)}
                  onSelect={handleCourtPress}
                  onToggleExpand={toggleExpand}
                />
              )}
            />
          )}
        </>
      )}

      {/* Validation error */}
      {errors.courtId && (
        <Text style={styles.errorText}>
          {errors.courtId.message as string}
        </Text>
      )}

      {/* Selected court summary */}
      {selectedCourt && (
        <View style={styles.selectedSummary}>
          <Landmark size={16} color={tokens.colors.signal} />
          <Text style={styles.selectedSummaryText}>{selectedCourt.nameAr}</Text>
        </View>
      )}
    </MotiView>
  );
};

const { colors, spacing, radius } = tokens;

const styles = StyleSheet.create({
  stepContent: {
    flex: 1,
    minHeight: 400,
    direction: 'rtl',
  },
  sectionLabel: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.sm,
    textAlign: 'right',
  },
  selectedGovBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  selectedGovInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  selectedGovName: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 15,
    color: colors.navy,
  },
  changeGovBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  changeGovText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 12,
    color: colors.navy,
  },
  govPickerBox: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  govChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  govChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  govChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  govChipText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 13,
    color: colors.ink,
  },
  govChipTextActive: {
    color: colors.white,
  },
  levelScroll: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  levelRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  levelChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  levelChipActive: {
    borderColor: colors.navy,
    backgroundColor: colors.navy,
  },
  levelChipText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 13,
    color: colors.muted,
  },
  levelChipTextActive: {
    color: colors.white,
  },
  emptyText: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 14,
    color: colors.ink,
    height: 42,
    textAlign: 'right',
  },
  errorText: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 13,
    color: colors.docket,
    marginTop: spacing.sm,
  },
  selectedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.signal + '10',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  selectedSummaryText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14,
    color: colors.signal,
  },
});
