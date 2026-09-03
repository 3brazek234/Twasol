import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { Search, Plus } from 'lucide-react-native';

export const HiringHomeScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>طلباتي المنشورة</Text>
          <TouchableOpacity 
            style={styles.findBtn}
            onPress={() => navigation.navigate('FindLawyers')}
          >
            <Search size={16} color={tokens.colors.signal} style={{ marginEnd: 6 }} />
            <Text style={styles.findBtnText}>البحث عن محامين</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>لا توجد طلبات نشطة</Text>
          <Text style={styles.emptyDesc}>انشر طلباً أو ابحث عن محامين مباشرةً لتغطية جلسة قضائية.</Text>
          <TouchableOpacity 
            style={styles.postBtn}
            onPress={() => navigation.navigate('PostJob')}
          >
            <Plus size={20} color={tokens.colors.white} style={{ marginEnd: 8 }} />
            <Text style={styles.postBtnText}>نشر طلب جديد</Text>
          </TouchableOpacity>
        </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  title: {
    fontSize: tokens.typography.sizes.xl,
    fontFamily: tokens.typography.fonts.display,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
  },
  findBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 111, 94, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  findBtnText: {
    color: tokens.colors.signal,
    fontWeight: tokens.typography.weights.bold,
    fontSize: tokens.typography.sizes.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.sm,
  },
  emptyDesc: {
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.muted,
    textAlign: 'center',
    marginBottom: tokens.spacing.xl,
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.signal,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    borderRadius: 8,
  },
  postBtnText: {
    color: tokens.colors.white,
    fontWeight: tokens.typography.weights.bold,
    fontSize: tokens.typography.sizes.base,
  },
});
