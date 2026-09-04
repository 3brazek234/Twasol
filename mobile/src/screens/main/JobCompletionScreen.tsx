import  { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import { Star, CheckCircle } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

export const JobCompletionScreen = ({ route, navigation }: any) => {
  const { jobId, fee = 0, posterId } = route.params || {};
  const [currentStep, setCurrentStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { user } = useAuthStore();

  const handleConfirmPayment = () => {
    setCurrentStep(2);
  };

  const handleReviewSubmit = async () => {
    if (rating === 0) {
      Alert.alert('تنبيه', 'يرجى اختيار تقييم أو تخطي');
      return;
    }
    
    try {
      await apiClient.post(`/reviews`, {
        revieweeId: posterId,
        rating,
        comment
      });
      setCurrentStep(3);
    } catch (err) {
      // In case of error (maybe already reviewed)
      setCurrentStep(3);
    }
  };

  const getRatingText = () => {
    switch(rating) {
      case 1: return 'سيء جداً';
      case 2: return 'سيء';
      case 3: return 'مقبول';
      case 4: return 'جيد';
      case 5: return 'ممتاز';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Dots */}
      <View style={styles.steps}>
        {[1, 2, 3].map(n => (
          <View key={n} style={[styles.dot, currentStep >= n && styles.dotActive]} />
        ))}
      </View>

      {currentStep === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>تأكيد استلام المبلغ</Text>
          <Text style={styles.body}>هل استلمت المبلغ المتفق عليه؟</Text>
          
          <Text style={styles.amount}>{fee > 0 ? `${fee} ج.م` : 'المبلغ المتفق عليه'}</Text>
          
          <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmPayment}>
            <Text style={styles.primaryBtnText}>نعم، استلمت المبلغ ✓</Text>
          </TouchableOpacity>
          
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>إذا لم تستلم المبلغ بعد، يرجى التواصل مع الموكل عبر المحادثة لحل هذه المسألة.</Text>
            <TouchableOpacity 
              style={styles.chatBtn}
              onPress={() => navigation.navigate('ChatsTab', { screen: 'ConversationsList' })}
            >
              <Text style={styles.chatBtnText}>فتح المحادثة</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {currentStep === 2 && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>قيم تجربتك مع الموكل</Text>
          <Text style={styles.subtitle}>تقييمك يساعد المحامين الآخرين</Text>
          
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Star 
                  size={40} 
                  color={tokens.colors.signal} 
                  fill={star <= rating ? tokens.colors.signal : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.ratingText}>{getRatingText()}</Text>

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

          <TouchableOpacity style={styles.primaryBtn} onPress={handleReviewSubmit}>
            <Text style={styles.primaryBtnText}>إرسال التقييم</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={() => setCurrentStep(3)}>
            <Text style={styles.ghostBtnText}>تخطي</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 3 && (
        <View style={[styles.stepContainer, styles.center]}>
          <CheckCircle size={80} color="#28a745" />
          <Text style={[styles.title, { marginTop: 16 }]}>شكراً لك!</Text>
          <Text style={styles.body}>تم تسجيل تقييمك بنجاح.</Text>
          
          <TouchableOpacity 
            style={[styles.primaryBtn, { marginTop: 32 }]} 
            onPress={() => navigation.navigate('JobsTab', { screen: 'HiringHome' })}
          >
            <Text style={styles.primaryBtnText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paper },
  steps: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ddd' },
  dotActive: { backgroundColor: tokens.colors.signal },
  stepContainer: { flex: 1, padding: 24, marginTop: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontFamily: tokens.typography.fonts.displayBold, color: tokens.colors.ink, textAlign: 'center', marginBottom: 8 },
  body: { fontSize: 16, color: tokens.colors.muted, textAlign: 'center', marginBottom: 24 },
  subtitle: { fontSize: 14, color: tokens.colors.muted, textAlign: 'center', marginBottom: 24 },
  amount: { fontSize: 40, fontFamily: tokens.typography.fonts.displayBold, color: tokens.colors.signal, textAlign: 'center', marginVertical: 32 },
  primaryBtn: { backgroundColor: tokens.colors.ink, padding: 16, borderRadius: 12, alignItems: 'center', marginVertical: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontFamily: tokens.typography.fonts.displayBold },
  ghostBtn: { padding: 16, alignItems: 'center' },
  ghostBtnText: { color: tokens.colors.muted, fontSize: 16, fontFamily: tokens.typography.fonts.displayBold },
  warningCard: { backgroundColor: '#fff3cd', padding: 16, borderRadius: 12, marginTop: 32, borderWidth: 1, borderColor: '#ffe69c' },
  warningText: { color: '#856404', fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  chatBtn: { backgroundColor: '#856404', padding: 12, borderRadius: 8, alignItems: 'center' },
  chatBtnText: { color: '#fff', fontSize: 14, fontFamily: tokens.typography.fonts.displayBold },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  ratingText: { textAlign: 'center', fontSize: 16, color: tokens.colors.signal, fontFamily: tokens.typography.fonts.displayBold, marginBottom: 24 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', marginBottom: 24 }
});
