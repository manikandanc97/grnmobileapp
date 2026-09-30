import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  MapPin,
  Calendar,
  Users,
  CheckSquare,
  Package,
} from 'lucide-react-native';

import { useSiteDetails } from '@/hooks/useSites';
import { useMaterials } from '@/hooks/useMaterials';
import { useWorkers } from '@/hooks/useWorkers';
import { useAttendance } from '@/hooks/useAttendance';
import { useExpenses } from '@/hooks/useExpenses';
import { useSiteBudget } from '@/hooks/useSiteBudget';
import { softDeleteSite } from '@/services/sites';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EntityActionMenu } from '@/components/actions/EntityActionMenu';
import { ConfirmDeleteDialog } from '@/components/actions/ConfirmDeleteDialog';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { Money } from '@/components/ui/Money';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors, Spacing, Typography, Radius, Shadows, IconSizes, TouchTargets } from '@/constants/theme';

export default function SiteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { site, loading, error, refetch: refetchSite } = useSiteDetails(id);
  const { materials, loading: materialsLoading } = useMaterials(id);
  const { budgetSummary } = useSiteBudget(id);

  const today = useMemo(() => new Date(), []);
  const { workers: siteWorkersRaw } = useWorkers(id);
  const { attendanceMap } = useAttendance(today);
  const { expenses: siteExpenses } = useExpenses(id);

  const siteWorkerCount = siteWorkersRaw.length;
  const presentWorkers = useMemo(
    () => siteWorkersRaw.filter((w) => attendanceMap.get(w.id)?.status === 'Present').length,
    [siteWorkersRaw, attendanceMap],
  );
  const absentWorkers = useMemo(
    () => siteWorkersRaw.filter((w) => attendanceMap.get(w.id)?.status === 'Absent').length,
    [siteWorkersRaw, attendanceMap],
  );

  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deletedSiteName, setDeletedSiteName] = React.useState('');
  const [isDeleted, setIsDeleted] = React.useState(false);

  const handleDeleteConfirm = async () => {
    if (!site) return;
    setIsDeleting(true);
    const siteName = site.name;
    setDeletedSiteName(siteName);
    try {
      setIsDeleted(true);
      await softDeleteSite(site.id);
      setShowConfirmDelete(false);
      setIsDeleting(false);
      setShowDeleteSuccess(true);
    } catch (err) {
      setIsDeleting(false);
      setIsDeleted(false);
      const msg = err instanceof Error ? err.message : 'Failed to delete site.';
      setDeleteError(msg);
    }
  };

  const handleDeleteSuccessClose = () => {
    setShowDeleteSuccess(false);
    router.replace('/(app)/sites');
  };

  if (isDeleted && showDeleteSuccess) {
    return (
      <ScreenWrapper>
        <SuccessDialog
          visible={showDeleteSuccess}
          title="Site Deleted"
          message={`"${deletedSiteName || 'Site'}" has been removed from active projects.`}
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
          <LoadingSkeleton type="card" height={220} />
          <View style={styles.flexRow}>
            <LoadingSkeleton type="card" height={140} width="48%" />
            <LoadingSkeleton type="card" height={140} width="48%" />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (!site || error) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Error" showBack />
        <View style={styles.errorContainer}>
          <ErrorState 
            title={!site ? "Site not found" : "Error"} 
            message={error || "The requested site could not be found."} 
            onRetry={refetchSite} 
            retryLabel="Retry" 
          />
        </View>
      </ScreenWrapper>
    );
  }

  // Compute expenses for this site from the real data
  const totalSiteExpenses = siteExpenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingSiteExpenses = siteExpenses.filter(e => e.payment_status === 'Pending').reduce((sum, e) => sum + e.amount, 0);

  return (
    <ScreenWrapper>
      {/* Header */}
      <ScreenHeader
        title={site.name}
        subtitle="Site Details"
        showBack
        actionButton={
          <EntityActionMenu
            onEdit={() => router.push({ pathname: '/(app)/sites/edit', params: { id: site.id } })}
            onDelete={() => setShowConfirmDelete(true)}
            editLabel="Edit Site"
            deleteLabel="Delete Site"
          />
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Project Header Identity */}
        <View style={styles.identitySection}>
          <View style={styles.identityHeader}>
             <StatusBadge status={site.status} />
             <Text style={styles.identityType}>{site.type}</Text>
          </View>

          {/* Project Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressLabel}>Project Progress</Text>
              <Text style={styles.progressPercent}>{site.progress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, site.progress))}%` }]} />
            </View>
          </View>
        </View>

        {/* Overview Grid */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <View style={styles.overviewIconContainer}>
              <MapPin size={IconSizes.sm} color={Colors.light.brand} />
            </View>
            <View style={styles.overviewTextWrap}>
              <Text style={styles.overviewLabel}>Location</Text>
              <Text style={styles.overviewValue}>{site.location}</Text>
            </View>
          </View>

          <View style={styles.overviewItem}>
            <View style={styles.overviewIconContainer}>
              <Calendar size={IconSizes.sm} color={Colors.light.brand} />
            </View>
            <View style={styles.overviewTextWrap}>
              <Text style={styles.overviewLabel}>Start Date</Text>
              <Text style={styles.overviewValue}>{site.startDate || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.overviewItem}>
            <View style={styles.overviewIconContainer}>
              <Calendar size={IconSizes.sm} color={Colors.light.brand} />
            </View>
            <View style={styles.overviewTextWrap}>
              <Text style={styles.overviewLabel}>Completion</Text>
              <Text style={styles.overviewValue}>{site.expectedCompletion || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.overviewItem}>
            <View style={styles.overviewIconContainer}>
              <CheckSquare size={IconSizes.sm} color={Colors.light.brand} />
            </View>
            <View style={styles.overviewTextWrap}>
              <Text style={styles.overviewLabel}>Pending Tasks</Text>
              <Text style={styles.overviewValue}>{site.pendingTasks || 0}</Text>
            </View>
          </View>
        </View>

        {/* Financial Summary */}
        {budgetSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Summary</Text>
            <View style={styles.financeCard}>
              
              <View style={styles.financeTop}>
                <View style={styles.financeMain}>
                  <Text style={styles.financeMainLabel}>Total Budget</Text>
                  <Money amount={budgetSummary.totalBudget} style={styles.financeMainValue} />
                </View>
                <View style={[styles.financeMain, { alignItems: 'flex-end' }]}>
                  <Text style={styles.financeMainLabel}>Remaining</Text>
                  <Money amount={budgetSummary.remainingBudget} style={styles.financeMainValueHighlight} />
                </View>
              </View>

              <View style={styles.financeProgressContainer}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.financeProgressLabel}>
                    <Money amount={budgetSummary.totalSpent} style={styles.financeProgressSpent} /> spent
                  </Text>
                  <Text style={styles.financeProgressPercent}>{budgetSummary.usagePercent.toFixed(1)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.financeProgressFill,
                      { width: `${Math.min(100, Math.max(0, budgetSummary.usagePercent))}%` },
                      budgetSummary.status === 'Exceeded' && { backgroundColor: Colors.light.error },
                      budgetSummary.status === 'Near Limit' && { backgroundColor: Colors.light.warning },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.breakdownContainer}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Materials</Text>
                  <Money amount={budgetSummary.materialCost} style={styles.breakdownValue} />
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Labor</Text>
                  <Money amount={budgetSummary.laborCost} style={styles.breakdownValue} />
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Other Expenses</Text>
                  <Money amount={budgetSummary.expenseCost} style={styles.breakdownValue} />
                </View>
              </View>

            </View>
          </View>
        )}

        {/* Breakdown Modules */}
        <View style={styles.modulesGrid}>
          
          {/* Materials Module */}
          <Pressable 
            style={styles.moduleCard} 
            onPress={() => router.push({ pathname: '/materials', params: { siteId: site.id } })}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: Colors.light.infoBg }]}>
              <Package size={IconSizes.md} color={Colors.light.info} />
            </View>
            <Text style={styles.moduleValue}>{materialsLoading ? '-' : materials.length}</Text>
            <Text style={styles.moduleLabel}>Tracked Materials</Text>
          </Pressable>

          {/* Labor Module */}
          <Pressable 
            style={styles.moduleCard} 
            onPress={() => router.push({ pathname: '/labor', params: { siteId: site.id } })}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: Colors.light.successBg }]}>
              <Users size={IconSizes.md} color={Colors.light.success} />
            </View>
            <Text style={styles.moduleValue}>{siteWorkerCount}</Text>
            <Text style={styles.moduleLabel}>Total Workers</Text>
            
            <View style={styles.moduleSubtextRow}>
               <Text style={[styles.moduleSubtext, { color: Colors.light.success }]}>{presentWorkers} Present</Text>
               <Text style={styles.moduleSubtextDivider}>•</Text>
               <Text style={[styles.moduleSubtext, { color: Colors.light.error }]}>{absentWorkers} Absent</Text>
            </View>
          </Pressable>

          {/* Expenses Module */}
          <Pressable 
            style={styles.moduleCard} 
            onPress={() => router.push({ pathname: '/expenses', params: { siteId: site.id } })}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: Colors.light.warningBg }]}>
              <CheckSquare size={IconSizes.md} color={Colors.light.warning} />
            </View>
            <Money amount={totalSiteExpenses} style={styles.moduleValue} />
            <Text style={styles.moduleLabel}>Other Expenses</Text>
            
            <View style={styles.moduleSubtextRow}>
               <Text style={[styles.moduleSubtext, { color: Colors.light.error }]}>
                 {pendingSiteExpenses > 0 ? `${pendingSiteExpenses} Pending` : 'All Paid'}
               </Text>
            </View>
          </Pressable>

        </View>
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmDeleteDialog
        visible={showConfirmDelete}
        title="Delete Site?"
        message={`Are you sure you want to delete "${site.name}"?\nAll related site information will be safely preserved in history, but will no longer appear in the active project list.`}
        confirmText="Delete Site"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* Success Feedback Dialog */}
      <SuccessDialog
        visible={showDeleteSuccess}
        title="Site Deleted"
        message={`"${deletedSiteName || 'Site'}" has been successfully removed.`}
        buttonText="Done"
        onClose={handleDeleteSuccessClose}
      />

      {/* Error Dialog */}
      <ErrorDialog
        visible={Boolean(deleteError)}
        message={deleteError || 'Failed to delete site.'}
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
  flexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'] * 2,
  },
  identitySection: {
    marginBottom: Spacing.xl,
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
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
  progressContainer: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  progressPercent: {
    ...Typography.sectionTitle,
    color: Colors.light.brand,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.success,
    borderRadius: Radius.full,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  overviewItem: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  overviewIconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  overviewTextWrap: {
    flex: 1,
  },
  overviewLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  overviewValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.brand,
    marginBottom: Spacing.md,
  },
  financeCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  financeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  financeMain: {
    flex: 1,
  },
  financeMainLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  financeMainValue: {
    ...Typography.pageTitle,
    color: Colors.light.text,
  },
  financeMainValueHighlight: {
    ...Typography.pageTitle,
    color: Colors.light.success,
  },
  financeProgressContainer: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  financeProgressLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  financeProgressSpent: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.error,
  },
  financeProgressPercent: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  financeProgressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.full,
  },
  breakdownContainer: {
    gap: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  breakdownValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  moduleCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
    minHeight: TouchTargets.min,
  },
  moduleIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  moduleValue: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
    marginBottom: 2,
  },
  moduleLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  moduleSubtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
  },
  moduleSubtext: {
    fontSize: 11,
    fontWeight: '600',
  },
  moduleSubtextDivider: {
    fontSize: 11,
    color: Colors.light.borderStrong,
  },
});
