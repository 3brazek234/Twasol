import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { tokens } from '../theme/tokens';
import { X } from 'lucide-react-native';
import { StarRating } from './StarRating';

interface LeaveReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
  targetName?: string;
}

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  visible,
  onClose,
  onSubmit,
  targetName = 'this professional',
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onSubmit(rating, review);
      setIsSubmitting(false);
      handleClose();
    }, 1000);
  };

  const handleClose = () => {
    setRating(0);
    setReview('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Leave a Review</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <X size={24} color={tokens.colors.muted} />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.subtitle}>
              How was your experience working with {targetName}?
            </Text>
            
            <View style={styles.ratingContainer}>
              <StarRating 
                rating={rating} 
                onRatingChange={setRating} 
                interactive 
                size={36} 
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>WRITE A REVIEW (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Share details of your experience..."
                placeholderTextColor={tokens.colors.muted}
                multiline
                numberOfLines={4}
                value={review}
                onChangeText={setReview}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.submitButton, (rating === 0 || isSubmitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 20, 0.6)',
    justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  modalContainer: {
    backgroundColor: tokens.colors.white,
    borderRadius: 24,
    maxHeight: '80%',
    shadowColor: tokens.colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
  },
  title: {
    fontFamily: tokens.typography.fonts.display,
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
  },
  content: {
    padding: tokens.spacing.lg,
  },
  subtitle: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.xl,
    textAlign: 'center',
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  formGroup: {
    marginBottom: tokens.spacing.sm,
  },
  label: {
    fontSize: tokens.typography.sizes.xs,
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.sm,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: tokens.colors.paper,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: 12,
    padding: tokens.spacing.md,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.body,
    minHeight: 120,
  },
  footer: {
    padding: tokens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.line,
  },
  submitButton: {
    backgroundColor: tokens.colors.signal,
    paddingVertical: tokens.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: tokens.colors.muted,
    opacity: 0.7,
  },
  submitButtonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.bold,
    fontSize: tokens.typography.sizes.base,
  },
});
