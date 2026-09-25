import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Text,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { SiteType } from '@/types/dashboard';

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
      <View style={styles.searchContainer}>
        <Search size={20} color="#8A99A4" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sites by name or location..."
          placeholderTextColor="#8A99A4"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
      </View>
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
              onPress={() => onFilterChange(filter)}
              style={[
                styles.filterChip,
                isActive && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive && styles.filterTextActive,
                ]}
              >
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F354A',
    fontWeight: '500',
  },
  filtersContainer: {
    gap: 10,
    paddingRight: 20, // To ensure last item isn't flush with screen edge on scroll
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  filterChipActive: {
    backgroundColor: '#F2A619',
    borderColor: '#F2A619',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5C68',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
});
