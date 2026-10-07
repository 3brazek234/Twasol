import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { tokens } from '../theme/tokens';
import { AlertCircle, Clock, ShieldAlert } from 'lucide-react-native';
import { useAuthStore } from '../stores/authStore';
import { useNavigation } from '@react-navigation/native';

export const VerificationStatusBanner = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();

  if (!user || user.verificationStatus === 'APPROVED' || user.accountMode === 'HIRING') return null;

  const getBannerContent = () => {
    switch (user.verificationStatus) {
      case 'UNVERIFIED':
      case 'PENDING_UPLOAD':
        return {
          title: 'Verification Required',
          subtitle: 'You must verify your credentials to apply for jobs.',
          icon: <ShieldAlert size={20} color={tokens.colors.docket} />,
          bgColor: 'rgba(196, 87, 31, 0.1)',
          borderColor: 'rgba(196, 87, 31, 0.2)',
          color: tokens.colors.docket,
          actionText: 'Verify Now',
          buttonStyle: { backgroundColor: tokens.colors.docket, borderColor: tokens.colors.docket },
          buttonTextStyle: { color: tokens.colors.paper },
          onPress: () => navigation.navigate('Verification', { screen: 'VerificationIntro' }),
        };
      case 'PENDING':
        return {
          title: 'Review Pending',
          subtitle: 'Your credentials are being reviewed. Applying is restricted.',
          icon: <Clock size={20} color={tokens.colors.docket} />,
          bgColor: 'rgba(196, 87, 31, 0.05)',
          borderColor: 'rgba(196, 87, 31, 0.2)',
          color: tokens.colors.docket,
          actionText: 'View Status',
          buttonStyle: {},
          buttonTextStyle: {},
          onPress: () => navigation.navigate('PendingReviewScreenRoot'),
        };
      case 'REJECTED':
        return {
          title: 'Verification Failed',
          subtitle: 'Your credentials could not be verified.',
          icon: <AlertCircle size={20} color={tokens.colors.destructive} />,
          bgColor: 'rgba(217, 49, 49, 0.05)',
          borderColor: 'rgba(217, 49, 49, 0.2)',
          color: tokens.colors.destructive,
          actionText: 'Resubmit',
          buttonStyle: {},
          buttonTextStyle: {},
          onPress: () => navigation.navigate('ResubmitScreenRoot'),
        };
      default:
        return null;
    }
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <View style={[styles.container, { backgroundColor: content.bgColor, borderColor: content.borderColor }]}>
      <View style={styles.iconContainer}>
        {content.icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: content.color }]}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.button, { borderColor: content.borderColor }, content.buttonStyle]} 
        onPress={content.onPress}
      >
        <Text style={[styles.buttonText, { color: content.color }, content.buttonTextStyle]}>{content.actionText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: tokens.spacing.md,
    marginVertical: tokens.spacing.sm,
  },
  iconContainer: {
    marginEnd: tokens.spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.bold,
    fontSize: tokens.typography.sizes.sm,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.ink,
    opacity: 0.8,
  },
  button: {
    marginStart: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: tokens.colors.white,
  },
  buttonText: {
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.bold,
    fontSize: tokens.typography.sizes.xs,
  },
});
