import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { MotiView } from 'moti';
import { tokens } from '../../../theme/tokens';
import { Landmark, Check } from 'lucide-react-native';
import { useAllCourts } from '../../../hooks/useCourts';
import { SelectedCourt } from './usePostJob';
import { CourtRow } from '../../../components/courts/CourtRow';

type CourtType = 'PARTIAL' | 'PRIMARY' | 'APPEAL' | 'CASSATION';

const COURT_LEVELS: { value: CourtType; label: string; description: string }[] = [
  { value: 'CASSATION', label: 'نقض',     description: 'المحكمة العليا — مستوى وطني' },
  { value: 'APPEAL',    label: 'استئناف', description: 'محاكم الدرجة الثانية' },
  { value: 'PRIMARY',   label: 'ابتدائي', description: 'محاكم الدرجة الأولى' },
  { value: 'PARTIAL',   label: 'جزئي',   description: 'محاكم جزئية' },
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
  const [selectedLevel, setSelectedLevel] = useState<CourtType | null>(
    selectedCourt?.type ?? null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCourts, setExpandedCourts] = useState<Set<string>>(new Set());

  const { data: courts = [], isFetching: isLoading } = useAllCourts({
    type: selectedLevel || undefined,
  });

  const handleLevelSelect = (level: CourtType) => {
    setSelectedLevel(level);
    setSearchQuery('');
    setExpandedCourts(new Set()); // Reset expanded on tab switch
    
    // If cassation, auto-select it if we already fetched it
    if (level === 'CASSATION') {
      const cassationCourt = courts.find(c => c.type === 'CASSATION');
      if (cassationCourt) {
        onCourtSelected(cassationCourt);
      }
    }
  };

  const toggleExpand = useCallback((id: string) => {
    setExpandedCourts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Filter courts by search query
  const filteredCourts = courts.filter(court => 
    court.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (court.governorate?.nameAr || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-select when Cassation chosen (only 1 court exists)
  useEffect(() => {
    if (selectedLevel === 'CASSATION' && courts.length === 1 && !selectedCourt) {
      onCourtSelected({
        id: courts[0].id,
        nameAr: courts[0].nameAr,
        type: 'CASSATION',
        cityAr: courts[0].governorate?.nameAr,
      });
    }
  }, [selectedLevel, courts]);

  const handleLevelPress = (level: CourtType) => {
    if (selectedLevel === level) return;
    setSelectedLevel(level);
    setSearchQuery('');
  };

  const handleCourtPress = (court: any) => {
    onCourtSelected({
      id: court.id,
      nameAr: court.nameAr,
      type: court.type,
      cityAr: court.governorate?.nameAr,
    });
  };

  return (
    <MotiView
      from={{ opacity: 0, translateX: 50 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -50 }}
      style={styles.stepContent}
    >
      {/* ─── Step 1: Court Level ─── */}
      <Text style={styles.sectionLabel}>الخطوة ١: اختر درجة المحكمة</Text>
      <View style={styles.levelRow}>
        {COURT_LEVELS.map(level => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.levelChip,
              selectedLevel === level.value && styles.levelChipActive,
            ]}
            onPress={() => handleLevelPress(level.value)}
          >
            <Text style={[
              styles.levelChipText,
              selectedLevel === level.value && styles.levelChipTextActive,
            ]}>
              {level.label}
            </Text>
            <Text style={[
              styles.levelChipDesc,
              selectedLevel === level.value && styles.levelChipDescActive,
            ]}>
              {level.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Step 2: Specific Court ─── */}
      {selectedLevel !== null && (
        <>
          <Text style={styles.sectionLabel}>الخطوة ٢: اختر المحكمة المختصة</Text>

          {/* Search Bar for long lists (Partial/Primary/Appeal) */}
          {selectedLevel !== 'CASSATION' && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="ابحث عن اسم المحكمة أو المحافظة..."
                placeholderTextColor={tokens.colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          )}

          {/* Cassation: auto-selected banner */}
          {selectedLevel === 'CASSATION' && courts.length === 1 && (
            <View style={styles.autoSelectedBanner}>
              <View style={styles.autoSelectedIconWrapper}>
                <Check size={20} color={tokens.colors.signal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.autoSelectedName}>{courts[0].nameAr}</Text>
                <Text style={styles.autoSelectedNote}>
                  محكمة النقض هي المحكمة الوحيدة على مستوى الجمهورية
                </Text>
              </View>
            </View>
          )}

          {/* Appeal / Primary / Partial: scrollable list */}
          {selectedLevel !== 'CASSATION' && (
            <>
              {isLoading ? (
                <ActivityIndicator
                  size="large"
                  color={tokens.colors.signal}
                  style={{ marginTop: tokens.spacing.xl }}
                />
              ) : filteredCourts.length === 0 ? (
                <Text style={styles.emptyText}>لا توجد محاكم مطابقة للبحث</Text>
              ) : (
                <FlatList
                  data={filteredCourts}
                  keyExtractor={item => item.id}
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
  },
  sectionLabel: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  levelRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  levelChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    backgroundColor: colors.paper,
  },
  levelChipActive: {
    borderColor: colors.signal,
    backgroundColor: colors.signal + '12',
  },
  levelChipText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  levelChipTextActive: {
    color: colors.signal,
  },
  levelChipDesc: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  levelChipDescActive: {
    color: colors.signal,
  },
  autoSelectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.signal + '12',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.signal + '40',
    marginBottom: spacing.lg,
  },
  autoSelectedIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.signal + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoSelectedName: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 16,
    color: colors.ink,
  },
  autoSelectedNote: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  courtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    marginBottom: spacing.xs,
  },
  courtRowSelected: {
    borderColor: colors.signal,
    backgroundColor: colors.signal + '08',
  },
  courtRowRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courtRowRadioSelected: {
    borderColor: colors.signal,
  },
  courtRowRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.signal,
  },
  courtRowText: {
    flex: 1,
  },
  courtName: {
    fontFamily: tokens.typography.fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
  },
  courtNameSelected: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: colors.signal,
  },
  courtCity: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  searchContainer: {
    marginBottom: spacing.md,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 14,
    color: colors.ink,
    height: 44,
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
