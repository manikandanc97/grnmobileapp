import React, { useState, useMemo } from 'react';

import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SiteItem } from '@/types/dashboard';


import { SiteCard } from '@/components/dashboard/SiteCard';
import { SearchFilters, FilterOption } from '@/components/sites/SearchFilters';
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
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { NoInternetScreen } from '@/components/ui/NoInternetScreen';
import { parseAppError } from '@/lib/errorHandler';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, IconSizes } from '@/constants/theme';

export default function SitesListScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [userSelectedFilter, setUserSelectedFilter] = useState<FilterOption | null>(null);
  const [previousFilter, setPreviousFilter] = useState(filter);
  if (filter !== previousFilter) {
    setPreviousFilter(filter);
    setUserSelectedFilter(null);
  }

  const activeFilter: FilterOption = useMemo(() => {
    if (userSelectedFilter) return userSelectedFilter;
    if (filter && ['All', 'Active', 'On Hold', 'Completed', 'Residential', 'Commercial', 'Renovation'].includes(filter)) {
      return filter as FilterOption;
    }
    return 'All';
  }, [userSelectedFilter, filter]);

  const { sites, loading, refreshing, error, isOffline, isCached, lastUpdated, onRefresh, refetch } = useSites();

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

      let matchesFilter = true;
      if (activeFilter === 'Active') {
        matchesFilter = site.status !== 'Completed' && site.status !== 'On Hold';
      } else if (activeFilter === 'On Hold') {
        matchesFilter = site.status === 'On Hold';
      } else if (activeFilter === 'Completed') {
        matchesFilter = site.status === 'Completed';
      } else if (activeFilter !== 'All') {
        matchesFilter = site.type === activeFilter;
      }

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

  const activeCount = useMemo(
    () => sites.filter((s) => s.status !== 'Completed' && s.status !== 'On Hold').length,
    [sites]
  );

  return (
    <ScreenWrapper>
      <ScreenHeader
        title="Sites"
        subtitle={
          activeCount > 0
            ? `${activeCount} Active Project${activeCount === 1 ? '' : 's'}`
            : "Manage your construction projects"
        }
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
        onFilterChange={setUserSelectedFilter}
      />

      {/* Loading state on initial fetch */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <LoadingSkeleton type="card" height={180} />
          <LoadingSkeleton type="card" height={180} />
          <LoadingSkeleton type="card" height={180} />
        </View>
      ) : error && sites.length === 0 ? (
        (() => {
          const parsed = parseAppError(error);
          if (parsed.isNetworkError || isOffline) {
            return <NoInternetScreen onRetry={refetch} />;
          }
          return (
            <View style={styles.centerContainer}>
              <ErrorState
                title={parsed.title}
                message={parsed.message}
                onRetry={refetch}
              />
            </View>
          );
        })()
      ) : (
        <>
          {isCached && (
            <OfflineIndicator
              lastUpdated={lastUpdated}
              onRetry={onRefresh}
              style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.sm }}
            />
          )}
          {/* Sites List */}
          <FlatList
            data={filteredSites}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SiteCard
                site={item}
                onPress={handleSitePress}
              onEdit={handleEditSite}
              onDelete={handleDeleteSitePress}
            />
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
              actionLabel={sites.length === 0 ? "Add Site" : "Clear filters"}
              onAction={sites.length === 0 ? handleAddSitePress : () => { setSearchQuery(''); setUserSelectedFilter('All'); }}
            />
          )}
        />
        </>
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
    paddingBottom: Spacing.xl,
  },
});
