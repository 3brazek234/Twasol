import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, CheckCircle2, Clock3, CreditCard, FileCheck2, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../stores/authStore';
import {
  useSubscriptionPlans,
  useGetReceiptUploadUrl,
  useSubmitSubscription,
  useSubscriptionStatus,
} from '../../hooks/useSubscription';
import { uploadFileToR2 } from '../../utils/upload';
import { tokens } from '../../theme/tokens';

type SubscriptionPlan = {
  id: string;
  nameAr: string;
  durationMonths: number;
  amountPiasters: number;
  badge?: string | null;
};

type PaymentInstructions = {
  MANUAL_VODAFONE_CASH?: { phoneNumber?: string; accountName?: string };
  MANUAL_BANK_TRANSFER?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    iban?: string;
  };
};

const formatDuration = (months: number) => {
  if (months === 1) return 'شهر واحد';
  if (months === 12) return 'سنة واحدة';
  return `${months} شهراً`;
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
};

const ActiveSubscriptionView = ({ expiresAt }: { expiresAt?: string | Date | null }) => {
  const expires = formatDate(expiresAt);

  return (
    <SafeAreaView style={styles.stateContainer}>
      <View style={[styles.stateIcon, styles.activeIcon]}>
        <CheckCircle2 size={34} color={tokens.colors.signal} />
      </View>
      <Text style={styles.stateTitle}>اشتراكك فعال</Text>
      <Text style={styles.stateBody}>
        يمكنك الآن استعراض فرص العمل المحلية والتواصل مع شبكة المحامين الموثقين.
      </Text>
      {expires ? (
        <View style={styles.expiryCard}>
          <Text style={styles.expiryLabel}>تاريخ انتهاء الاشتراك</Text>
          <Text style={styles.expiryDate}>{expires}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const PendingSubscriptionView = () => (
  <SafeAreaView style={styles.stateContainer}>
    <View style={[styles.stateIcon, styles.pendingIcon]}>
      <Clock3 size={34} color={tokens.colors.docket} />
    </View>
    <Text style={styles.stateTitle}>طلبك قيد المراجعة</Text>
    <Text style={styles.stateBody}>
      إيصالك قيد المراجعة. يتحقق فريقنا من تحويل فودافون كاش، وعادةً ما تستغرق المراجعة حتى 24 ساعة.
      سنرسل إليك إشعاراً فور تفعيل حسابك.
    </Text>
    <View style={styles.pendingCard}>
      <FileCheck2 size={20} color={tokens.colors.docket} />
      <Text style={styles.pendingCardText}>تم استلام الإيصال، ولا يلزمك إرسال طلب آخر.</Text>
    </View>
  </SafeAreaView>
);

interface PaywallViewProps {
  plans: SubscriptionPlan[];
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  paymentMethod: 'MANUAL_BANK_TRANSFER' | 'MANUAL_VODAFONE_CASH';
  onSelectPaymentMethod: (method: 'MANUAL_BANK_TRANSFER' | 'MANUAL_VODAFONE_CASH') => void;
  instructions: PaymentInstructions | null;
  file: ImagePicker.ImagePickerAsset | null;
  onPickReceipt: () => void;
  isUploading: boolean;
  uploadProgress: number;
  canSubmit: boolean;
  onSubmit: () => void;
}

const PaywallView = ({
  plans,
  selectedPlanId,
  onSelectPlan,
  paymentMethod,
  onSelectPaymentMethod,
  instructions,
  file,
  onPickReceipt,
  isUploading,
  uploadProgress,
  canSubmit,
  onSubmit,
}: PaywallViewProps) => {
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.pitchHeader}>
          <View style={styles.pitchIcon}>
            <CreditCard size={28} color={tokens.colors.navy} />
          </View>
          <Text style={styles.pitchTitle}>افتح فرصاً أكثر مع وكيل</Text>
          <Text style={styles.pitchDescription}>
            اشتراكك يمنحك وصولاً كاملاً إلى فرص العمل في محاكمك، وإمكانية التقديم على المهام، والتواصل ضمن شبكة المحامين الموثقين.
          </Text>
        </View>

        <View style={styles.benefitList}>
          {[
            'تصفّح المهام المحلية حسب المحاكم المسجلة',
            'قدّم على المهام وتفاوض مباشرةً داخل التطبيق',
            'تواصل مع شبكة محامين موثقة',
          ].map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Check size={16} color={tokens.colors.signal} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>اختر مدة الاشتراك</Text>
        <View style={styles.planList}>
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[styles.planOption, isSelected && styles.selectedPlanOption]}
                onPress={() => onSelectPlan(plan.id)}
                disabled={isUploading}
              >
                <View style={styles.planOptionHeader}>
                  <Text style={styles.planName}>{plan.nameAr}</Text>
                  {plan.badge ? <Text style={styles.planBadge}>{plan.badge}</Text> : null}
                </View>
                <Text style={styles.planDuration}>{formatDuration(plan.durationMonths)}</Text>
                <Text style={styles.planPrice}>
                  {(plan.amountPiasters / 100).toLocaleString('ar-EG')} ج.م
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>طريقة الدفع</Text>
        <View style={styles.methodRow}>
          <PaymentMethodOption
            label="فودافون كاش"
            selected={paymentMethod === 'MANUAL_VODAFONE_CASH'}
            disabled={isUploading}
            onPress={() => onSelectPaymentMethod('MANUAL_VODAFONE_CASH')}
          />
          <PaymentMethodOption
            label="تحويل بنكي"
            selected={paymentMethod === 'MANUAL_BANK_TRANSFER'}
            disabled={isUploading}
            onPress={() => onSelectPaymentMethod('MANUAL_BANK_TRANSFER')}
          />
        </View>

        <View style={styles.paymentCard}>
          {paymentMethod === 'MANUAL_VODAFONE_CASH' ? (
            <>
              <Text style={styles.paymentCardTitle}>حوّل قيمة الباقة إلى رقم فودافون كاش</Text>
              <Text selectable style={styles.paymentNumber}>
                {instructions?.MANUAL_VODAFONE_CASH?.phoneNumber || 'رقم الدفع غير متاح حالياً'}
              </Text>
              <Text style={styles.paymentAccountName}>
                باسم {instructions?.MANUAL_VODAFONE_CASH?.accountName || 'وكيل'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.paymentCardTitle}>
                التحويل البنكي · {instructions?.MANUAL_BANK_TRANSFER?.bankName}
              </Text>
              <Text selectable style={styles.bankDetail}>
                رقم الحساب: {instructions?.MANUAL_BANK_TRANSFER?.accountNumber || 'غير متاح'}
              </Text>
              <Text selectable style={styles.bankDetail}>
                IBAN: {instructions?.MANUAL_BANK_TRANSFER?.iban || 'غير متاح'}
              </Text>
              <Text style={styles.paymentAccountName}>
                باسم {instructions?.MANUAL_BANK_TRANSFER?.accountName || 'وكيل'}
              </Text>
            </>
          )}
          <Text style={styles.paymentHint}>بعد التحويل، أرفق صورة الإيصال لإرسالها للمراجعة.</Text>
        </View>

        <Text style={styles.sectionTitle}>إيصال التحويل</Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.receiptPicker, file && styles.receiptSelected]}
          onPress={onPickReceipt}
          disabled={isUploading}
        >
          {file ? (
            <>
              <FileCheck2 size={22} color={tokens.colors.signal} />
              <Text style={styles.receiptSelectedText}>تم اختيار الإيصال</Text>
              <Text style={styles.receiptHint}>اضغط لاختيار صورة أخرى</Text>
            </>
          ) : (
            <>
              <Upload size={22} color={tokens.colors.navy} />
              <Text style={styles.receiptPickerText}>اختر صورة الإيصال</Text>
              <Text style={styles.receiptHint}>JPG أو PNG</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.progressSlot} accessibilityLiveRegion="polite">
          {isUploading ? (
            <>
              <Text style={styles.progressLabel}>جارٍ إرسال الإيصال · {uploadProgress}%</Text>
              <View
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: uploadProgress }}
                style={styles.progressTrack}
              >
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
            </>
          ) : null}
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.submitButton, (!canSubmit || isUploading) && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={!canSubmit || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={tokens.colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>إرسال الإيصال للمراجعة</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const PaymentMethodOption = ({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityState={{ selected }}
    style={[styles.methodOption, selected && styles.selectedMethodOption]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.methodText, selected && styles.selectedMethodText]}>{label}</Text>
  </TouchableOpacity>
);

export const SubscriptionScreen = () => {
  const { user, hydrate, refreshUserProfile } = useAuthStore();
  const { data: subscriptionData, isLoading: plansLoading, error } = useSubscriptionPlans();
  const {
    data: statusData,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useSubscriptionStatus();
  const getUrl = useGetReceiptUploadUrl();
  const submit = useSubmitSubscription();

  const plans: SubscriptionPlan[] = subscriptionData?.plans || [];
  const instructions: PaymentInstructions | null = subscriptionData?.paymentInstructions || null;
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'MANUAL_BANK_TRANSFER' | 'MANUAL_VODAFONE_CASH'>('MANUAL_VODAFONE_CASH');
  const [file, setFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) setSelectedPlanId(plans[0].id);
  }, [plans, selectedPlanId]);

  useEffect(() => {
    refreshUserProfile();
  }, [refreshUserProfile]);

  useEffect(() => {
    if (error) {
      Toast.show({ type: 'error', text1: 'خطأ', text2: 'تعذر جلب خطط الاشتراك' });
    }
  }, [error]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setFile(result.assets[0]);
  };

  const proceedSubmit = async () => {
    if (!file || !selectedPlanId) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const contentType = file.mimeType || 'image/jpeg';
      const urlData = await getUrl.mutateAsync({ contentType });
      await uploadFileToR2({
        localUri: file.uri,
        presignedUrl: urlData.uploadUrl,
        contentType,
        onProgress: (progress) => setUploadProgress(Math.max(0, Math.min(progress, 100))),
      });
      await submit.mutateAsync({
        planId: selectedPlanId,
        paymentMethod,
        receiptKey: urlData.fileKey,
      });

      Toast.show({
        type: 'success',
        text1: 'تم استلام الإيصال',
        text2: 'سنرسل إليك إشعاراً بعد مراجعة التحويل.',
      });
      await Promise.all([refetchStatus(), hydrate()]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'تعذر إرسال الإيصال. حاول مرة أخرى.';
      Toast.show({ type: 'error', text1: 'تعذر إرسال الإيصال', text2: message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      Toast.show({ type: 'error', text1: 'اختر الإيصال', text2: 'أرفق صورة إيصال التحويل للمتابعة.' });
      return;
    }
    if (!selectedPlanId) {
      Toast.show({ type: 'error', text1: 'اختر الباقة', text2: 'اختر مدة الاشتراك للمتابعة.' });
      return;
    }
    proceedSubmit();
  };

  const isLoading = plansLoading || statusLoading;
  const subscriptionStatus = statusData?.subscriptionStatus ?? user?.subscriptionStatus;
  const isActive = subscriptionStatus === 'ACTIVE';
  const hasPendingPayment = statusData?.pendingPayment?.status === 'PENDING'
    || statusData?.status === 'PENDING';
  const expiresAt = statusData?.subscriptionExpiresAt ?? user?.subscriptionExpiresAt;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.navy} />
      </SafeAreaView>
    );
  }

  if (isActive) return <ActiveSubscriptionView expiresAt={expiresAt} />;
  if (hasPendingPayment) return <PendingSubscriptionView />;

  return (
    <PaywallView
      plans={plans}
      selectedPlanId={selectedPlanId}
      onSelectPlan={setSelectedPlanId}
      paymentMethod={paymentMethod}
      onSelectPaymentMethod={setPaymentMethod}
      instructions={instructions}
      file={file}
      onPickReceipt={pickImage}
      isUploading={isUploading}
      uploadProgress={uploadProgress}
      canSubmit={!!file && !!selectedPlanId}
      onSubmit={handleSubmit}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.paper,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.paper,
    padding: tokens.spacing.lg,
  },
  stateIcon: {
    width: tokens.spacing.xxxl,
    height: tokens.spacing.xxxl,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
  },
  activeIcon: {
    backgroundColor: tokens.colors.verdantBg,
  },
  pendingIcon: {
    backgroundColor: tokens.colors.amberBg,
  },
  stateTitle: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: tokens.typography.sizes.xxl,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  stateBody: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.base,
    lineHeight: tokens.typeScale.body.lineHeight,
    textAlign: 'center',
    maxWidth: 440,
  },
  expiryCard: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    marginTop: tokens.spacing.lg,
  },
  expiryLabel: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.sm,
  },
  expiryDate: {
    color: tokens.colors.signal,
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: tokens.typography.sizes.xl,
    marginTop: tokens.spacing.xs,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    width: '100%',
    maxWidth: 440,
    backgroundColor: tokens.colors.amberBg,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    marginTop: tokens.spacing.lg,
  },
  pendingCardText: {
    flex: 1,
    color: tokens.colors.docket,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
    textAlign: 'right',
  },
  scrollContent: {
    padding: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
  },
  pitchHeader: {
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  pitchIcon: {
    width: tokens.spacing.xxxl,
    height: tokens.spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.pill,
    marginBottom: tokens.spacing.sm,
  },
  pitchTitle: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: tokens.typography.sizes.xl,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  pitchDescription: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.sm,
    lineHeight: tokens.typeScale.body.lineHeight,
    textAlign: 'center',
  },
  benefitList: {
    gap: tokens.spacing.xs,
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  benefitText: {
    flex: 1,
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
  },
  sectionTitle: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
    marginBottom: tokens.spacing.xs,
  },
  planList: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  planOption: {
    flex: 1,
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.sm,
  },
  selectedPlanOption: {
    borderColor: tokens.colors.signal,
    backgroundColor: tokens.colors.verdantBg,
  },
  planOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.xxs,
  },
  planName: {
    flex: 1,
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.xs,
  },
  planBadge: {
    color: tokens.colors.verdant,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 10,
  },
  planDuration: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 10,
    marginTop: tokens.spacing.xxs,
  },
  planPrice: {
    color: tokens.colors.navy,
    fontFamily: tokens.typography.fonts.mono,
    fontSize: tokens.typography.sizes.base,
    marginTop: tokens.spacing.xs,
  },
  methodRow: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  methodOption: {
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
  },
  selectedMethodOption: {
    borderColor: tokens.colors.signal,
    backgroundColor: tokens.colors.verdantBg,
  },
  methodText: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.xs,
  },
  selectedMethodText: {
    color: tokens.colors.signal,
  },
  paymentCard: {
    backgroundColor: tokens.colors.paper,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  paymentCardTitle: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
  },
  paymentNumber: {
    color: tokens.colors.navy,
    fontFamily: tokens.typography.fonts.mono,
    fontSize: tokens.typography.sizes.xl,
    textAlign: 'center',
    marginVertical: tokens.spacing.sm,
  },
  bankDetail: {
    color: tokens.colors.navy,
    fontFamily: tokens.typography.fonts.mono,
    fontSize: tokens.typography.sizes.xs,
    marginTop: tokens.spacing.xs,
  },
  paymentAccountName: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
    marginTop: tokens.spacing.xs,
  },
  paymentHint: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
    marginTop: tokens.spacing.sm,
  },
  receiptPicker: {
    minHeight: tokens.spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
    gap: tokens.spacing.xxs,
    marginBottom: tokens.spacing.md,
  },
  receiptSelected: {
    borderStyle: 'solid',
    borderColor: tokens.colors.signal,
    backgroundColor: tokens.colors.verdantBg,
  },
  receiptPickerText: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
  },
  receiptSelectedText: {
    color: tokens.colors.signal,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
  },
  receiptHint: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 10,
  },
  footer: {
    backgroundColor: tokens.colors.paper,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.line,
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.xs,
    paddingBottom: tokens.spacing.sm,
  },
  progressSlot: {
    height: tokens.spacing.lg,
    justifyContent: 'center',
    marginBottom: tokens.spacing.xs,
  },
  progressLabel: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 10,
    marginBottom: tokens.spacing.xxs,
  },
  progressTrack: {
    height: tokens.spacing.xxs,
    overflow: 'hidden',
    backgroundColor: tokens.colors.line,
    borderRadius: tokens.radius.pill,
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.signal,
  },
  submitButton: {
    height: tokens.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.signal,
    borderRadius: tokens.radius.lg,
  },
  submitButtonDisabled: {
    backgroundColor: tokens.colors.muted,
  },
  submitButtonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.base,
  },
});
