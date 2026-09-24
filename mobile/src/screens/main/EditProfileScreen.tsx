import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useAuthStore } from '../../stores/authStore';
import { usersApi } from '../../api/users.api';

export const EditProfileScreen = ({ navigation }: any) => {
  const { user, setUser, submitVerification } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [barNumber, setBarNumber] = useState(user?.barNumber || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      await usersApi.updateProfile({ name, email, barNumber });

      if (user) {
        setUser({ ...user, name, email, barNumber });
      }
      
      // If verified and they change their bar number, reset verification
      if (user?.verificationStatus === 'APPROVED' && barNumber !== user?.barNumber) {
        Alert.alert(
          'إعادة التوثيق مطلوبة', 
          'لأنك قمت بتغيير رقم العضوية، يجب عليك توثيق حسابك مرة أخرى قبل أن تتمكن من تقديم العروض.',
          [{ text: 'مفهوم' }]
        );
        submitVerification('UNVERIFIED');
      }

      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ', 'تعذر حفظ التغييرات.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{flex:1}} 
       
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer scroll={true}>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>الاسم الكامل</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={tokens.colors.muted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={tokens.colors.muted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>رقم العضوية</Text>
          <TextInput
            style={styles.input}
            value={barNumber}
            onChangeText={setBarNumber}
            placeholder="Bar Number"
            placeholderTextColor={tokens.colors.muted}
          />
          {user?.verificationStatus === 'APPROVED' && (
            <Text style={styles.helpText}>
              تنبيه: تعديل رقم العضوية سيلغي توثيق حسابك حتى تتم المراجعة مرة أخرى.
            </Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Text>
        </TouchableOpacity>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
  },
  content: {
    padding: tokens.spacing.lg,
  },
  formGroup: {
    marginBottom: tokens.spacing.lg,
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
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: 12,
    padding: tokens.spacing.md,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.body,
  },
  helpText: {
    marginTop: tokens.spacing.sm,
    fontSize: tokens.typography.sizes.xs,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.docket,
  },
  saveButton: {
    backgroundColor: tokens.colors.signal,
    paddingVertical: tokens.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: tokens.spacing.lg,
  },
  saveButtonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.bold,
    fontSize: tokens.typography.sizes.base,
  },
  courtsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  courtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.paper,
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  courtChipSelected: {
    backgroundColor: tokens.colors.signal,
    borderColor: tokens.colors.signal,
  },
  courtChipText: {
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.ink,
  },
  courtChipTextSelected: {
    color: tokens.colors.white,
  },
});
