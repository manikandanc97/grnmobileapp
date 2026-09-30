import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Plus,
  Boxes,
  AlertTriangle,
  Truck,
  CalendarClock,
  Pencil,
  Trash2,
  MapPin,
} from 'lucide-react-native';

import { isDateInCurrentMonth } from '@/lib/dateUtils';
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
import { FilterButton } from '@/components/ui/FilterButton';
import { SelectField } from '@/components/ui/SelectField';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';

import { Colors, Spacing, Typography, Radius, Shadows, IconSizes, TouchTargets } from '@/constants/theme';

export default function MaterialsScreen() {
  const { siteId } = useLocalSearchParams<{ siteId?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { categories } = useMasterData();
  const allCategories = useMemo(() => ['All', ...categories], [categories]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  const { materials, loading, refreshing, error, onRefresh, refetch } = useMaterials(siteId);

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
    const thisMonth = materials.filter((m) => isDateInCurrentMonth(m.lastUpdated)).length;
    return { total, lowStock, pending, thisMonth };
  }, [materials]);

  const renderSummaryCards = () => {
    if (siteId || loading || error || materials.length === 0) return null;
    return (
      <View style={styles.summaryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScroll}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: Colors.light.infoBg }]}>
              <Boxes size={IconSizes.sm} color={Colors.light.info} />
            </View>
            <Text style={styles.summaryValue}>{summary.total}</Text>
            <Text style={styles.summaryLabel}>Total Materials</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: Colors.light.errorBg }]}>
              <AlertTriangle size={IconSizes.sm} color={Colors.light.error} />
            </View>
            <Text style={styles.summaryValue}>{summary.lowStock}</Text>
            <Text style={styles.summaryLabel}>Low Stock</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: Colors.light.warningBg }]}>
              <Truck size={IconSizes.sm} color={Colors.light.warning} />
            </View>
            <Text style={styles.summaryValue}>{summary.pending}</Text>
            <Text style={styles.summaryLabel}>Pending Delivery</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: Colors.light.successBg }]}>
              <CalendarClock size={IconSizes.sm} color={Colors.light.success} />
            </View>
            <Text style={styles.summaryValue}>{summary.thisMonth}</Text>
            <Text style={styles.summaryLabel}>This Month</Text>
          </View>
        </ScrollView>
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
        <StatusBadge status={item.status} />
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

      <View style={styles.materialFooter}>
        <View style={styles.cardActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${item.name}`}
            style={({ pressed }) => [
              styles.actionPill,
              styles.editPill,
              pressed && styles.actionPillPressed,
            ]}
            hitSlop={6}
            onPress={(e) => {
              e.stopPropagation();
              handleEditMaterial(item);
            }}
          >
            <Pencil size={12} color={Colors.light.primary} strokeWidth={2.4} />
            <Text style={styles.editPillText}>Edit</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.name}`}
            style={({ pressed }) => [
              styles.actionPill,
              styles.deletePill,
              pressed && styles.actionPillPressed,
            ]}
            hitSlop={6}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteMaterialPress(item);
            }}
          >
            <Trash2 size={12} color={Colors.light.error} strokeWidth={2.4} />
            <Text style={styles.deletePillText}>Delete</Text>
          </Pressable>
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
        actionButton={
          <View style={{ width: 150 }}>
            <Button
              title="Add Material"
              onPress={() => router.push('/(app)/materials/add')}
              icon={<Plus size={IconSizes.sm} color={Colors.light.surface} strokeWidth={2.5} />}
              style={{ height: 40 }}
            />
          </View>
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
          options={allCategories.map(c => ({ label: c, value: c }))}
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
      ) : error ? (
        <View style={styles.centerContainer}>
           <ErrorState 
             title="Unable to load materials" 
             message={error} 
             onRetry={refetch} 
           />
        </View>
      ) : (
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
                  ? "Add materials to start tracking construction inventory."
                  : "Try adjusting your search or category filters."}
                actionLabel={materials.length === 0 ? "Add Material" : "Clear Filters"}
                onAction={materials.length === 0 ? () => router.push('/(app)/materials/add') : () => { setSearchQuery(''); setActiveCategory('All'); }}
              />
            </View>
          )}
        />
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
    width: 140,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
    marginBottom: 2,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: Spacing['2xl'] * 2,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  materialCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
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
    textTransform: 'uppercase',
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
    fontWeight: '800',
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
    fontWeight: '800',
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
