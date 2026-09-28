import React, { useState, useMemo } from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { SiteItem, SiteType } from '@/types/dashboard';


import { SiteCard } from '@/components/dashboard/SiteCard';
import { SearchFilters } from '@/components/sites/SearchFilters';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useSites } from '@/hooks/useSites';

type FilterOption = 'All' | SiteType;

export default function SitesListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const { sites, loading, refreshing, error, onRefresh, refetch } = useSites();


  // Filter the real Supabase sites based on search query (name, location, type) and filter chip
  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        site.name.toLowerCase().includes(query) ||
        site.location.toLowerCase().includes(query) ||
        site.type.toLowerCase().includes(query);
      
      const matchesFilter =
        activeFilter === 'All' || site.type === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [sites, searchQuery, activeFilter]);

  const handleSitePress = (site: SiteItem) => {
    router.push({ pathname: '/(app)/sites/[id]', params: { id: site.id } });
  };

  const handleAddSitePress = () => {
    router.push('/(app)/sites/add');
  };

  return (
    <ScreenWrapper>
      <ScreenHeader
        title="Sites"
        subtitle="Manage your construction projects"
        actionButton={
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={handleAddSitePress}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Add Site</Text>
          </Pressable>
        }
      />

      {/* Search & Filters */}
      <SearchFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Loading state on initial fetch */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F2A619" />
          <Text style={styles.loadingText}>Loading sites...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Unable to load sites</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        /* Sites List */
        <FlatList
          data={filteredSites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <SiteCard site={item} onPress={handleSitePress} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F2A619"
              colors={['#F2A619']}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {sites.length === 0 ? 'No sites added yet' : 'No sites found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {sites.length === 0
                  ? 'Tap "Add Site" above to register your first project.'
                  : 'Try adjusting your search or filters.'}
              </Text>
            </View>
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2A619',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#F2A619',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  cardContainer: {
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7A85',
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7A85',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F2A619',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8A99A4',
    textAlign: 'center',
  },
});
