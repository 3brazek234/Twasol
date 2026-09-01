import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { FilterChipRow } from '../../components/FilterChipRow';
import { LawyerCard, LawyerData } from '../../components/LawyerCard';
import { Search, ShieldAlert } from 'lucide-react-native';

// Stub data for now since we haven't wired up React Query for this endpoint yet
const MOCK_LAWYERS: LawyerData[] = [
  {
    id: 'l1',
    name: 'Harvey Specter',
    isVerified: true,
    averageRating: 4.9,
    reviewCount: 42,
    isActive: true,
    courts: ['NY Supreme', 'SDNY'],
  },
  {
    id: 'l2',
    name: 'Mike Ross',
    isVerified: false,
    averageRating: 4.5,
    reviewCount: 15,
    isActive: false,
    courts: ['NY Supreme'],
  }
];

export const FindLawyersScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourt, setSelectedCourt] = useState<string | undefined>();

  const courtOptions = [
    { label: 'All Courts', value: undefined },
    { label: 'NY Supreme', value: 'ny_supreme' },
    { label: 'SDNY', value: 'sdny' },
  ];

  const filteredLawyers = MOCK_LAWYERS.filter(l => {
    if (searchQuery && !l.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Search size={20} color={tokens.colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search lawyers by name..."
            placeholderTextColor={tokens.colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <FilterChipRow 
          options={courtOptions} 
          selectedValue={selectedCourt} 
          onSelect={setSelectedCourt} 
        />
      </View>

      <FlatList
        data={filteredLawyers}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <LawyerCard 
            lawyer={item} 
            onPress={() => navigation.navigate('LawyerProfile', { lawyerId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ShieldAlert size={48} color={tokens.colors.line} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No verified lawyers match these filters yet.</Text>
            <Text style={styles.emptyDesc}>Try widening your search.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
  },
  searchHeader: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
    backgroundColor: tokens.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.paper,
    borderRadius: 12,
    paddingHorizontal: tokens.spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  searchIcon: {
    marginEnd: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: tokens.typography.sizes.base,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.ink,
  },
  filtersContainer: {
    backgroundColor: tokens.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
    paddingBottom: tokens.spacing.sm,
  },
  listContent: {
    padding: tokens.spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.xs,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.muted,
    textAlign: 'center',
  },
});
