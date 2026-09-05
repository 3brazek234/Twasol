import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const FinalCTA = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚖</Text>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>جاهز لتسريع</Text>
        <Text style={styles.title}>عملك القانوني؟</Text>
      </View>

      <Text style={styles.subtitle}>
        انضم إلى مئات المحامين الذين يثقون في وكيل لإدارة توكيلاتهم القانونية.
      </Text>

      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Register')}
        style={{ width: '100%', marginTop: 32 }}
      >
        <LinearGradient
          colors={['#1B4F72', '#2E86C1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>إنشاء حساب مجاناً ←</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryBtn}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.secondaryBtnText}>لديك حساب بالفعل؟ سجّل دخولك</Text>
      </TouchableOpacity>

      <View style={styles.badgesRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⚖ محامون موثقون</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🔒 بيانات آمنة</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⭐ تقييمات حقيقية</Text>
        </View>
      </View>

      <Text style={styles.footerText}>
        © 2025 وكيل — جميع الحقوق محفوظة
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    color: '#C0973B',
    marginBottom: 16,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Cairo_700Bold',
    color: '#1B4F72',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1B4F72',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Cairo_700Bold',
  },
  secondaryBtn: {
    marginTop: 16,
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: '#1B4F72',
    fontSize: 14,
    fontFamily: 'Cairo_600SemiBold',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 28,
    direction: 'rtl',
  },
  badge: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Cairo_600SemiBold',
    color: '#6C757D',
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#ADB5BD',
    marginTop: 24,
    textAlign: 'center',
  },
});
