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
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }

    setIsSaving(true);
    
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('Success', 'Password has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() }
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
          <Text style={styles.label}>CURRENT PASSWORD</Text>
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
          <Text style={styles.label}>NEW PASSWORD</Text>
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
          <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
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
            {isSaving ? 'Updating...' : 'Update Password'}
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
