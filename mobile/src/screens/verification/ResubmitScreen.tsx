import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { AlertCircle } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';

export const ResubmitScreen = ({ navigation }: any) => {
  const { submitVerification } = useAuthStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <AlertCircle size={48} color={tokens.colors.destructive} />
          </View>
          
          <Text style={styles.title}>Verification Unsuccessful</Text>
          <Text style={styles.subtitle}>
            We were unable to verify your credentials with the information provided. Please review the reasons and submit again.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Reason: The Bar Association number provided does not match our records or is inactive.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => submitVerification('UNVERIFIED')} // Reset state to allow re-upload
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('MainAppFallback')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Browse Jobs Meanwhile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
  },
  container: {
    flex: 1,
    padding: tokens.spacing.xl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(217, 49, 49, 0.1)', // destructive with low opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  title: {
    fontFamily: tokens.typography.fonts.display,
    fontSize: tokens.typography.sizes.xxl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  subtitle: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: tokens.spacing.xl,
  },
  infoBox: {
    backgroundColor: 'rgba(217, 49, 49, 0.05)',
    padding: tokens.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 49, 49, 0.2)',
    width: '100%',
  },
  infoText: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.destructive,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: tokens.typography.weights.medium,
  },
  footer: {
    paddingTop: tokens.spacing.xl,
  },
  primaryButton: {
    backgroundColor: tokens.colors.destructive,
    paddingVertical: tokens.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  primaryButtonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.bold,
    fontSize: tokens.typography.sizes.base,
  },
  secondaryButton: {
    paddingVertical: tokens.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.semibold,
    fontSize: tokens.typography.sizes.base,
  },
});
