import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Landmark, ChevronUp, ChevronDown } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { Court } from '../../schemas/court.schema';
import { LawyerListForCourt } from './LawyerListForCourt';

interface CourtRowProps {
  item: Court;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (court: Court) => void;
  onToggleExpand: (courtId: string) => void;
}

export const CourtRow = memo(({ item, isSelected, isExpanded, onSelect, onToggleExpand }: CourtRowProps) => {
  const lawyerCount = item.lawyerCount || 0;
  const hasLawyers = lawyerCount > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.courtRow, isSelected && styles.courtRowSelected]}>
        
        {/* Main interactive area for selection */}
        <TouchableOpacity
          style={styles.courtMain}
          onPress={() => onSelect(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.courtRowRadio, isSelected && styles.courtRowRadioSelected]}>
            {isSelected && <View style={styles.courtRowRadioDot} />}
          </View>
          
          <View style={styles.courtRowText}>
            <Text style={[styles.courtName, isSelected && styles.courtNameSelected]}>
              {item.nameAr}
            </Text>
            {item.governorate?.nameAr && (
              <Text style={styles.courtCity}>{item.governorate.nameAr}</Text>
            )}
          </View>
          
          {isSelected && <Landmark size={18} color={tokens.colors.signal} style={{ marginLeft: tokens.spacing.sm }} />}
        </TouchableOpacity>

        {/* Info / Expand area */}
        <TouchableOpacity
          style={styles.lawyerCountRow}
          onPress={() => onToggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.lawyerCountText, !hasLawyers && styles.lawyerCountEmpty]}>
            👥 {hasLawyers ? `${new Intl.NumberFormat('ar-EG').format(lawyerCount)} محامٍ مسجل` : 'لا يوجد محامون مسجلون بعد'}
          </Text>
          {hasLawyers && (
            isExpanded 
              ? <ChevronUp size={16} color={tokens.colors.muted} /> 
              : <ChevronDown size={16} color={tokens.colors.muted} />
          )}
        </TouchableOpacity>
      </View>

      {/* Expanded list */}
      {isExpanded && hasLawyers && (
        <LawyerListForCourt courtId={item.id} />
      )}
    </View>
  );
});

const { colors, spacing, radius } = tokens;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xs,
  },
  courtRow: {
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  courtRowSelected: {
    borderColor: colors.signal,
    backgroundColor: colors.signal + '08',
  },
  courtMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  courtRowRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
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
    alignItems: 'flex-start',
  },
  courtName: {
    fontFamily: tokens.typography.fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'left',
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
    textAlign: 'left',
  },
  lawyerCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line + '50',
  },
  lawyerCountText: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 12,
    color: colors.muted,
  },
  lawyerCountEmpty: {
    color: colors.gold,
  },
});
