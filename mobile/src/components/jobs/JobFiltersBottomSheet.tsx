import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { tokens } from '../../theme/tokens';
import { X, Check } from 'lucide-react-native';

export type JobTaskType = 
  | 'ATTEND_SESSION'
  | 'OBTAIN_DOCUMENT'
  | 'FILE_PLEADING'
  | 'REGISTER_PROPERTY'
  | 'REVIEW_DOCKET'
  | 'OTHER';

const TASK_TYPES: { label: string; value: JobTaskType }[] = [
  { label: 'حضور جلسة', value: 'ATTEND_SESSION' },
  { label: 'استخراج مستند', value: 'OBTAIN_DOCUMENT' },
  { label: 'تقديم مذكرة / دفاع', value: 'FILE_PLEADING' },
  { label: 'تسجيل عقاري', value: 'REGISTER_PROPERTY' },
  { label: 'مراجعة دوسيه', value: 'REVIEW_DOCKET' },
  { label: 'أخرى', value: 'OTHER' },
];

interface JobFiltersBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  currentTaskType?: string;
  onApply: (taskType?: string) => void;
}

export const JobFiltersBottomSheet: React.FC<JobFiltersBottomSheetProps> = ({
  isVisible,
  onClose,
  currentTaskType,
  onApply,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  // Local state for the filter before applying
  const [localTaskType, setLocalTaskType] = useState<string | undefined>(currentTaskType);

  // Sync local state when opened
  useEffect(() => {
    if (isVisible) {
      setLocalTaskType(currentTaskType);
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible, currentTaskType]);

  const snapPoints = useMemo(() => ['50%', '60%'], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    []
  );

  const handleApply = () => {
    onApply(localTaskType);
    onClose();
  };

  const handleClear = () => {
    setLocalTaskType(undefined);
    onApply(undefined);
    onClose();
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color={tokens.colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تصفية الطلبات</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Task Type Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>نوع المهمة</Text>
          <View style={styles.optionsGrid}>
            {TASK_TYPES.map((type) => {
              const isSelected = localTaskType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                  onPress={() => setLocalTaskType(isSelected ? undefined : type.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {type.label}
                  </Text>
                  {isSelected && <Check size={16} color={tokens.colors.signal} style={styles.optionIcon} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={handleClear}
          >
            <Text style={styles.clearButtonText}>مسح</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.applyButton} 
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>تطبيق الفرز</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const { colors, spacing, typography, radius } = tokens;

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: colors.line,
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: typography.fonts.displayBold,
    fontSize: 18,
    color: colors.ink,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fonts.bodySemibold,
    fontSize: 16,
    color: colors.ink,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  optionChipSelected: {
    borderColor: colors.signal,
    backgroundColor: colors.signal + '15',
  },
  optionText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: 14,
    color: colors.muted,
  },
  optionTextSelected: {
    color: colors.signal,
    fontFamily: typography.fonts.bodySemibold,
  },
  optionIcon: {
    marginLeft: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  clearButtonText: {
    fontFamily: typography.fonts.bodySemibold,
    fontSize: 16,
    color: colors.muted,
  },
  applyButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.signal,
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: typography.fonts.bodySemibold,
    fontSize: 16,
    color: colors.white,
  },
});
