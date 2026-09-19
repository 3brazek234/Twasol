import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLawyersAtCourt } from '../../hooks/useCourts';
import { tokens } from '../../theme/tokens';
import { Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface Props {
  courtId: string;
}

export const LawyerListForCourt = ({ courtId }: Props) => {
  const { data, isLoading } = useLawyersAtCourt(courtId, true);
  const navigation = useNavigation<any>();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={tokens.colors.signal} />
      </View>
    );
  }

  const lawyers = data?.data || data || [];

  if (lawyers.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>لا يوجد محامون متاحون حالياً</Text>
      </View>
    );
  }

  const formatNumber = (num: number | string) => {
    const parsed = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(parsed)) return num;
    return new Intl.NumberFormat('ar-EG').format(parsed);
  };

  return (
    <View style={styles.container}>
      {lawyers.map((lawyer: any, index: number) => {
        const initials = lawyer.fullName?.substring(0, 2) || 'م';
        const rating = lawyer.averageRating || 0;
        
        return (
          <TouchableOpacity 
            key={lawyer.id || index}
            style={styles.lawyerRow}
            onPress={() => navigation.navigate('LawyerProfile', { id: lawyer.id })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.lawyerInfo}>
              <Text style={styles.lawyerName}>{lawyer.fullName}</Text>
              <Text style={styles.lawyerBar}>رقم القيد: {formatNumber(lawyer.barNumber || '')}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>{formatNumber(rating.toFixed(1))}</Text>
              <Star size={12} color={tokens.colors.gold} fill={tokens.colors.gold} />
            </View>
          </TouchableOpacity>
        );
      })}

      
      {/* 
        Pagination could be added here later if needed, 
        e.g., using data.meta.total and data.meta.page.
        For now, limit=20 in backend is usually enough for a quick preview.
      */}
    </View>
  );
};

const { colors, spacing, radius, typography } = tokens;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.line,
    marginTop: -radius.md, // Tuck under the court row
    marginBottom: spacing.xs,
    paddingTop: spacing.md + radius.md, // Compensate for tuck
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  lawyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line + '50', // very light line
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navy + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm, // RTL layout
  },
  avatarText: {
    fontFamily: typography.fonts.displayBold,
    fontSize: 14,
    color: colors.navy,
  },
  lawyerInfo: {
    flex: 1,
  },
  lawyerName: {
    fontFamily: typography.fonts.bodySemibold,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'right',
  },
  lawyerBar: {
    fontFamily: typography.fonts.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ratingText: {
    fontFamily: typography.fonts.mono,
    fontSize: 11,
    color: colors.ink,
    marginRight: 4,
  },
});
