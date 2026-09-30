import React, { useState, useMemo } from 'react';

import {
  View,
  StyleSheet,
  FlatList,
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
import { softDeleteSite } from '@/services/sites';
import { ConfirmDeleteDialog } from '@/components/actions/ConfirmDeleteDialog';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, IconSizes } from '@/constants/theme';

type FilterOption = 'All' | SiteType;

export default function SitesListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const { sites, loading, refreshing, error, onRefresh, refetch } = useSites();

  // Card action states
  const [siteToDelete, setSiteToDelete] = useState<SiteItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deletedSiteName, setDeletedSiteName] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);


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

  const handleEditSite = (site: SiteItem) => {
    router.push({ pathname: '/(app)/sites/edit', params: { id: site.id } });
  };

  const handleDeleteSitePress = (site: SiteItem) => {
    setSiteToDelete(site);
  };

  const handleConfirmDelete = async () => {
    if (!siteToDelete) return;
    setIsDeleting(true);
    const siteName = siteToDelete.name;
    try {
      await softDeleteSite(siteToDelete.id);
      setIsDeleting(false);
      setSiteToDelete(null);
      setDeletedSiteName(siteName);
      setShowDeleteSuccess(true);
    } catch (err) {
      setIsDeleting(false);
      const msg = err instanceof Error ? err.message : 'Failed to delete site.';
      setDeleteError(msg);
    }
  };

  const handleAddSitePress = () => {
    router.push('/(app)/sites/add');
  };

  return (
    <ScreenWrapper>
      <ScreenHeader
        title="Sites"
        subtitle={sites.length > 0 ? `${sites.length} Active Projects` : "Manage your construction projects"}
        actionButton={
          <View style={{ width: 120 }}>
            <Button
              title="Add Site"
              onPress={handleAddSitePress}
              icon={<Plus size={IconSizes.sm} color={Colors.light.surface} strokeWidth={2.5} />}
              style={{ height: 40 }}
            />
          </View>
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
        <View style={styles.loadingContainer}>
          <LoadingSkeleton type="card" height={180} />
          <LoadingSkeleton type="card" height={180} />
          <LoadingSkeleton type="card" height={180} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <ErrorState 
            title="Unable to load sites" 
            message={error} 
            onRetry={refetch} 
          />
        </View>
      ) : (
        /* Sites List */
        <FlatList
          data={filteredSites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <SiteCard
                site={item}
                onPress={handleSitePress}
                onEdit={handleEditSite}
                onDelete={handleDeleteSitePress}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.light.primary}
              colors={[Colors.light.primary]}
            />
          }
          ListEmptyComponent={() => (
            <EmptyState
              title={sites.length === 0 ? 'No sites added yet' : 'No sites found'}
              description={sites.length === 0
                ? 'Tap "Add Site" above to register your first project.'
                : 'Try adjusting your search or filters.'}
              actionLabel={sites.length === 0 ? "Add Site" : undefined}
              onAction={sites.length === 0 ? handleAddSitePress : undefined}
            />
          )}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        visible={!!siteToDelete}
        title="Delete Site?"
        message={
          siteToDelete
            ? `Are you sure you want to delete "${siteToDelete.name}"? Project records, materials, and expenses for this site will be archived.`
            : ''
        }
        confirmText="Delete Site"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setSiteToDelete(null);
        }}
      />

      {/* Delete Success Dialog */}
      <SuccessDialog
        visible={showDeleteSuccess}
        title="Site Deleted"
        message={`"${deletedSiteName || 'Site'}" has been successfully archived.`}
        buttonText="Done"
        onClose={() => setShowDeleteSuccess(false)}
      />

      {/* Delete Error Dialog */}
      <ErrorDialog
        visible={!!deleteError}
        title="Delete Failed"
        message={deleteError ?? 'An unexpected error occurred while deleting the site.'}
        onClose={() => setDeleteError(null)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  centerContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'] * 2,
  },
  cardContainer: {
    marginBottom: Spacing.md,
  },
});
