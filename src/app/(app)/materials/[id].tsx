import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  MapPin,
  Boxes,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Tag,
  CalendarClock,
  Banknote
} from 'lucide-react-native';

import { useMaterialDetails } from '@/hooks/useMaterials';
import { softDeleteMaterial } from '@/services/materials';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EntityActionMenu } from '@/components/actions/EntityActionMenu';
import { ConfirmDeleteDialog } from '@/components/actions/ConfirmDeleteDialog';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Money } from '@/components/ui/Money';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';

import { Colors, Spacing, Typography, Radius, Shadows, IconSizes } from '@/constants/theme';

export default function MaterialDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { material, loading, error, refetch } = useMaterialDetails(id);

  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deletedMaterialName, setDeletedMaterialName] = React.useState('');
  const [isDeleted, setIsDeleted] = React.useState(false);

  const handleDeleteConfirm = async () => {
    if (!material) return;
    setIsDeleting(true);
    const matName = material.name;
    setDeletedMaterialName(matName);
    try {
      setIsDeleted(true);
      await softDeleteMaterial(material.id);
      setShowConfirmDelete(false);
      setIsDeleting(false);
      setShowDeleteSuccess(true);
    } catch (err) {
      setIsDeleting(false);
      setIsDeleted(false);
      const msg = err instanceof Error ? err.message : 'Failed to delete material.';
      setDeleteError(msg);
    }
  };

  const handleDeleteSuccessClose = () => {
    setShowDeleteSuccess(false);
    router.replace('/(app)/materials');
  };

  if (isDeleted && showDeleteSuccess) {
    return (
      <ScreenWrapper>
        <SuccessDialog
          visible={showDeleteSuccess}
          title="Material Removed"
          message={`"${deletedMaterialName || 'Material'}" has been successfully removed.`}
          buttonText="Done"
          onClose={handleDeleteSuccessClose}
        />
      </ScreenWrapper>
    );
  }

  if (loading) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Loading..." showBack />
        <View style={styles.loadingContainer}>
          <LoadingSkeleton type="card" height={100} />
          <LoadingSkeleton type="card" height={160} />
          <LoadingSkeleton type="card" height={140} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!material || error) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Error" showBack />
        <View style={styles.errorContainer}>
          <ErrorState 
            title={!material ? "Material not found" : "Unable to load material"} 
            message={error || "The requested material could not be found."} 
            onRetry={refetch} 
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* Header */}
      <ScreenHeader
        title={material.name}
        subtitle="Material Details"
        showBack
        actionButton={
          <EntityActionMenu
            onEdit={() => router.push({ pathname: '/(app)/materials/edit', params: { id: material.id } })}
            onDelete={() => setShowConfirmDelete(true)}
            editLabel="Edit Material"
            deleteLabel="Delete Material"
          />
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Identity Section */}
        <View style={styles.identitySection}>
          <View style={styles.identityHeader}>
            <StatusBadge status={material.status} />
            <Text style={styles.identityType}>{material.category}</Text>
          </View>
        </View>

        {/* Stock Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Summary</Text>
          <View style={styles.stockMainCard}>
            <View style={styles.stockMainHeader}>
               <Text style={styles.stockMainLabel}>Current Stock</Text>
               <View style={styles.stockIconBox}>
                 <Boxes size={IconSizes.md} color={Colors.light.brand} />
               </View>
            </View>
            <View style={styles.stockMainValueRow}>
              <Text style={styles.stockMainValue}>{material.quantity.toLocaleString()}</Text>
              <Text style={styles.stockMainUnit}>{material.unit}</Text>
            </View>
            
            <View style={styles.stockDivider} />
            
            <View style={styles.stockSubGrid}>
              <View style={styles.stockSubItem}>
                <View style={styles.stockSubHeader}>
                  <ArrowDownToLine size={IconSizes.sm} color={Colors.light.success} />
                  <Text style={styles.stockSubLabel}>Received</Text>
                </View>
                <View style={styles.stockSubValueRow}>
                  <Text style={styles.stockSubValue}>{material.received.toLocaleString()}</Text>
                  <Text style={styles.stockSubUnit}>{material.unit}</Text>
                </View>
              </View>

              <View style={styles.stockSubDivider} />

              <View style={styles.stockSubItem}>
                <View style={styles.stockSubHeader}>
                  <ArrowUpFromLine size={IconSizes.sm} color={Colors.light.error} />
                  <Text style={styles.stockSubLabel}>Used</Text>
                </View>
                <View style={styles.stockSubValueRow}>
                  <Text style={styles.stockSubValue}>{material.used.toLocaleString()}</Text>
                  <Text style={styles.stockSubUnit}>{material.unit}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Cost Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Summary</Text>
          <View style={styles.costGrid}>
            <View style={styles.costItem}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.light.infoBg }]}>
                <Tag size={IconSizes.sm} color={Colors.light.info} />
              </View>
              <View style={styles.costTextWrap}>
                <Text style={styles.costLabel}>Unit Rate</Text>
                <Text style={styles.costValueRow}>
                  <Money amount={material.unitPrice} style={styles.costValue} />
                  <Text style={styles.costUnit}>/{material.unit}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.costItem}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.light.successBg }]}>
                <Banknote size={IconSizes.sm} color={Colors.light.success} />
              </View>
              <View style={styles.costTextWrap}>
                <Text style={styles.costLabel}>Total Cost</Text>
                <Money amount={material.totalCost} style={styles.costTotalValue} />
              </View>
            </View>
          </View>
        </View>

        {/* Project Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MapPin size={IconSizes.sm} color={Colors.light.textSecondary} style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Site Assignment</Text>
                <Text style={styles.infoValue}>{material.siteName}</Text>
              </View>
            </View>
            
            <View style={styles.infoDivider} />
            
            <View style={styles.infoRow}>
              <CalendarClock size={IconSizes.sm} color={Colors.light.textSecondary} style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>{material.lastUpdated}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity Mock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIconBox, { backgroundColor: Colors.light.successBg }]}>
                <ArrowDownToLine size={IconSizes.sm} color={Colors.light.success} />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Material Received</Text>
                <Text style={styles.activitySubtitle}>Supplier Delivery</Text>
              </View>
              <View style={styles.activityRight}>
                <Text style={[styles.activityAmount, { color: Colors.light.success }]}>
                  +{(material.quantity * 0.2).toFixed(1)} {material.unit}
                </Text>
                <Text style={styles.activityTime}>{material.lastUpdated}</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIconBox, { backgroundColor: Colors.light.errorBg }]}>
                <ArrowUpFromLine size={IconSizes.sm} color={Colors.light.error} />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Material Used</Text>
                <Text style={styles.activitySubtitle}>Construction site {material.siteName}</Text>
              </View>
              <View style={styles.activityRight}>
                <Text style={[styles.activityAmount, { color: Colors.light.error }]}>
                  -{(material.quantity * 0.1).toFixed(1)} {material.unit}
                </Text>
                <Text style={styles.activityTime}>Yesterday</Text>
              </View>
            </View>

            <View style={[styles.activityItem, { borderBottomWidth: 0 }]}>
              <View style={[styles.activityIconBox, { backgroundColor: Colors.light.infoBg }]}>
                <Activity size={IconSizes.sm} color={Colors.light.info} />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Stock Checked</Text>
                <Text style={styles.activitySubtitle}>By Site Supervisor</Text>
              </View>
              <View style={styles.activityRight}>
                <Text style={styles.activityTime}>3 days ago</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmDeleteDialog
        visible={showConfirmDelete}
        title="Delete Material?"
        message={`Are you sure you want to remove "${material.name}"?\nThis material record will no longer appear in the active inventory, but usage history will be safely preserved.`}
        confirmText="Delete Material"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* Success Feedback Dialog */}
      <SuccessDialog
        visible={showDeleteSuccess}
        title="Material Removed"
        message={`"${deletedMaterialName || 'Material'}" has been successfully removed.`}
        buttonText="Done"
        onClose={handleDeleteSuccessClose}
      />

      {/* Error Dialog */}
      <ErrorDialog
        visible={Boolean(deleteError)}
        message={deleteError || 'Failed to delete material.'}
        onClose={() => setDeleteError(null)}
        onRetry={handleDeleteConfirm}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  identitySection: {
    marginBottom: Spacing.xl,
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  identityType: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  stockMainCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  stockMainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stockMainLabel: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  stockIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockMainValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  stockMainValue: {
    ...Typography.display,
    color: Colors.light.text,
  },
  stockMainUnit: {
    ...Typography.cardTitle,
    color: Colors.light.textSecondary,
  },
  stockDivider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginVertical: Spacing.lg,
  },
  stockSubGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockSubItem: {
    flex: 1,
  },
  stockSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  stockSubLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  stockSubValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  stockSubValue: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
  },
  stockSubUnit: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  stockSubDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.light.borderSubtle,
    marginHorizontal: Spacing.md,
  },
  costGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  costItem: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  costTextWrap: {
    flex: 1,
  },
  costLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  costValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  costValue: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
  },
  costUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  costTotalValue: {
    ...Typography.cardTitle,
    color: Colors.light.brand,
  },
  infoCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.lg,
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  infoIcon: {
    marginRight: Spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
  activityContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
    paddingHorizontal: Spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  activitySubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    ...Typography.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  activityTime: {
    ...Typography.caption,
    color: Colors.light.textMuted,
  },
});
