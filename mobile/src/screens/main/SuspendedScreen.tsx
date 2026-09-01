import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SuspendedScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>حسابك موقوف</Text>
      <Text style={styles.subtitle}>تم إيقاف حسابك مؤقتاً. يرجى التواصل مع الدعم الفني.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F7F5F0' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center', color: '#8B2635' },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 24, textAlign: 'center' },
});
