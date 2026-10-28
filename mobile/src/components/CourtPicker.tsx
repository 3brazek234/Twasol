import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { tokens } from '../theme/tokens';
import { Search, MapPin, X, ChevronLeft } from 'lucide-react-native';
import { useGovernorates, useAllCourts, useCourtSearch } from '../hooks/useCourts';
import { Court, CourtType, Governorate, CourtTypeLabelAr } from '../schemas/court.schema';

interface CourtPickerProps {
  onSelectCourt: (court: Court) => void;
  onClose: () => void;
  myCourtsIds: string[];
}

const DEGREE_FILTERS: { value: CourtType | null; label: string }[] = [
  { value: null,      label: 'الكل' },
  { value: 'PARTIAL', label: 'جزئي' },
  { value: 'PRIMARY', label: 'ابتدائي' },
  { value: 'APPEAL',  label: 'استئناف' },
];

export const CourtPicker = ({ onSelectCourt, onClose, myCourtsIds }: CourtPickerProps) => {
  // Step 1: Select a single Governorate (or Cassation)
  // Step 2: Browse & filter courts belonging ONLY to that selected Governorate
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGov, setSelectedGov] = useState<Governorate | null>(null);
  const [selectedType, setSelectedType] = useState<CourtType | null>(null);
  const [isCassationMode, setIsCassationMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Queries — courts are ONLY fetched once a single governorate is selected (or in Cassation mode)
  const { data: governorates = [], isLoading: isLoadingGovs } = useGovernorates();
  const { data: courts = [], isLoading: isLoadingCourts } = useAllCourts({
    governorateId: isCassationMode ? undefined : selectedGov?.id,
    type: isCassationMode ? 'CASSATION' : (selectedType || undefined),
  });
  const { data: searchResults, isLoading: isSearching } = useCourtSearch(
    step === 1 ? searchQuery : ''
  );

  // Filter governorates on Step 1 when typing single-char or matching governorate names
  const filteredGovernorates = useMemo(() => {
    if (!searchQuery.trim()) return governorates;
    const q = searchQuery.trim().toLowerCase();
    return governorates.filter(
      g => g.nameAr.toLowerCase().includes(q) || g.nameEn.toLowerCase().includes(q)
    );
  }, [governorates, searchQuery]);

  // Filter courts inside Step 2
  const availableCourts = useMemo(() => {
    const base = courts.filter(c => !myCourtsIds.includes(c.id));
    if (!searchQuery.trim()) return base;
    const q = searchQuery.trim().toLowerCase();
    return base.filter(c => c.nameAr.toLowerCase().includes(q));
  }, [courts, myCourtsIds, searchQuery]);

  const availableSearchResults = useMemo(
    () => (searchResults || []).filter(c => !myCourtsIds.includes(c.id)),
    [searchResults, myCourtsIds]
  );

  const handleSelectGov = (gov: Governorate) => {
    setSelectedGov(gov);
    setIsCassationMode(false);
    setSelectedType(null);
    setSearchQuery('');
    setStep(2);
  };

  const handleSelectCassation = () => {
    setSelectedGov(null);
    setIsCassationMode(true);
    setSelectedType('CASSATION');
    setSearchQuery('');
    setStep(2);
  };

  const handleBackToGovernorates = () => {
    setStep(1);
    setSelectedGov(null);
    setSelectedType(null);
    setIsCassationMode(false);
    setSearchQuery('');
  };

  const renderCourtItem = ({ item }: { item: Court }) => (
    <TouchableOpacity
      style={styles.courtItem}
      activeOpacity={0.7}
      onPress={() => onSelectCourt(item)}
    >
      <View style={styles.courtItemHeader}>
        <Text style={styles.courtName}>{item.nameAr}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{CourtTypeLabelAr[item.type]}</Text>
        </View>
      </View>
      {item.governorate && (
        <View style={styles.locationRow}>
          <MapPin size={12} color={tokens.colors.muted} />
          <Text style={styles.courtLocation}>{item.governorate.nameAr}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={24} color={tokens.colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>إضافة محكمة</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={tokens.colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            step === 1
              ? 'ابحث عن المحافظة أو اسم المحكمة...'
              : `ابحث في محاكم ${selectedGov?.nameAr || 'النقض'}...`
          }
          placeholderTextColor={tokens.colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color={tokens.colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {step === 1 && searchQuery.trim().length >= 2 && filteredGovernorates.length === 0 ? (
        // Direct Court Search Results when query doesn't match a governorate name
        <View style={styles.content}>
          <Text style={styles.stepTitle}>نتائج البحث</Text>
          {isSearching ? (
            <ActivityIndicator style={styles.loader} color={tokens.colors.navy} />
          ) : (
            <FlatList
              data={availableSearchResults}
              keyExtractor={(i) => i.id}
              renderItem={renderCourtItem}
              ListEmptyComponent={<Text style={styles.emptyText}>لا توجد نتائج</Text>}
            />
          )}
        </View>
      ) : (
        <View style={styles.content}>
          {step === 1 && (
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>اختر المحافظة</Text>

              {isLoadingGovs ? (
                <ActivityIndicator style={styles.loader} color={tokens.colors.navy} />
              ) : (
                <FlatList
                  data={filteredGovernorates}
                  keyExtractor={(g) => g.id}
                  showsVerticalScrollIndicator={false}
                  ListHeaderComponent={
                    !searchQuery.trim() ? (
                      <TouchableOpacity
                        style={[styles.optionRow, styles.cassationOptionRow]}
                        onPress={handleSelectCassation}
                      >
                        <Text style={styles.cassationOptionText}>
                          المحاكم العليا (محكمة النقض / الإدارية العليا)
                        </Text>
                        <ChevronLeft size={20} color={tokens.colors.gold} />
                      </TouchableOpacity>
                    ) : null
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.optionRow}
                      onPress={() => handleSelectGov(item)}
                    >
                      <Text style={styles.optionText}>{item.nameAr}</Text>
                      <ChevronLeft size={20} color={tokens.colors.muted} />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}

          {step === 2 && (
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={styles.backLink}
                onPress={handleBackToGovernorates}
              >
                <Text style={styles.backText}>→ تغيير المحافظة</Text>
              </TouchableOpacity>

              <Text style={styles.stepTitle}>
                {isCassationMode
                  ? 'المحاكم العليا'
                  : `محاكم محافظة ${selectedGov?.nameAr || ''}`}
              </Text>

              {!isCassationMode && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentInsetAdjustmentBehavior="never"
                  automaticallyAdjustContentInsets={false}
                  style={styles.degreeScroll}
                  contentContainerStyle={styles.degreeChipsRow}
                >
                  {DEGREE_FILTERS.map((deg) => {
                    const isActive = selectedType === deg.value;
                    return (
                      <TouchableOpacity
                        key={deg.value ?? 'ALL'}
                        style={[styles.degreeChip, isActive && styles.degreeChipActive]}
                        onPress={() => setSelectedType(deg.value)}
                      >
                        <Text style={[styles.degreeChipText, isActive && styles.degreeChipTextActive]}>
                          {deg.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {isLoadingCourts ? (
                <ActivityIndicator style={styles.loader} color={tokens.colors.navy} />
              ) : (
                <FlatList
                  data={availableCourts}
                  keyExtractor={(c) => c.id}
                  renderItem={renderCourtItem}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      {!courts || courts.length === 0
                        ? 'لا توجد محاكم مسجلة في هذا النطاق حالياً'
                        : 'جميع محاكم هذا النطاق مضافة مسبقاً'}
                    </Text>
                  }
                />
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
    direction: 'rtl',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
  },
  closeBtn: {
    padding: tokens.spacing.xs,
  },
  title: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: tokens.typography.sizes.lg,
    color: tokens.colors.navy,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    margin: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    height: 48,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  searchInput: {
    flex: 1,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.ink,
    marginHorizontal: tokens.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: tokens.spacing.md,
  },
  stepTitle: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: tokens.typography.sizes.lg,
    color: tokens.colors.navy,
    marginBottom: tokens.spacing.sm,
    textAlign: 'right',
  },
  backLink: {
    marginBottom: tokens.spacing.xs,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.gold,
    fontSize: tokens.typography.sizes.sm,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
  },
  cassationOptionRow: {
    backgroundColor: tokens.colors.white,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.gold,
    marginBottom: tokens.spacing.xs,
  },
  cassationOptionText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.navy,
  },
  optionText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.ink,
  },
  degreeScroll: {
    flexGrow: 0,
    marginBottom: tokens.spacing.md,
  },
  degreeChipsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
  },
  degreeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    backgroundColor: tokens.colors.white,
  },
  degreeChipActive: {
    backgroundColor: tokens.colors.navy,
    borderColor: tokens.colors.navy,
  },
  degreeChipText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.muted,
  },
  degreeChipTextActive: {
    color: tokens.colors.white,
  },
  loader: {
    marginTop: tokens.spacing.xl,
  },
  emptyText: {
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    textAlign: 'center',
    marginTop: tokens.spacing.xl,
  },
  courtItem: {
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  courtItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.xs,
  },
  courtName: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.navy,
    flex: 1,
    textAlign: 'right',
  },
  badge: {
    backgroundColor: tokens.colors.navy,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.radius.pill,
    marginStart: tokens.spacing.sm,
  },
  badgeText: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.paper,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courtLocation: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.muted,
  },
});
