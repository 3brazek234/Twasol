import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { Briefcase, Gavel } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { usersApi } from '../../api/users.api';

export const AccountModeScreen = ({ navigation }: any) => {
  const [selectedRole, setSelectedRole] = useState<'poster' | 'lawyer' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user, setUser, submitVerification, updateAccountMode } = useAuthStore();

  const handleContinue = async () => {
    if (!selectedRole) return;

    if (selectedRole === 'poster') {
      setIsSaving(true);
      try {
        await updateAccountMode('HIRING');
        
        if (user) {
          setUser({ ...user, accountMode: 'HIRING', verificationStatus: 'APPROVED' });
        }
        submitVerification('APPROVED');
      } catch (err) {
        Alert.alert('Error', 'Failed to update account mode. Please try again.');
        setIsSaving(false);
      }
    } else {
      navigation.navigate('VerificationIntro');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <Image 
              source={require('../../../assets/icon.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>How will you use Wakeel?</Text>
            <Text style={styles.subtitle}>
              You can change this later in settings.
            </Text>
          </View>

          <View style={styles.cardsContainer}>
            {/* Poster Card */}
            <TouchableOpacity 
              style={[
                styles.card,
                selectedRole === 'poster' && styles.cardSelected
              ]}
              activeOpacity={0.8}
              onPress={() => setSelectedRole('poster')}
            >
              <View style={styles.cardHeader}>
                <View style={[
                  styles.iconContainer,
                  selectedRole === 'poster' && styles.iconContainerSelected
                ]}>
                  <Briefcase 
                    size={24} 
                    color={selectedRole === 'poster' ? tokens.colors.white : tokens.colors.signal} 
                  />
                </View>
                <View style={[
                  styles.radio,
                  selectedRole === 'poster' && styles.radioSelected
                ]}>
                  {selectedRole === 'poster' && <View style={styles.radioInner} />}
                </View>
              </View>
              
              <Text style={styles.cardTitle}>ايجاد محامي</Text>
              <Text style={styles.cardDescription}>
                أحتاج إلى تمثيل قانوني أو أريد تفويض ظهوري لمحامي آخر.
              </Text>
            </TouchableOpacity>

            {/* Lawyer Card */}
            <TouchableOpacity 
              style={[
                styles.card,
                selectedRole === 'lawyer' && styles.cardSelected
              ]}
              activeOpacity={0.8}
              onPress={() => setSelectedRole('lawyer')}
            >
              <View style={styles.cardHeader}>
                <View style={[
                  styles.iconContainer,
                  selectedRole === 'lawyer' && styles.iconContainerSelected
                ]}>
                  <Gavel 
                    size={24} 
                    color={selectedRole === 'lawyer' ? tokens.colors.white : tokens.colors.signal} 
                  />
                </View>
                <View style={[
                  styles.radio,
                  selectedRole === 'lawyer' && styles.radioSelected
                ]}>
                  {selectedRole === 'lawyer' && <View style={styles.radioInner} />}
                </View>
              </View>
              
              <Text style={styles.cardTitle}>ايجاد عمل</Text>
              <Text style={styles.cardDescription}>
                أنا محامي معتمد وأبحث عن حالات قانونية .
              </Text>
              
              {selectedRole === 'lawyer' && (
                <View style={styles.verificationNote}>
                  <Text style={styles.verificationNoteText}>
                      * Requires Bar Association ID verification
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.primaryButton,
              (!selectedRole || isSaving) && styles.primaryButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!selectedRole || isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color={tokens.colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.xl,
    paddingTop: tokens.spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing['2xl'],
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: tokens.spacing.xl,
  },
  title: {
    fontSize: tokens.typography.sizes.xl,
    fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: tokens.typography.sizes.base,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: tokens.spacing.lg,
  },
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    padding: tokens.spacing.xl,
    borderWidth: 2,
    borderColor: tokens.colors.line,
  },
  cardSelected: {
    borderColor: tokens.colors.signal,
    backgroundColor: 'rgba(47, 111, 94, 0.02)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(47, 111, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSelected: {
    backgroundColor: tokens.colors.signal,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: tokens.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: tokens.colors.signal,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: tokens.colors.signal,
  },
  cardTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.sm,
  },
  cardDescription: {
    fontSize: tokens.typography.sizes.sm,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    lineHeight: 20,
  },
  verificationNote: {
    marginTop: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.line,
  },
  verificationNoteText: {
    fontSize: tokens.typography.sizes.xs,
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.signal,
  },
  footer: {
    padding: tokens.spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? tokens.spacing.xl : tokens.spacing['2xl'],
    backgroundColor: tokens.colors.paper,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.line,
  },
  primaryButton: {
    backgroundColor: tokens.colors.signal,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: tokens.colors.muted,
    opacity: 0.5,
  },
  primaryButtonText: {
    color: tokens.colors.white,
    fontSize: tokens.typography.sizes.base,
    fontFamily: tokens.typography.fonts.displayBold,
  },
});
