import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MapPin, Calendar, CreditCard, User, FileText, FolderOpen } from 'lucide-react-native';

import { useExpenseDetails } from '@/hooks/useExpenses';
import { softDeleteExpense, getExpenseSiteName } from '@/services/expenses';

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

import { parseSafeDate, formatDate as formatLibDate } from '@/lib/dateUtils';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Not set';
  const d = parseSafeDate(dateStr);
  if (!d) return dateStr;
  return formatLibDate(d, 'EEE, dd MMM yyyy');
}

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { expense, loading, error, refetch } = useExpenseDetails(id);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletedExpenseTitle, setDeletedExpenseTitle] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!expense) return;
    setIsDeleting(true);
    const expTitle = expense.title;
    setDeletedExpenseTitle(expTitle);
    try {
      setIsDeleted(true);
      await softDeleteExpense(expense.id);
      setShowConfirmDelete(false);
      setIsDeleting(false);
      setShowDeleteSuccess(true);
    } catch (err) {
      setIsDeleting(false);
      setIsDeleted(false);
      const message = err instanceof Error ? err.message : 'Failed to delete expense.';
      setDeleteError(message);
    }
  };

  const handleDeleteSuccessClose = () => {
    setShowDeleteSuccess(false);
    router.replace('/(app)/expenses');
  };

  if (isDeleted && showDeleteSuccess) {
    return (
      <ScreenWrapper>
        <SuccessDialog
          visible={showDeleteSuccess}
          title="Expense Deleted"
          message={`"${deletedExpenseTitle || 'Expense'}" has been successfully removed.`}
          buttonText="Done"
          onClose={handleDeleteSuccessClose}
        />
      </ScreenWrapper>
    );
  }

  if (loading) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Expense Details" showBack={true} />
        <View style={styles.loadingContainer}>
          <LoadingSkeleton type="card" height={200} />
          <LoadingSkeleton type="card" height={300} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!expense || error) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Expense Details" showBack={true} />
        <View style={styles.centerContainer}>
          <ErrorState 
            title="Expense not found" 
            message={error ?? 'The expense you are looking for does not exist or has been deleted.'} 
            onRetry={error ? refetch : undefined}
          />
        </View>
      </ScreenWrapper>
    );
  }

  const siteName = getExpenseSiteName(expense);

  return (
    <ScreenWrapper>
      {/* Header */}
      <ScreenHeader
        title="Expense Details"
        showBack={true}
        actionButton={
          <EntityActionMenu
            onEdit={() => router.push({ pathname: '/(app)/expenses/edit', params: { id: expense.id } })}
            onDelete={() => setShowConfirmDelete(true)}
            editLabel="Edit Expense"
            deleteLabel="Delete Expense"
          />
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Main Identity Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.categoryBadge}>
              <FolderOpen size={14} color={Colors.light.textSecondary} />
              <Text style={styles.categoryText}>{expense.category}</Text>
            </View>
            <StatusBadge status={expense.payment_status} />
          </View>
          
          <Text style={styles.title}>{expense.title}</Text>
          <Money amount={expense.amount || 0} style={styles.amount} />
        </View>

        {/* Details List */}
        <Text style={styles.sectionTitle}>Information</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <MapPin size={20} color={Colors.light.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Site</Text>
              <Text style={styles.detailValue}>{siteName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Calendar size={20} color={Colors.light.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Expense Date</Text>
              <Text style={styles.detailValue}>{formatDate(expense.expense_date)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <User size={20} color={Colors.light.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Vendor</Text>
              <Text style={styles.detailValue}>{expense.vendor || 'Not specified'}</Text>
            </View>
          </View>

          {expense.reference && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <FileText size={20} color={Colors.light.textSecondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Reference / Receipt No.</Text>
                  <Text style={styles.detailValue}>{expense.reference}</Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <CreditCard size={20} color={Colors.light.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>{expense.payment_method}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {expense.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{expense.notes}</Text>
            </View>
          </>
        )}

      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmDeleteDialog
        visible={showConfirmDelete}
        title="Delete Expense?"
        message={`Are you sure you want to delete "${expense.title}"? This expense record will be permanently removed.`}
        confirmText="Delete Expense"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* Success Feedback Dialog */}
      <SuccessDialog
        visible={showDeleteSuccess}
        title="Expense Deleted"
        message={`"${deletedExpenseTitle || 'Expense'}" has been successfully removed.`}
        buttonText="Done"
        onClose={handleDeleteSuccessClose}
      />

      {/* Error Dialog */}
      <ErrorDialog
        visible={Boolean(deleteError)}
        title="Error"
        message={deleteError || 'Failed to delete expense.'}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'] * 2,
  },
  heroCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    ...Shadows.sm,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    gap: 6,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
  },
  title: {
    ...Typography.cardTitle,
    fontSize: 20,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  amount: {
    ...Typography.display,
    color: Colors.light.brand,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  detailsCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginVertical: Spacing.md,
    marginLeft: 60,
  },
  notesCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  notesText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },
});
