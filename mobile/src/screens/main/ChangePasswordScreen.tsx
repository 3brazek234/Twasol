import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { tokens } from '../../theme/tokens';

export const ChangePasswordScreen = ({ navigation }: any) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('خطأ', 'يرجى تعبئة جميع الحقول.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور الجديدة غير متطابقة.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('خطأ', 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
      return;
    }

    setIsSaving(true);
    
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('نجاح', 'تم تحديث كلمة المرور.', [
        { text: 'موافق', onPress: () => navigation.goBack() }
      ]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>كلمة المرور الحالية</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="••••••••"
            secureTextEntry
            placeholderTextColor={tokens.colors.muted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>كلمة المرور الجديدة</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="••••••••"
            secureTextEntry
            placeholderTextColor={tokens.colors.muted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>تأكيد كلمة المرور الجديدة</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            secureTextEntry
            placeholderTextColor={tokens.colors.muted}
          />
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
});
