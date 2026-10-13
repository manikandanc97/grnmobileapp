import { EntityActionMenu } from '@/components/actions/EntityActionMenu';
import { UiStyles } from '@/constants/uiStyles';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import {
  Plus,
  Boxes,
  MapPin,
} from 'lucide-react-native';

import { MaterialItem } from '@/types/dashboard';
import { useMaterials } from '@/hooks/useMaterials';
import { useMasterData } from '@/hooks/useMasterData';
import { softDeleteMaterial } from '@/services/materials';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ConfirmDeleteDialog } from '@/components/actions/ConfirmDeleteDialog';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { Money } from '@/components/ui/Money';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';

import { SelectField } from '@/components/ui/SelectField';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { NoInternetScreen } from '@/components/ui/NoInternetScreen';
import { parseAppError } from '@/lib/errorHandler';
import { StatusBadge } from '@/components/ui/StatusBadge';

import { Colors, Spacing, Typography, Radius, Shadows, IconSizes, TouchTargets } from '@/constants/theme';

export default function MaterialsScreen() {
  const { siteId } = useLocalSearchParams<{ siteId?: string }>();
  if (!siteId) return <Redirect href="/(app)/sites" />;
  return <SiteMaterialsScreen key={siteId} siteId={siteId} />;
}

function SiteMaterialsScreen({ siteId }: { siteId: string }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { categories } = useMasterData();
  const allCategories = useMemo(() => ['All', ...categories], [categories]);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const { materials, loading, refreshing, error, isOffline, isCached, lastUpdated, onRefresh, refetch } = useMaterials(siteId);

  // Card action states
  const [materialToDelete, setMaterialToDelete] = useState<MaterialItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deletedMaterialName, setDeletedMaterialName] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleEditMaterial = (material: MaterialItem) => {
    router.push({ pathname: '/(app)/materials/edit', params: { id: material.id } } as never);
  };

  const handleDeleteMaterialPress = (material: MaterialItem) => {
    setMaterialToDelete(material);
  };

  const handleConfirmDelete = async () => {
    if (!materialToDelete) return;
    setIsDeleting(true);
    const materialName = materialToDelete.name;
    try {
      await softDeleteMaterial(materialToDelete.id);
      setIsDeleting(false);
      setMaterialToDelete(null);
      setDeletedMaterialName(materialName);
      setShowDeleteSuccess(true);
    } catch (err) {
      setIsDeleting(false);
      const msg = err instanceof Error ? err.message : 'Failed to delete material.';
      setDeleteError(msg);
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesCategory = activeCategory === 'All' || material.category === activeCategory;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        material.name.toLowerCase().includes(searchLower) ||
        material.siteName.toLowerCase().includes(searchLower) ||
        material.category.toLowerCase().includes(searchLower);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory, materials]);

  const summary = useMemo(() => {
    const total = materials.length;
    const lowStock = materials.filter((m) => m.status === 'Low Stock').length;
    const pending = materials.filter((m) => m.status === 'Pending').length;
    return { total, lowStock, pending };
  }, [materials]);

  const renderSummaryCards = () => {
    if (siteId || loading || error || materials.length === 0) return null;
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.compactSummary}>
          <Boxes size={18} color={Colors.light.brand} />
          <Text style={styles.compactSummaryText}>{summary.total} materials</Text>
          {summary.lowStock > 0 && <Text style={styles.stockAlert}>{summary.lowStock} low stock</Text>}
          {summary.pending > 0 && <Text style={styles.stockAlert}>{summary.pending} pending</Text>}
        </View>
      </View>
    );
  };

  const renderMaterialCard = ({ item }: { item: MaterialItem }) => (
    <Pressable
      style={({ pressed }) => [styles.materialCard, pressed && styles.materialCardPressed]}
      onPress={() => router.push(`/(app)/materials/${item.id}` as any)}
    >
      <View style={styles.materialHeader}>
        <View style={styles.materialHeaderInfo}>
          <Text style={styles.materialName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.categorySiteRow}>
            <Text style={styles.materialCategory}>{item.category}</Text>
            <Text style={styles.bulletSeparator}>•</Text>
            <View style={styles.siteLocationWrapper}>
              <MapPin size={12} color={Colors.light.textSecondary} />
              <Text style={styles.siteLocationText} numberOfLines={1}>{item.siteName}</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}><StatusBadge status={item.status} /><EntityActionMenu accessibilityLabel={`Actions for ${item.name}`} onEdit={() => handleEditMaterial(item)} onDelete={() => handleDeleteMaterialPress(item)} /></View>
      </View>

      <View style={styles.financialRow}>
        <View style={styles.financialCol}>
          <Text style={styles.financialLabel}>Stock</Text>
          <View style={styles.quantityBox}>
            <Text style={styles.quantityValue}>{item.quantity.toLocaleString()}</Text>
            <Text style={styles.quantityUnit}>{item.unit}</Text>
          </View>
        </View>

        <View style={styles.financialCol}>
          <Text style={styles.financialLabel}>Unit Rate</Text>
          <Text style={styles.rateValue}>
            <Money amount={item.unitPrice} />
            <Text style={styles.rateUnit}>/{item.unit}</Text>
          </Text>
        </View>

        <View style={[styles.financialCol, styles.financialColRight]}>
          <Text style={styles.financialLabel}>Total Cost</Text>
          <Money amount={item.totalCost} style={styles.totalCostValue} />
        </View>
      </View>

    </Pressable>
  );

  return (
    <ScreenWrapper>
      {/* Header */}
      <ScreenHeader
        title="Materials"
        subtitle={siteId ? 'Materials for selected site' : 'Track materials across your sites'}
        showBack
        actionButton={siteId ?
          <View style={{ width: 150 }}>
            <Button
              title="Add Material"
              onPress={() =>
                router.push(
                  { pathname: '/(app)/materials/add', params: { siteId } }
                )
              }
              icon={<Plus size={IconSizes.sm} color={Colors.light.surface} strokeWidth={2.5} />}
              style={{ height: 40 }}
            />
          </View> : undefined
        }
      />

      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search materials..."
          onClear={() => setSearchQuery('')}
          style={styles.searchBar}
        />
        <SelectField
          value={activeCategory}
          options={allCategories.map(c => ({ label: c === 'All' ? 'All categories' : c, value: c }))}
          onChange={setActiveCategory}
          placeholder="Filter by Category"
        />
      </View>

      {/* Loading and Error States */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <LoadingSkeleton type="card" height={160} />
          <LoadingSkeleton type="card" height={160} />
          <LoadingSkeleton type="card" height={160} />
        </View>
      ) : error && materials.length === 0 ? (
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
          <FlatList
            data={filteredMaterials}
            keyExtractor={(item) => item.id}
            renderItem={renderMaterialCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderSummaryCards}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.light.primary}
                colors={[Colors.light.primary]}
              />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <EmptyState
                  icon={<Boxes size={48} color={Colors.light.textMuted} />}
                  title={materials.length === 0 ? "No materials yet" : "No materials found"}
                  description={materials.length === 0
                    ? (siteId ? "Add materials for this site." : "Open a site to add materials.")
                    : "Try adjusting your search or category filters."}
                  actionLabel={materials.length === 0 ? (siteId ? "Add Material" : "Open Sites") : "Clear Filters"}
                  onAction={materials.length === 0 ? () => siteId ? router.push({ pathname: '/(app)/materials/add', params: { siteId } }) : router.push('/(app)/sites') : () => { setSearchQuery(''); setActiveCategory('All'); }}
                />
              </View>
            )}
          />
        </>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        visible={!!materialToDelete}
        title="Delete Material?"
        message={
          materialToDelete
            ? `Are you sure you want to delete "${materialToDelete.name}"? This item will be removed from project inventory.`
            : ''
        }
        confirmText="Delete Material"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setMaterialToDelete(null);
        }}
      />

      {/* Delete Success Dialog */}
      <SuccessDialog
        visible={showDeleteSuccess}
        title="Material Deleted"
        message={`"${deletedMaterialName || 'Material'}" has been successfully removed from inventory.`}
        buttonText="Done"
        onClose={() => setShowDeleteSuccess(false)}
      />

      {/* Delete Error Dialog */}
      <ErrorDialog
        visible={!!deleteError}
        title="Delete Failed"
        message={deleteError ?? 'An unexpected error occurred while deleting material.'}
        onClose={() => setDeleteError(null)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  compactSummary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  compactSummaryText: { fontSize: 14, color: Colors.light.text, fontWeight: '600' },
  stockAlert: { fontSize: 13, color: Colors.light.warning },
  loadingContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  centerContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing['2xl'],
  },
  searchSection: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  searchBar: {
    marginBottom: Spacing.md,
  },
  categoriesContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  summaryContainer: {
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xs,
  },
  summaryScroll: {
    gap: Spacing.md,
  },
  summaryCard: {
    ...UiStyles.card,
    width: 140,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
    letterSpacing: -0.4,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  materialCard: {
    ...UiStyles.card,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  materialCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  materialHeaderInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  materialName: {
    ...Typography.cardTitle,
    color: Colors.light.text,
    marginBottom: 2,
  },
  categorySiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  materialCategory: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  bulletSeparator: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  siteLocationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  siteLocationText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.background,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  financialCol: {
    flex: 1,
  },
  financialColRight: {
    alignItems: 'flex-end',
  },
  financialLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.textMuted,
    textTransform: 'none',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  quantityValue: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  quantityUnit: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textMuted,
  },
  rateValue: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
  },
  rateUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  totalCostValue: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.brand,
  },
  materialFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    minHeight: TouchTargets.min,
  },
  actionPillPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  editPill: {
    backgroundColor: Colors.light.primaryBg,
    borderColor: 'transparent',
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  deletePill: {
    backgroundColor: Colors.light.errorBg,
    borderColor: 'transparent',
  },
  deletePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.error,
  },
});
