import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, Clock3, CreditCard } from 'lucide-react-native';
import { tokens } from '../theme/tokens';

interface SubscriptionAccessCardProps {
  isLoading: boolean;
  isError: boolean;
  hasPendingPayment: boolean;
  onPress: () => void;
  onRetry: () => void;
}

export const SubscriptionAccessCard = ({
  isLoading,
  isError,
  hasPendingPayment,
  onPress,
  onRetry,
}: SubscriptionAccessCardProps) => {
  const content = isLoading
    ? {
        title: 'جارٍ التحقق من الاشتراك',
        body: 'انتظر لحظة قبل نشر مهمة جديدة.',
        action: null,
        icon: <ActivityIndicator size="small" color={tokens.colors.navy} />,
      }
    : isError
      ? {
          title: 'تعذّر التحقق من الاشتراك',
          body: 'أعد المحاولة للتحقق من إمكانية نشر المهام.',
          action: 'إعادة المحاولة',
          icon: <AlertCircle size={20} color={tokens.colors.docket} />,
        }
      : hasPendingPayment
        ? {
            title: 'طلب الاشتراك قيد المراجعة',
            body: 'سيتم تفعيل إمكانية نشر المهام بعد مراجعة الإيصال.',
            action: 'عرض حالة الاشتراك',
            icon: <Clock3 size={20} color={tokens.colors.docket} />,
          }
        : {
            title: 'فعّل اشتراكك لنشر المهام',
            body: 'اختر باقة اشتراك وأرسل إيصال الدفع لبدء نشر المهام.',
            action: 'تفعيل الاشتراك',
            icon: <CreditCard size={20} color={tokens.colors.navy} />,
          };

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>{content.icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.body}>{content.body}</Text>
      </View>
      {content.action && (
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.action}
          onPress={isError ? onRetry : onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.actionText}>{content.action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = {
  card: {
    flexDirection: 'row' as const,
    direction: 'rtl' as const,
    alignItems: 'center' as const,
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
  },
  iconContainer: {
    width: tokens.spacing.xl,
    height: tokens.spacing.xl,
    borderRadius: tokens.radius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: tokens.colors.docket + '15',
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-end' as const,
  },
  title: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
    textAlign: 'right' as const,
  },
  body: {
    marginTop: tokens.spacing.xxs,
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
    lineHeight: tokens.typeScale.body.lineHeight,
    textAlign: 'right' as const,
  },
  action: {
    alignSelf: 'center' as const,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    backgroundColor: tokens.colors.navy,
    borderRadius: tokens.radius.md,
  },
  actionText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.xs,
    textAlign: 'center' as const,
  },
};
