import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Phone, MapPin, Calendar, Clock, Banknote, Tag } from 'lucide-react-native';
import { useWorkerDetails } from '@/hooks/useWorkers';
import { useWorkerAttendanceHistory } from '@/hooks/useAttendance';
import { getSiteName, softDeleteWorker } from '@/services/workers';
import { EntityActionMenu } from '@/components/actions/EntityActionMenu';
import { ConfirmDeleteDialog } from '@/components/actions/ConfirmDeleteDialog';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Money } from '@/components/ui/Money';

import { Colors, Spacing, Typography, Radius, Shadows, IconSizes } from '@/constants/theme';

type AttendanceStatus = 'Present' | 'Absent' | 'Not Marked' | 'Half Day';

function formatHistoryDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00'); // parse as local date
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function WorkerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { worker, loading, error, refetch } = useWorkerDetails(id);
  const { history, loading: historyLoading } = useWorkerAttendanceHistory(id);

  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deletedWorkerName, setDeletedWorkerName] = React.useState('');
  const [isDeleted, setIsDeleted] = React.useState(false);

  const handleDeleteConfirm = async () => {
    if (!worker) return;
    setIsDeleting(true);
    const workerName = worker.name;
    setDeletedWorkerName(workerName);
    try {
      setIsDeleted(true);
      await softDeleteWorker(worker.id);
      setShowConfirmDelete(false);
      setIsDeleting(false);
      setShowDeleteSuccess(true);
    } catch (err) {
      setIsDeleting(false);
      setIsDeleted(false);
      const msg = err instanceof Error ? err.message : 'Failed to remove worker.';
      setDeleteError(msg);
    }
  };

  const handleDeleteSuccessClose = () => {
    setShowDeleteSuccess(false);
    router.replace('/(app)/labor');
  };

  const handlePhonePress = () => {
    if (worker?.phone) {
      void Linking.openURL(`tel:${worker.phone}`);
    }
  };

  const attendanceSummary = useMemo(() => {
    const total = history.length;
    const present = history.filter((r) => r.status === 'Present').length;
    const halfDay = history.filter((r) => r.status === 'Half Day').length;
    const absent = history.filter((r) => (r.status as AttendanceStatus) === 'Absent').length;
    const percentage = total > 0 ? Math.round(((present + halfDay * 0.5) / total) * 100) : 0;
    return { total, present, absent, halfDay, percentage };
  }, [history]);

  if (isDeleted && showDeleteSuccess) {
    return (
      <ScreenWrapper>
        <SuccessDialog
          visible={showDeleteSuccess}
          title="Worker Removed"
          message={`"${deletedWorkerName || 'Worker'}" has been removed from the workforce. Historical attendance records remain safe.`}
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
          <LoadingSkeleton type="card" height={120} />
          <LoadingSkeleton type="card" height={200} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!worker || error) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Error" showBack />
        <View style={styles.errorContainer}>
          <ErrorState 
             title={!worker ? "Worker not found" : "Unable to load worker"} 
             message={error || "The requested worker could not be found."} 
             onRetry={refetch} 
           />
        </View>
      </ScreenWrapper>
    );
  }

  const siteName = getSiteName(worker);
  const salaryAmount = (worker as any).salary_amount || 0;
  const payFrequency = (worker as any).pay_frequency || 'Daily';
  const frequencyLabel = payFrequency === 'Daily' ? 'day' : payFrequency === 'Weekly' ? 'week' : 'month';

  return (
    <ScreenWrapper>
      {/* Header */}
      <ScreenHeader
        title={worker.name}
        subtitle="Worker Profile"
        showBack
        actionButton={
          <EntityActionMenu
            onEdit={() => router.push({ pathname: '/(app)/labor/edit', params: { id: worker.id } })}
            onDelete={() => setShowConfirmDelete(true)}
            editLabel="Edit Worker"
            deleteLabel="Remove Worker"
          />
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Worker Identity */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{worker.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{worker.name}</Text>
              <Text style={styles.role}>{worker.role}</Text>
            </View>
          </View>
        </View>

        {/* Contact & Project Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={styles.infoCard}>
            {worker.phone && (
              <>
                <Pressable style={styles.infoRow} onPress={handlePhonePress} hitSlop={10}>
                  <Phone size={IconSizes.sm} color={Colors.light.primary} style={styles.infoIcon} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Phone Number</Text>
                    <Text style={[styles.infoValue, { color: Colors.light.primary }]}>{worker.phone}</Text>
                  </View>
                </Pressable>
                <View style={styles.infoDivider} />
              </>
            )}

            <View style={styles.infoRow}>
              <MapPin size={IconSizes.sm} color={Colors.light.textSecondary} style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Assigned Site</Text>
                <Text style={styles.infoValue}>{siteName}</Text>
              </View>
            </View>

            {worker.joining_date && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Calendar size={IconSizes.sm} color={Colors.light.textSecondary} style={styles.infoIcon} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Joining Date</Text>
                    <Text style={styles.infoValue}>{formatHistoryDate(worker.joining_date)}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Compensation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compensation</Text>
          <View style={styles.costGrid}>
            <View style={styles.costItem}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.light.infoBg }]}>
                <Tag size={IconSizes.sm} color={Colors.light.info} />
              </View>
              <View style={styles.costTextWrap}>
                <Text style={styles.costLabel}>Salary Type</Text>
                <Text style={styles.costValueRow}>
                  <Text style={styles.costValue}>{payFrequency}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.costItem}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.light.successBg }]}>
                <Banknote size={IconSizes.sm} color={Colors.light.success} />
              </View>
              <View style={styles.costTextWrap}>
                <Text style={styles.costLabel}>Configured Rate</Text>
                <Text style={styles.costValueRow}>
                  <Money amount={salaryAmount} style={styles.costTotalValue} />
                  <Text style={styles.costUnit}> /{frequencyLabel}</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Attendance Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{attendanceSummary.total}</Text>
                <Text style={styles.summaryLabel}>Total Days</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: Colors.light.success }]}>
                  {attendanceSummary.present}
                </Text>
                <Text style={styles.summaryLabel}>Present</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: Colors.light.error }]}>
                  {attendanceSummary.absent}
                </Text>
                <Text style={styles.summaryLabel}>Absent</Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Overall Attendance</Text>
                <Text style={styles.progressPercentage}>{attendanceSummary.percentage}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${attendanceSummary.percentage}%`,
                      backgroundColor: attendanceSummary.percentage >= 80 ? Colors.light.success : Colors.light.warning,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Attendance History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Attendance</Text>
          <View style={styles.historyCard}>
            {historyLoading ? (
              <LoadingSkeleton type="card" height={80} />
            ) : history.length === 0 ? (
              <Text style={styles.emptyHistoryText}>No attendance records yet.</Text>
            ) : (
              history.slice(0, 30).map((record, index) => {
                const isLast = index === Math.min(history.length, 30) - 1;
                return (
                  <View key={record.id}>
                    <View style={styles.historyItem}>
                      <View style={styles.historyDateContainer}>
                        <Clock size={IconSizes.sm} color={Colors.light.textSecondary} />
                        <Text style={styles.historyDate}>{formatHistoryDate(record.date)}</Text>
                      </View>
                      <StatusBadge status={record.status} />
                    </View>
                    {!isLast && <View style={styles.historyDivider} />}
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmDeleteDialog
        visible={showConfirmDelete}
        title="Remove Worker?"
        message={`Are you sure you want to remove "${worker.name}" from the workforce?\nHistorical attendance records will remain safe, but this worker will no longer appear in the active labor list.`}
        confirmText="Remove Worker"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* Success Feedback Dialog */}
      <SuccessDialog
        visible={showDeleteSuccess}
        title="Worker Removed"
        message={`"${deletedWorkerName || 'Worker'}" has been successfully removed.`}
        buttonText="Done"
        onClose={handleDeleteSuccessClose}
      />

      {/* Error Dialog */}
      <ErrorDialog
        visible={Boolean(deleteError)}
        message={deleteError || 'Failed to remove worker.'}
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
    paddingBottom: Spacing['2xl'] * 2,
  },
  profileCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  avatarText: {
    ...Typography.pageTitle,
    color: Colors.light.text,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
    marginBottom: 4,
  },
  role: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
    marginBottom: Spacing.md,
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
    paddingVertical: Spacing.md,
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
    color: Colors.light.text,
  },
  summaryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    ...Typography.display,
    color: Colors.light.text,
    marginBottom: 4,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  progressPercentage: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.sm,
  },
  historyCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  emptyHistoryText: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.light.textMuted,
    paddingVertical: Spacing.xl,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  historyDivider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
  historyDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  historyDate: {
    ...Typography.body,
    color: Colors.light.text,
    fontWeight: '500',
  },
});
