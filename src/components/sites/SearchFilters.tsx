import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SiteType } from '@/types/dashboard';
import { SearchBar } from '@/components/ui/SearchBar';
import { SelectField } from '@/components/ui/SelectField';
import { Colors, Spacing } from '@/constants/theme';

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
      <SelectField
        value={activeFilter}
        options={FILTERS.map(f => ({ label: f, value: f }))}
        onChange={(val) => onFilterChange(val as FilterOption)}
        placeholder="Filter by Type"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.background,
  },
  searchBar: {
    marginBottom: Spacing.md,
  },
  filtersContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg, // To ensure last item isn't flush with screen edge on scroll
  },
});
