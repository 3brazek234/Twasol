import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { tokens } from '../../theme/tokens';
import { Briefcase, Users, Layers } from 'lucide-react-native';

export const AccountModeScreen = ({ navigation }: any) => {
  const { updateAccountMode } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<'GIG' | 'HIRING' | 'BOTH' | null>(null);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await updateAccountMode(selected);
      navigation.navigate('VerificationIntro');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const options = [
    { id: 'GIG', label: 'Looking for work', icon: <Briefcase size={24} color={selected === 'GIG' ? tokens.colors.signal : tokens.colors.muted} />, desc: 'Find and apply to court appearances and gig work.' },
    { id: 'HIRING', label: 'Posting work', icon: <Users size={24} color={selected === 'HIRING' ? tokens.colors.signal : tokens.colors.muted} />, desc: 'Hire other lawyers to cover your appearances.' },
    { id: 'BOTH', label: 'Both', icon: <Layers size={24} color={selected === 'BOTH' ? tokens.colors.signal : tokens.colors.muted} />, desc: 'I want to do both.' },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>How will you use the app?</Text>
        <Text style={styles.subtitle}>You can always change this later in settings.</Text>

        <View style={styles.optionsContainer}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.optionCard,
                selected === opt.id && styles.optionCardSelected
              ]}
              onPress={() => setSelected(opt.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                {opt.icon}
                <Text style={[styles.optionLabel, selected === opt.id && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
              </View>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.continueBtn, (!selected || loading) && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selected || loading}
        >
          {loading ? (
            <ActivityIndicator color={tokens.colors.white} />
          ) : (
            <Text style={styles.continueText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
  },
  content: {
    flex: 1,
    padding: tokens.spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: tokens.typography.sizes.xxl,
    fontFamily: tokens.typography.fonts.display,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.sm,
  },
  subtitle: {
    fontSize: tokens.typography.sizes.base,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    marginBottom: tokens.spacing.xxl,
  },
  optionsContainer: {
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xxl,
  },
  optionCard: {
    padding: tokens.spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: tokens.colors.line,
    backgroundColor: tokens.colors.white,
  },
  optionCardSelected: {
    borderColor: tokens.colors.signal,
    backgroundColor: 'rgba(47, 111, 94, 0.04)',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  optionLabel: {
    fontSize: tokens.typography.sizes.lg,
    fontFamily: tokens.typography.fonts.display,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
    marginStart: tokens.spacing.md,
  },
  optionLabelSelected: {
    color: tokens.colors.signal,
  },
  optionDesc: {
    fontSize: tokens.typography.sizes.sm,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    lineHeight: 20,
  },
  continueBtn: {
    backgroundColor: tokens.colors.signal,
    paddingVertical: tokens.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueText: {
    color: tokens.colors.white,
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
  },
});
