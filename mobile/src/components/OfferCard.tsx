import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Check, DollarSign, X } from 'lucide-react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Message } from '../schemas/message.schema';
import { tokens } from '../theme/tokens';
import { formatCurrency } from '../utils/dateUtils';

interface OfferCardProps {
  item: Message;
  isMe: boolean;
  otherPartyName: string;
  timeLabel: string;
  onResponse?: (msgId: string, action: 'accept' | 'reject') => void;
}

export const OfferCard = ({ item, isMe, otherPartyName, timeLabel, onResponse }: OfferCardProps) => {
  const reducedMotion = useReducedMotion();
  const offerId = item.id;
  const isPending = item.type === 'OFFER'
    ? item.offerStatus !== 'ACCEPTED' && item.offerStatus !== 'REJECTED' && item.offerStatus !== 'WITHDRAWN'
    : item.type === 'offer';
  const isAccepted = item.type === 'offer_accepted' || item.offerStatus === 'ACCEPTED';
  const isRejected = item.type === 'offer_rejected' || item.offerStatus === 'REJECTED';
  const isWithdrawn = item.type === 'offer_withdrawn' || item.offerStatus === 'WITHDRAWN';
  const status = isAccepted
    ? { label: 'تم القبول', background: tokens.colors.verdantBg, color: tokens.colors.verdant }
    : isRejected
      ? { label: 'تم الرفض', background: tokens.colors.line, color: tokens.colors.muted }
      : isWithdrawn
        ? { label: 'مسحوب', background: tokens.colors.line, color: tokens.colors.muted }
        : { label: 'قيد الانتظار', background: tokens.colors.amberBg, color: tokens.colors.docket };

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.labelRow}>
            <DollarSign size={14} color={tokens.colors.gold} />
            <Text style={styles.label}>عرض مالي</Text>
          </View>
          <Text style={styles.time}>{timeLabel}</Text>
        </View>

        <Text style={styles.amount}>{formatCurrency(Number(item.offerAmount ?? 0))}</Text>
        <Text style={styles.sender}>من: {isMe ? 'أنت' : otherPartyName}</Text>

        {isAccepted && (
          <MotiView
            from={reducedMotion ? { opacity: 1, scale: 1, rotate: '0deg' } : { opacity: 0, scale: 0.45, rotate: '-18deg' }}
            animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
            transition={reducedMotion ? { type: 'timing', duration: 0 } : { type: 'spring', damping: 11, stiffness: 180 }}
            style={styles.seal}
          >
            <Text style={styles.sealText}>تم الاتفاق</Text>
          </MotiView>
        )}

        {isPending && !isMe && offerId ? (
          <View style={styles.actions}>
            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.action, styles.accept]}
              onPress={() => onResponse?.(offerId, 'accept')}
            >
              <Check size={16} color={tokens.colors.white} />
              <Text style={styles.actionText}>قبول العرض</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.action, styles.reject]}
              onPress={() => onResponse?.(offerId, 'reject')}
            >
              <X size={16} color={tokens.colors.white} />
              <Text style={styles.actionText}>رفض</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.status, { backgroundColor: status.background }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: tokens.spacing.md,
    alignSelf: 'center',
    width: '94%',
  },
  card: {
    position: 'relative',
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing.md,
    borderRadius: tokens.offerCard.cardRadius,
    borderWidth: 1,
    borderColor: tokens.colors.goldLight,
    borderTopWidth: tokens.offerCard.borderWidth,
    borderTopColor: tokens.offerCard.borderAccent,
    ...tokens.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  label: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.gold,
  },
  time: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.muted,
  },
  amount: {
    fontFamily: tokens.typography.fonts.mono,
    fontSize: tokens.typography.sizes.xxxl,
    color: tokens.offerCard.amountColor,
    marginVertical: tokens.spacing.sm,
    textAlign: 'center',
  },
  sender: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.muted,
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  seal: {
    position: 'absolute',
    top: 42,
    end: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.pill,
    borderWidth: 2,
    borderColor: tokens.colors.verdant,
    backgroundColor: tokens.colors.verdantBg,
  },
  sealText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.verdant,
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
  },
  action: {
    flex: 1,
    minHeight: tokens.spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    borderRadius: tokens.radius.sm,
  },
  accept: {
    backgroundColor: tokens.colors.signal,
  },
  reject: {
    backgroundColor: tokens.colors.crimson,
  },
  actionText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
  },
  status: {
    alignSelf: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xxs,
    borderRadius: tokens.radius.pill,
    marginTop: tokens.spacing.xs,
  },
  statusText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.xs,
  },
});
