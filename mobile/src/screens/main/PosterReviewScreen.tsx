import { useSubmitReview } from "../../hooks/useReviews";

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronRight } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { StarRating } from '../../components/StarRating';
import { apiClient } from '../../api/client';

export const PosterReviewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const { jobId, jobTitle, lawyerId, lawyerName, fee } = route.params || {};

  const [rating, setRating] = useState(0);
  const submitReview = useSubmitReview();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return "سيء جداً 😞";
      case 2: return "سيء 😐";
      case 3: return "مقبول 🙂";
      case 4: return "جيد 👍";
      case 5: return "ممتاز ⭐";
      default: return "";
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await submitReview.mutateAsync({
        jobId,
        revieweeId: lawyerId,
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert('شكراً', 'تم تسجيل تقييمك بنجاح', [
        { text: 'حسناً', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال التقييم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight color={tokens.colors.ink} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تقييم المحامي</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{lawyerName ? lawyerName.charAt(0) : 'م'}</Text>
          </View>
          <Text style={styles.lawyerName}>{lawyerName || 'المحامي'}</Text>
          <Text style={styles.lawyerLabel}>المحامي المُوكَّل</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.questionText}>كيف كانت تجربتك مع هذا المحامي؟</Text>
        
        <View style={styles.starsContainer}>
          <StarRating
            rating={rating}
            maxStars={5}
            size={44}
            interactive={true}
            onRatingChange={setRating}
          />
          <Text style={styles.ratingLabel}>{getRatingLabel(rating)}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>تعليق (اختياري)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="شاركنا تجربتك مع هذا المحامي..."
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
          style={[
            styles.submitButton, 
            rating === 0 ? styles.submitButtonDisabled : {}
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>تخطي</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
  },
  backButton: {
    padding: tokens.spacing.xs,
  },
  headerTitle: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 16,
    color: tokens.colors.ink,
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: tokens.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: 32,
    color: tokens.colors.white,
  },
  lawyerName: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: 20,
    color: tokens.colors.ink,
    marginTop: 12,
    textAlign: 'center',
  },
  lawyerLabel: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 13,
    color: tokens.colors.muted,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.line,
    marginVertical: 24,
    width: '60%',
    alignSelf: 'center',
  },
  questionText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 16,
    color: tokens.colors.ink,
    textAlign: 'center',
    marginBottom: 24,
  },
  starsContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  ratingLabel: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 16,
    color: tokens.colors.navy,
    marginTop: 16,
    textAlign: 'center',
    minHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32,
  },
  inputLabel: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 13,
    color: tokens.colors.muted,
    marginBottom: 8,
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: tokens.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    padding: 14,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 14,
    color: tokens.colors.ink,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 11,
    color: tokens.colors.muted,
    textAlign: 'left',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: tokens.colors.navy,
    height: 52,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: tokens.colors.muted,
  },
  submitButtonText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 16,
    color: tokens.colors.white,
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 13,
    color: tokens.colors.muted,
    textAlign: 'center',
  },
});
