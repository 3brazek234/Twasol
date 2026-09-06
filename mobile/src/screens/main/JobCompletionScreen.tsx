import { useSubmitReview } from "../../hooks/useReviews";

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ScrollView } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { StarRating } from '../../components/StarRating';
import { formatCurrency } from '../../utils/dateUtils';

const STEPS = [
  { id: 1, label: 'تأكيد الاستلام' },
  { id: 2, label: 'التقييم' },
  { id: 3, label: 'تم' }
];

export const JobCompletionScreen = ({ route, navigation }: any) => {
  const { jobId, fee: rawFee = 0, posterId } = route.params || {};
  const fee = typeof rawFee === 'string' ? parseFloat(rawFee) : rawFee;
  const [currentStep, setCurrentStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [skipped, setSkipped] = useState(false);
  const [showPaymentIssue, setShowPaymentIssue] = useState(false);
  const { user } = useAuthStore();
  const submitReview = useSubmitReview();

  const handleConfirmPayment = () => {
    setCurrentStep(2);
  };

  const handleReviewSubmit = async () => {
    if (rating === 0) return;
    try {
      await submitReview.mutateAsync({
        jobId,
        revieweeId: posterId,
        rating,
        comment
      });
      setSkipped(false);
      setCurrentStep(3);
    } catch (err) {
      setSkipped(false);
      setCurrentStep(3);
    }
  };

  const handleSkip = () => {
    setSkipped(true);
    setCurrentStep(3);
  };

  const getRatingLabel = () => {
    switch(rating) {
      case 1: return 'سيء جداً 😞';
      case 2: return 'سيء 😐';
      case 3: return 'مقبول 🙂';
      case 4: return 'جيد 👍';
      case 5: return 'ممتاز ⭐';
      default: return ' ';
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      {STEPS.map((step, index) => {
        const isPast = currentStep > step.id;
        const isActive = currentStep === step.id;
        const isFuture = currentStep < step.id;

        return (
          <View key={step.id} style={styles.stepWrapper}>
            <View style={styles.stepDotLineRow}>
              <View style={[styles.flexLine, index === 0 ? styles.hiddenLine : (isPast || isActive ? styles.stepLineDone : styles.stepLinePending)]} />
              
              <View style={styles.dotWrapper}>
                <View style={[
                  styles.dot,
                  isActive && styles.dotActive,
                  isPast && styles.dotDone,
                  isFuture && styles.dotInactive
                ]} />
              </View>

              <View style={[styles.flexLine, index === STEPS.length - 1 ? styles.hiddenLine : (isPast ? styles.stepLineDone : styles.stepLinePending)]} />
            </View>
            <Text style={[
              styles.stepLabel,
              isActive ? styles.stepLabelActive : styles.stepLabelInactive
            ]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderStepIndicator()}

      {currentStep === 1 && (
        <ScrollView style={styles.stepContainer} contentContainerStyle={styles.stepScrollContent}>
          <View style={styles.moneyIconContainer}>
            <Text style={styles.moneyIcon}>💰</Text>
          </View>
          <Text style={styles.step1Title}>هل استلمت المبلغ المتفق عليه؟</Text>
          
          <View style={styles.feePill}>
            <Text style={styles.feeAmount}>{fee > 0 ? formatCurrency(fee) : 'المبلغ المتفق عليه'}</Text>
          </View>

          <View style={styles.step1Buttons}>
            <TouchableOpacity style={styles.verdantBtn} onPress={handleConfirmPayment}>
              <Text style={styles.verdantBtnText}>نعم، استلمت المبلغ ✓</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.crimsonGhostBtn} onPress={() => setShowPaymentIssue(true)}>
              <Text style={styles.crimsonGhostBtnText}>لم أستلم المبلغ بعد</Text>
            </TouchableOpacity>
          </View>

          {showPaymentIssue && (
            <View style={styles.paymentIssueCard}>
              <Text style={styles.paymentIssueTitle}>تواصل مع الموكِّل</Text>
              <Text style={styles.paymentIssueBody}>
                يمكنك مراسلة الموكِّل مباشرة عبر المحادثة لحل مسألة الدفع.
              </Text>
              <TouchableOpacity 
                style={styles.paymentIssueBtn}
                onPress={() => navigation.navigate('ChatsTab', { screen: 'ConversationsList' })}
              >
                <Text style={styles.paymentIssueBtnText}>فتح المحادثة</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {currentStep === 2 && (
        <ScrollView style={styles.stepContainer} contentContainerStyle={styles.stepScrollContent}>
          <Text style={styles.step2Title}>قيم تجربتك مع الموكل</Text>
          <Text style={styles.subtitle}>تقييمك يساعد المحامين الآخرين</Text>
          
          <View style={styles.starsWrapper}>
            <StarRating 
              rating={rating} 
              onRatingChange={setRating} 
              interactive={true}
              size={40}
            />
          </View>
          
          <Text style={styles.ratingLabelText}>{getRatingLabel()}</Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="شاركنا تجربتك... (اختياري)"
              placeholderTextColor={tokens.colors.muted}
              multiline
              numberOfLines={4}
              maxLength={500}
              value={comment}
              onChangeText={setComment}
              textAlign="right"
            />
            <Text style={styles.charCounter}>{comment.length}/500</Text>
          </View>

          <TouchableOpacity 
            style={[styles.primaryBtn, rating === 0 && styles.disabledBtn]} 
            onPress={handleReviewSubmit}
            disabled={rating === 0}
          >
            <Text style={styles.primaryBtnText}>إرسال التقييم</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={handleSkip}>
            <Text style={styles.ghostBtnText}>تخطي</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {currentStep === 3 && (
        <View style={[styles.stepContainer, styles.center]}>
          <View style={styles.successIconCircle}>
            <CheckCircle size={56} color={tokens.colors.white} />
          </View>
          <Text style={styles.successTitle}>أحسنت! 🎉</Text>
          
          <Text style={styles.successBody}>
            {skipped 
              ? "تم إتمام المهمة بنجاح.\nيمكنك دائماً تقييم تجربتك لاحقاً."
              : "تم تسجيل تقييمك بنجاح.\nشكراً لمساهمتك في بناء مجتمع قانوني موثوق."
            }
          </Text>
          
          <TouchableOpacity 
            style={styles.returnBtn} 
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
          >
            <Text style={styles.returnBtnText}>العودة إلى مهامي</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paper },
  stepIndicatorContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  stepWrapper: { flex: 1, alignItems: 'center' },
  stepDotLineRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8 },
  flexLine: { flex: 1, height: 2 },
  hiddenLine: { backgroundColor: 'transparent' },
  stepLineDone: { backgroundColor: tokens.colors.gold },
  stepLinePending: { backgroundColor: tokens.colors.line },
  dotWrapper: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  dot: {},
  dotActive: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: tokens.colors.navy,
    shadowColor: tokens.colors.navy,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,
  },
  dotDone: { width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.colors.gold },
  dotInactive: { width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.colors.line },
  stepLabel: { fontSize: 11, textAlign: 'center' },
  stepLabelActive: { fontFamily: tokens.typography.fonts.bodySemibold, color: tokens.colors.navy },
  stepLabelInactive: { fontFamily: tokens.typography.fonts.body, color: tokens.colors.muted },

  stepContainer: { flex: 1, padding: 24 },
  stepScrollContent: { paddingBottom: 40 },
  center: { alignItems: 'center', justifyContent: 'center' },

  // Step 1
  moneyIconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: tokens.colors.verdantBg,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 24,
  },
  moneyIcon: { fontSize: 36 },
  step1Title: {
    fontSize: 20, fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.ink, textAlign: 'center', marginBottom: 24,
  },
  feePill: {
    backgroundColor: tokens.colors.amberBg,
    borderRadius: 16,
    paddingHorizontal: 24, paddingVertical: 12,
    alignSelf: 'center', marginBottom: 40,
  },
  feeAmount: {
    fontSize: 28, fontFamily: tokens.typography.fonts.mono,
    color: tokens.colors.gold, textAlign: 'center',
  },
  step1Buttons: { gap: 16, marginBottom: 24 },
  verdantBtn: {
    backgroundColor: tokens.colors.verdant,
    height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  verdantBtnText: {
    color: tokens.colors.white, fontSize: 16,
    fontFamily: tokens.typography.fonts.bodySemibold,
  },
  crimsonGhostBtn: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1.5, borderColor: tokens.colors.crimson,
    height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  crimsonGhostBtnText: {
    color: tokens.colors.crimson, fontSize: 16,
    fontFamily: tokens.typography.fonts.bodySemibold,
  },
  paymentIssueCard: {
    backgroundColor: tokens.colors.amberBg,
    borderWidth: 1, borderColor: tokens.colors.amber,
    borderRadius: 12, padding: 16,
  },
  paymentIssueTitle: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.amber, marginBottom: 8, textAlign: 'right'
  },
  paymentIssueBody: {
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.ink, fontSize: 13,
    marginBottom: 16, textAlign: 'right', lineHeight: 20
  },
  paymentIssueBtn: {
    backgroundColor: tokens.colors.amber,
    borderRadius: 8, paddingVertical: 10,
    alignItems: 'center'
  },
  paymentIssueBtnText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14
  },

  // Step 2
  step2Title: {
    fontSize: 24, fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.ink, textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    fontSize: 14, fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted, textAlign: 'center', marginBottom: 24,
  },
  starsWrapper: { alignItems: 'center', marginBottom: 12 },
  ratingLabelText: {
    textAlign: 'center', fontSize: 16,
    color: tokens.colors.navy, fontFamily: tokens.typography.fonts.bodySemibold,
    marginBottom: 24, height: 24,
  },
  inputWrapper: { marginBottom: 24 },
  input: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1, borderColor: tokens.colors.line,
    borderRadius: 12, padding: 16,
    height: 120, textAlignVertical: 'top',
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.ink, textAlign: 'right'
  },
  charCounter: {
    marginTop: 8, textAlign: 'right',
    fontSize: 11, fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
  },
  primaryBtn: {
    backgroundColor: tokens.colors.navy,
    height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  disabledBtn: { backgroundColor: tokens.colors.muted },
  primaryBtnText: {
    color: tokens.colors.white, fontSize: 16,
    fontFamily: tokens.typography.fonts.bodySemibold,
  },
  ghostBtn: {
    height: 48, alignItems: 'center', justifyContent: 'center',
  },
  ghostBtnText: {
    color: tokens.colors.muted, fontSize: 16,
    fontFamily: tokens.typography.fonts.bodySemibold,
  },

  // Step 3
  successIconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: tokens.colors.verdant,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26, fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.ink, textAlign: 'center', marginBottom: 16,
  },
  successBody: {
    fontSize: 16, fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted, textAlign: 'center',
    lineHeight: 24, marginBottom: 40,
  },
  returnBtn: {
    backgroundColor: tokens.colors.navy,
    height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    width: '100%',
  },
  returnBtnText: {
    color: tokens.colors.white, fontSize: 16,
    fontFamily: tokens.typography.fonts.bodySemibold,
  },
});
