import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
} from 'react-native';
import { SiteType } from '@/types/dashboard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Colors, Spacing, Radius } from '@/constants/theme';

type FilterOption = 'All' | SiteType;

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

const FILTERS: FilterOption[] = ['All', 'Residential', 'Commercial', 'Renovation'];

export function SearchFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
}: SearchFiltersProps) {
  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder="Search sites by name or location..."
        onClear={() => onSearchChange('')}
        style={styles.searchBar}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              style={({ pressed }) => [
                styles.chip,
                isActive && styles.activeChip,
                pressed && styles.chipPressed,
              ]}
              onPress={() => onFilterChange(filter)}
            >
              <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: '#F8FAFC',
  },
  searchBar: {
    marginBottom: Spacing.sm,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    paddingRight: Spacing.lg,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  activeChip: {
    backgroundColor: Colors.light.brand,
    borderColor: Colors.light.brand,
    elevation: 2,
    shadowColor: Colors.light.brand,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chipPressed: {
    opacity: 0.8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
