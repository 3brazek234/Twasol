import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Bookmark, Trash2, ArrowRight } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { useSavedSearches, useDeleteSavedSearch } from '../../hooks/useSavedSearches';

export const SavedSearchesScreen = ({ navigation }: any) => {
  const { data: savedSearches, isLoading } = useSavedSearches();
  const { mutate: deleteSearch } = useDeleteSavedSearch();

  const handleSelect = (search: any) => {
    navigation.navigate('JobsFeed', search.criteria);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)}>
      <View style={styles.iconContainer}>
        <Bookmark size={20} color={tokens.colors.signal} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('ar-EG')}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteBtn} 
        onPress={() => deleteSearch(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Trash2 size={20} color={tokens.colors.crimson} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowRight size={24} color={tokens.colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>عمليات البحث المحفوظة</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={tokens.colors.signal} />
        </View>
      ) : savedSearches?.length === 0 ? (
        <View style={styles.empty}>
          <Bookmark size={48} color={tokens.colors.line} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>لا توجد عمليات بحث محفوظة</Text>
          <Text style={styles.emptyText}>
            يمكنك حفظ فلاتر البحث الخاصة بك للوصول إليها بسرعة لاحقاً.
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedSearches}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
  },
  backBtn: {
    padding: tokens.spacing.xs,
  },
  title: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: tokens.typography.sizes.lg,
    color: tokens.colors.ink,
  },
  list: {
    padding: tokens.spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.colors.signal + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.ink,
    marginBottom: 4,
    textAlign: 'left',
  },
  date: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.muted,
    textAlign: 'left',
  },
  deleteBtn: {
    padding: tokens.spacing.xs,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing['2xl'],
  },
  emptyTitle: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: tokens.typography.sizes.lg,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.sm,
  },
  emptyText: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.muted,
    textAlign: 'center',
  },
});
