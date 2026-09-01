import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Controller } from 'react-hook-form';
import { tokens } from '../../../theme/tokens';
import { FileText, DollarSign, ChevronRight, Edit2, Check } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import { usePostJob } from './usePostJob';
import { PostJobStepCourts } from './PostJobStepCourts';

export const PostJobScreen = ({ navigation }: any) => {
  const {
    step, setStep,
    selectedCourt, handleCourtSelected,
    control, handleSubmit, errors, trigger, setValue,
    createJob, isPending, formData,
  } = usePostJob();

  const onSubmit = (data: any) => {
    const formattedAmount = data.salaryMax ? parseFloat(data.salaryMax) : (data.salaryMin ? parseFloat(data.salaryMin) : undefined);
    
    let expiresAt: string | undefined;
    if (data.expiresInHours) {
      expiresAt = new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000).toISOString();
    }

    const payload = {
      title: data.title,
      description: data.description,
      courtId: data.courtId,
      invitedLawyerId: data.invitedLawyerId || undefined,
      offerAmount: formattedAmount,
      expiresAt,
    };

    createJob(payload, {
      onSuccess: () => {
        Alert.alert('تم نشر الطلب', 'تم نشر طلبك بنجاح في جدول القضايا.', [
          { text: 'OK', onPress: () => navigation.navigate('JobsFeed') }
        ]);
      },
      onError: (err: any) => {
        const errorMsg = err.response?.data?.message || err.message || 'Could not post the brief.';
        Alert.alert('خطأ في النظام', errorMsg);
      }
    });
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) isValid = await trigger(['title', 'description']);
    else if (step === 2) isValid = await trigger(['courtId']);
    else if (step === 3) isValid = await trigger(['salaryMin', 'salaryMax']);

    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const renderStepIndicator = () => {
    const progress = (step / 4) * 100;
    return (
      <View style={styles.stepIndicatorOuter}>
        <View style={styles.stepIndicatorHeader}>
          <Text style={styles.stepIndicatorText}>الخطوة {step} من 4</Text>
          <Text style={styles.stepIndicatorTitle}>
            {step === 1 && "التفاصيل الأساسية"}
            {step === 2 && "الاختصاص القضائي"}
            {step === 3 && "الإعدادات والمقابل"}
            {step === 4 && "المراجعة النهائية"}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <MotiView
            animate={{ width: `${progress}%` }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.progressBar}
          />
        </View>
      </View>
    );
  };

  const renderStep1 = () => (
    <MotiView
      from={{ opacity: 0, translateX: 50 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -50 }}
      style={styles.stepContent}
    >
      <Text style={styles.inputLabel}>عنوان الطلب</Text>
      <View style={[styles.inputWrapper, errors.title && styles.inputErrorBorder]}>
        <FileText color={tokens.colors.muted} size={18} style={styles.inputIcon} />
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="مثال: حضور جلسة محكمة جنايات"
              value={value}
              onChangeText={onChange}
              placeholderTextColor={tokens.colors.muted}
            />
          )}
        />
      </View>
      {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}

      <Text style={[styles.inputLabel, { marginTop: tokens.spacing.md }]}>تفاصيل الطلب</Text>
      <View style={[styles.inputWrapper, styles.textAreaWrapper, errors.description && styles.inputErrorBorder]}>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.textArea}
              placeholder="اشرح تفاصيل الجلسة والمستندات المطلوبة..."
              value={value}
              onChangeText={onChange}
              multiline
              textAlignVertical="top"
              placeholderTextColor={tokens.colors.muted}
            />
          )}
        />
      </View>
      {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
    </MotiView>
  );

  const renderStep3 = () => (
    <MotiView
      from={{ opacity: 0, translateX: 50 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -50 }}
      style={styles.stepContent}
    >
      <Text style={styles.inputLabel}>المقابل المالي (اختياري)</Text>
      <Text style={styles.helperText}>اتركه فارغاً إذا كان قابلاً للتفاوض، أو ضع حداً ثابتاً.</Text>

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.miniLabel}>الحد الأدنى</Text>
          <View style={styles.inputWrapper}>
            <DollarSign color={tokens.colors.muted} size={16} style={styles.inputIcon} />
            <Controller
              control={control}
              name="salaryMin"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor={tokens.colors.muted}
                />
              )}
            />
          </View>
        </View>
        <View style={{ width: 16 }} />
        <View style={styles.flex1}>
          <Text style={styles.miniLabel}>الحد الأقصى</Text>
          <View style={styles.inputWrapper}>
            <DollarSign color={tokens.colors.muted} size={16} style={styles.inputIcon} />
            <Controller
              control={control}
              name="salaryMax"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor={tokens.colors.muted}
                />
              )}
            />
          </View>
        </View>
      </View>
      {errors.salaryMax && <Text style={styles.errorText}>{errors.salaryMax.message}</Text>}

      <Text style={[styles.inputLabel, { marginTop: tokens.spacing.xl }]}>مدة الصلاحية (اختياري)</Text>
      <View style={styles.inputWrapper}>
        <Controller
          control={control}
          name="expiresInHours"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="ينتهي بعد X ساعة (اختياري)"
              keyboardType="numeric"
              value={value ? String(value) : ''}
              onChangeText={(val) => onChange(val ? parseInt(val, 10) : null)}
              placeholderTextColor={tokens.colors.muted}
            />
          )}
        />
      </View>
    </MotiView>
  );

  const renderStep4 = () => (
    <MotiView
      from={{ opacity: 0, translateX: 50 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -50 }}
      style={styles.stepContent}
    >
      <Text style={styles.inputLabel}>المراجعة والنشر</Text>
      <Text style={styles.helperText}>يرجى مراجعة التفاصيل أدناه قبل نشر الطلب.</Text>

      <View style={styles.reviewCard}>
        <View style={styles.reviewSection}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewSectionTitle}>التفاصيل الأساسية</Text>
            <TouchableOpacity onPress={() => setStep(1)} hitSlop={10}>
              <Edit2 size={16} color={tokens.colors.signal} />
            </TouchableOpacity>
          </View>
          <Text style={styles.reviewLabel}>العنوان</Text>
          <Text style={styles.reviewValue}>{formData.title}</Text>
          <Text style={styles.reviewLabel}>الوصف</Text>
          <Text style={styles.reviewValue} numberOfLines={3}>{formData.description}</Text>
        </View>

        <View style={styles.reviewSection}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewSectionTitle}>المحكمة</Text>
            <TouchableOpacity onPress={() => setStep(2)} hitSlop={10}>
              <Edit2 size={16} color={tokens.colors.signal} />
            </TouchableOpacity>
          </View>
          <Text style={styles.reviewValue}>
            {selectedCourt?.nameAr ?? 'لم يتم اختيار محكمة'}
          </Text>
        </View>

        <View style={[styles.reviewSection, { borderBottomWidth: 0 }]}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewSectionTitle}>الإعدادات والمقابل</Text>
            <TouchableOpacity onPress={() => setStep(3)} hitSlop={10}>
              <Edit2 size={16} color={tokens.colors.signal} />
            </TouchableOpacity>
          </View>
          <Text style={styles.reviewValue}>
            {formData.salaryMin || formData.salaryMax
              ? `$${formData.salaryMin || 0} - $${formData.salaryMax || formData.salaryMin}`
              : 'عام (قابل للتفاوض)'}
          </Text>
          {formData.expiresInHours && (
            <Text style={[styles.reviewValue, { marginTop: 4, color: tokens.colors.docket }]}>
              ينتهي بعد {formData.expiresInHours} ساعة
            </Text>
          )}
        </View>
      </View>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      {renderStepIndicator()}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AnimatePresence>
            {step === 1 && renderStep1()}
            {step === 2 && (
              <PostJobStepCourts 
                selectedCourt={selectedCourt}
                onCourtSelected={handleCourtSelected}
                errors={errors}
              />
            )}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </AnimatePresence>

          <View style={styles.actionButtons}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={prevStep}
                disabled={isPending}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>السابق</Text>
              </TouchableOpacity>
            )}

            {step < 4 ? (
              <TouchableOpacity
                style={[styles.primaryButton, step === 1 && { marginStart: 0 }]}
                onPress={nextStep}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>التالي</Text>
                <ChevronRight size={18} color={tokens.colors.white} style={{ marginStart: 4 }} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleSubmit(onSubmit)()}
                disabled={isPending}
                activeOpacity={0.8}
              >
                {isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>نشر الطلب</Text>
                    <Check size={18} color={tokens.colors.white} style={{ marginStart: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paper },
  keyboardView: { flex: 1 },
  scrollContainer: { padding: tokens.spacing.lg },

  stepIndicatorOuter: {
    backgroundColor: tokens.colors.white,
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
  },
  stepIndicatorHeader: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  stepIndicatorText: {
    fontSize: 12,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepIndicatorTitle: {
    fontSize: 20,
    fontFamily: tokens.typography.fonts.display,
    color: tokens.colors.ink,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: tokens.colors.line + '40',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: tokens.colors.signal,
  },

  stepContent: {
    flex: 1,
    minHeight: 400,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.sm,
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 13,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    marginBottom: tokens.spacing.sm,
  },
  miniLabel: {
    fontSize: 11,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: 12,
    paddingHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.xxs,
    height: 56,
  },
  inputErrorBorder: {
    borderColor: tokens.colors.docket,
  },
  inputIcon: {
    marginEnd: tokens.spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: tokens.typography.fonts.body,
    fontSize: 16,
    color: tokens.colors.ink,
  },
  textAreaWrapper: {
    height: 120,
    alignItems: 'flex-start',
    paddingTop: tokens.spacing.md,
  },
  textArea: {
    flex: 1,
    width: '100%',
    height: '100%',
    fontFamily: tokens.typography.fonts.body,
    fontSize: 16,
    color: tokens.colors.ink,
  },
  errorText: {
    color: tokens.colors.docket,
    fontSize: 12,
    fontFamily: tokens.typography.fonts.body,
    marginTop: 2,
    marginBottom: tokens.spacing.md,
  },

  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },

  reviewCard: {
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    overflow: 'hidden',
    marginTop: tokens.spacing.md,
  },
  reviewSection: {
    padding: tokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.ink,
  },
  reviewLabel: {
    fontSize: 12,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    marginBottom: 2,
  },
  reviewValue: {
    fontSize: 15,
    fontFamily: tokens.typography.fonts.bodyMedium,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.md,
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.xl,
    paddingTop: tokens.spacing.md,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: tokens.colors.signal,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: tokens.spacing.md,
  },
  primaryButtonText: {
    color: tokens.colors.white,
    fontSize: 16,
    fontFamily: tokens.typography.fonts.displayBold,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: tokens.colors.ink,
    fontSize: 16,
    fontFamily: tokens.typography.fonts.displayBold,
  },
});
