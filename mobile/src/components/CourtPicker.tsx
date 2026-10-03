import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { tokens } from '../theme/tokens';
import { Search, MapPin, X, ChevronRight, Check } from 'lucide-react-native';
import { useGovernorates, useAllCourts, useCourtSearch } from '../hooks/useCourts';
import { Court, CourtType, Governorate, CourtTypeLabelAr } from '../schemas/court.schema';

interface CourtPickerProps {
  onSelectCourt: (court: Court) => void;
  onClose: () => void;
  myCourtsIds: string[];
}

export const CourtPicker = ({ onSelectCourt, onClose, myCourtsIds }: CourtPickerProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<CourtType | null>(null);
  const [selectedGov, setSelectedGov] = useState<Governorate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const { data: governorates, isLoading: isLoadingGovs } = useGovernorates();
  const { data: courts, isLoading: isLoadingCourts } = useAllCourts({
    type: selectedType || undefined,
    governorateId: selectedGov?.id,
  });
  const { data: searchResults, isLoading: isSearching } = useCourtSearch(searchQuery);

  // Derivations
  const availableCourts = courts?.filter((c) => !myCourtsIds.includes(c.id)) || [];
  const availableSearchResults = searchResults?.filter((c) => !myCourtsIds.includes(c.id)) || [];

  const handleSelectType = (type: CourtType) => {
    setSelectedType(type);
    if (type === 'CASSATION') {
      // Cassation skips governorate step
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleSelectGov = (gov: Governorate) => {
    setSelectedGov(gov);
    setStep(3);
  };

  const resetFilters = () => {
    setStep(1);
    setSelectedType(null);
    setSelectedGov(null);
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
          placeholder="ابحث عن محكمة..."
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

      {searchQuery.trim().length >= 2 ? (
        // Search Results View
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
        // Browsing Flow
        <View style={styles.content}>
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>اختر الدرجة القضائية</Text>
              {(['PARTIAL', 'PRIMARY', 'APPEAL', 'CASSATION'] as CourtType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.optionRow}
                  onPress={() => handleSelectType(type)}
                >
                  <Text style={styles.optionText}>{CourtTypeLabelAr[type]}</Text>
                  <ChevronRight size={20} color={tokens.colors.muted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {step === 2 && (
            <View style={{ flex: 1 }}>
              <TouchableOpacity style={styles.backLink} onPress={() => setStep(1)}>
                <Text style={styles.backText}>→ رجوع للدرجات</Text>
              </TouchableOpacity>
              <Text style={styles.stepTitle}>اختر المحافظة</Text>
              {isLoadingGovs ? (
                <ActivityIndicator style={styles.loader} color={tokens.colors.navy} />
              ) : (
                <FlatList
                  data={governorates}
                  keyExtractor={(g) => g.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.optionRow}
                      onPress={() => handleSelectGov(item)}
                    >
                      <Text style={styles.optionText}>{item.nameAr}</Text>
                      <ChevronRight size={20} color={tokens.colors.muted} />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}

          {step === 3 && (
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={styles.backLink}
                onPress={() => (selectedType === 'CASSATION' ? setStep(1) : setStep(2))}
              >
                <Text style={styles.backText}>→ رجوع للمحافظات</Text>
              </TouchableOpacity>
              <Text style={styles.stepTitle}>
                {selectedType === 'CASSATION'
                  ? 'محكمة النقض'
                  : `محاكم ${selectedGov?.nameAr || ''} (${CourtTypeLabelAr[selectedType!]})`}
              </Text>
              {isLoadingCourts ? (
                <ActivityIndicator style={styles.loader} color={tokens.colors.navy} />
              ) : (
                <FlatList
                  data={availableCourts}
                  keyExtractor={(c) => c.id}
                  renderItem={renderCourtItem}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      {!courts || courts.length === 0
                        ? 'لا توجد محاكم مسجلة في هذا النطاق حالياً'
                        : 'جميع محاكم هذه الدرجة مضافة مسبقاً'}
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
    marginBottom: tokens.spacing.md,
  },
  backLink: {
    marginBottom: tokens.spacing.sm,
    alignSelf: 'flex-end',
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
  optionText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.ink,
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  courtLocation: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.muted,
    marginEnd: 4,
  },
});
