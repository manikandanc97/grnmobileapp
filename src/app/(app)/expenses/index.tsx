import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Receipt } from 'lucide-react-native';

import { ExpenseCategory, ExpenseItem, PaymentMethod, PaymentStatus } from '@/types/dashboard';
import { ExpenseSummaryCard } from '@/components/expenses/ExpenseSummaryCard';
import { ExpenseFilter } from '@/components/expenses/ExpenseFilter';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { useExpenses } from '@/hooks/useExpenses';
import { getExpenseSiteName, softDeleteExpense } from '@/services/expenses';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { DateField } from '@/components/ui/DateField';
import { ConfirmDeleteDialog } from '@/components/actions/ConfirmDeleteDialog';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/constants/expenses';
import {
  isDateInCurrentMonth,
  isDateInPreviousMonth,
  isDateToday,
  isDateInCurrentWeek,
  isDateInCustomRange,
} from '@/lib/dateUtils';
import { Colors, Spacing, IconSizes } from '@/constants/theme';

const CATEGORIES: ('All' | ExpenseCategory)[] = ['All', ...EXPENSE_CATEGORIES];
const PAY_METHODS: ('All' | PaymentMethod)[] = ['All', ...PAYMENT_METHODS];
const PERIODS = ['All Time', 'This Month', 'Last Month', 'This Week', 'Today', 'Custom Range'];

export default function ExpensesScreen() {
  const { siteId, period, status } = useLocalSearchParams<{
    siteId?: string;
    period?: string;
    status?: string;
  }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ExpenseCategory>('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'All' | PaymentMethod>('All');

  const [prevPeriod, setPrevPeriod] = useState(period);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    if (period && PERIODS.includes(period)) return period;
    return 'All Time';
  });

  if (period !== prevPeriod) {
    setPrevPeriod(period);
    if (period && PERIODS.includes(period)) {
      setSelectedPeriod(period);
    }
  }

  const [prevStatus, setPrevStatus] = useState(status);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<'All' | PaymentStatus>(() => {
    if (status === 'Pending' || status === 'Paid') return status;
    return 'All';
  });

  if (status !== prevStatus) {
    setPrevStatus(status);
    if (status === 'Pending' || status === 'Paid') {
      setSelectedPaymentStatus(status);
    }
  }

  const [customStartDate, setCustomStartDate] = useState<Date>(new Date(new Date().setHours(0, 0, 0, 0)));
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());

  // Card action states
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deletedExpenseTitle, setDeletedExpenseTitle] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleEditExpense = useCallback((expense: ExpenseItem) => {
    router.push({ pathname: '/(app)/expenses/edit', params: { id: expense.id } } as never);
  }, []);

  const handleDeleteExpensePress = useCallback((expense: ExpenseItem) => {
    setExpenseToDelete(expense);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    const title = expenseToDelete.title;
    try {
      await softDeleteExpense(expenseToDelete.id);
      setIsDeleting(false);
      setExpenseToDelete(null);
      setDeletedExpenseTitle(title);
      setShowDeleteSuccess(true);
    } catch (err) {
      setIsDeleting(false);
      const msg = err instanceof Error ? err.message : 'Failed to delete expense.';
      setDeleteError(msg);
    }
  }, [expenseToDelete]);

  const {
    expenses,
    loading,
    error,
    refreshing,
    refetch,
    onRefresh,
  } = useExpenses(siteId);

  // Map to ExpenseItem for the existing UI components
  const mappedExpenses = useMemo<ExpenseItem[]>(() => {
    return expenses.map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount || 0,
      category: e.category as ExpenseCategory,
      siteId: e.site_id,
      siteName: getExpenseSiteName(e),
      expenseDate: e.expense_date,
      vendor: e.vendor ?? '',
      paymentMethod: e.payment_method as PaymentMethod,
      paymentStatus: e.payment_status as PaymentStatus,
      reference: e.reference ?? undefined,
      notes: e.notes ?? undefined,
    }));
  }, [expenses]);

  // Derived state (filtering)
  const filteredExpenses = useMemo(() => {
    return mappedExpenses.filter((e) => {
      const matchCategory = selectedCategory === 'All' || e.category === selectedCategory;
      const matchPaymentMethod = selectedPaymentMethod === 'All' || e.paymentMethod === selectedPaymentMethod;
      const matchPaymentStatus = selectedPaymentStatus === 'All' || e.paymentStatus === selectedPaymentStatus;
      const matchSiteParam = !siteId || e.siteId === siteId;

      const query = searchQuery.toLowerCase().trim();
      const matchSearch = !query ||
        (e.title && e.title.toLowerCase().includes(query)) ||
        (e.siteName && e.siteName.toLowerCase().includes(query)) ||
        (e.vendor && e.vendor.toLowerCase().includes(query)) ||
        (e.category && e.category.toLowerCase().includes(query)) ||
        (e.reference && e.reference.toLowerCase().includes(query)) ||
        (e.notes && e.notes.toLowerCase().includes(query));

      // Period filter with timezone-accurate date utilities
      let matchPeriod = true;
      if (selectedPeriod === 'This Month') {
        matchPeriod = isDateInCurrentMonth(e.expenseDate);
      } else if (selectedPeriod === 'Last Month') {
        matchPeriod = isDateInPreviousMonth(e.expenseDate);
      } else if (selectedPeriod === 'Today') {
        matchPeriod = isDateToday(e.expenseDate);
      } else if (selectedPeriod === 'This Week') {
        matchPeriod = isDateInCurrentWeek(e.expenseDate);
      } else if (selectedPeriod === 'Custom Range') {
        matchPeriod = isDateInCustomRange(e.expenseDate, customStartDate, customEndDate);
      }

      return matchCategory && matchPaymentMethod && matchPaymentStatus && matchSiteParam && matchSearch && matchPeriod;
    });
  }, [mappedExpenses, selectedCategory, selectedPaymentMethod, selectedPaymentStatus, siteId, searchQuery, selectedPeriod, customStartDate, customEndDate]);

  // Derived state (stats)
  const stats = useMemo(() => {
    const totalAmount = mappedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const thisMonthAmount = mappedExpenses
      .filter((e) => isDateInCurrentMonth(e.expenseDate))
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const pendingAmount = mappedExpenses
      .filter((e) => e.paymentStatus === 'Pending')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const activeSites = new Set(mappedExpenses.map((e) => e.siteId).filter(Boolean)).size;

    return { totalAmount, thisMonthAmount, pendingAmount, activeSites };
  }, [mappedExpenses]);

  const renderExpense = ({ item }: { item: ExpenseItem }) => (
    <ExpenseCard
      expense={item}
      onPress={() => router.push(`/(app)/expenses/${item.id}` as any)}
      onEdit={() => handleEditExpense(item)}
      onDelete={() => handleDeleteExpensePress(item)}
    />
  );

  const renderHeader = () => {
    if (loading || error) return null;
    return (
      <View style={styles.listHeaderContainer}>
        {!siteId && (
          <ExpenseSummaryCard
            {...stats}
            isThisMonthSelected={selectedPeriod === 'This Month'}
            isPendingSelected={selectedPaymentStatus === 'Pending'}
            onPressThisMonth={() => setSelectedPeriod((prev) => (prev === 'This Month' ? 'All Time' : 'This Month'))}
            onPressPending={() => setSelectedPaymentStatus((prev) => (prev === 'Pending' ? 'All' : 'Pending'))}
            onPressTotal={() => {
              setSelectedPeriod('All Time');
              setSelectedPaymentStatus('All');
              setSelectedCategory('All');
              setSelectedPaymentMethod('All');
              setSearchQuery('');
            }}
          />
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <ScreenHeader
        title="Expenses"
        subtitle={siteId ? "Project expenses" : "Track all project spending"}
        showBack={Boolean(siteId)}
        actionButton={
          <View style={{ width: 140 }}>
            <Button
              title="Add Expense"
              onPress={() =>
                router.push(
                  siteId
                    ? ({ pathname: '/(app)/expenses/add', params: { siteId } } as any)
                    : ('/(app)/expenses/add' as any)
                )
              }
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
          placeholder="Search expenses..."
          onClear={() => setSearchQuery('')}
          style={styles.searchBar}
        />
        <View style={styles.filterWrapper}>
          <ExpenseFilter
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            periods={PERIODS}
            selectedPeriod={selectedPeriod}
            onSelectPeriod={setSelectedPeriod}
            paymentMethods={PAY_METHODS}
            selectedPaymentMethod={selectedPaymentMethod}
            onSelectPaymentMethod={setSelectedPaymentMethod}
          />
        </View>

        {selectedPeriod === 'Custom Range' && (
          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputWrapper}>
              <DateField value={customStartDate} onChange={(d) => setCustomStartDate(d)} />
            </View>
            <View style={styles.dateInputWrapper}>
              <DateField value={customEndDate} onChange={(d) => setCustomEndDate(d)} />
            </View>
          </View>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <LoadingSkeleton type="card" height={140} />
          <LoadingSkeleton type="card" height={160} />
          <LoadingSkeleton type="card" height={160} />
          <LoadingSkeleton type="card" height={160} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <ErrorState 
             title="Unable to load expenses" 
             message={error} 
             onRetry={refetch} 
           />
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          renderItem={renderExpense}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
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
                icon={<Receipt size={48} color={Colors.light.textMuted} />}
                title={expenses.length === 0 ? "No expenses found" : "No results matching criteria"}
                description={expenses.length === 0 
                  ? "Record your first project expense to start tracking."
                  : "Try adjusting your search or filters to find what you're looking for."}
                actionLabel={expenses.length === 0 ? "Add Expense" : "Reset Filters"}
                onAction={expenses.length === 0 ? () => router.push('/(app)/expenses/add') : () => {
                  setSearchQuery('');
                  setSelectedPeriod('All Time');
                  setSelectedCategory('All');
                  setSelectedPaymentMethod('All');
                  setSelectedPaymentStatus('All');
                }}
              />
            </View>
          )}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        visible={!!expenseToDelete}
        title="Delete Expense?"
        message={
          expenseToDelete
            ? `Are you sure you want to delete "${expenseToDelete.title}"? This expense record will be permanently removed.`
            : ''
        }
        confirmText="Delete Expense"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setExpenseToDelete(null);
        }}
      />

      {/* Delete Success Dialog */}
      <SuccessDialog
        visible={showDeleteSuccess}
        title="Expense Deleted"
        message={`"${deletedExpenseTitle || 'Expense'}" has been successfully removed.`}
        buttonText="Done"
        onClose={() => setShowDeleteSuccess(false)}
      />

      {/* Delete Error Dialog */}
      <ErrorDialog
        visible={!!deleteError}
        title="Delete Failed"
        message={deleteError ?? 'An unexpected error occurred while deleting expense.'}
        onClose={() => setDeleteError(null)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchSection: {
    backgroundColor: Colors.light.background,
    paddingTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  searchBar: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterWrapper: {
    marginBottom: Spacing.sm,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  dateInputWrapper: {
    flex: 1,
  },
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
  emptyContainer: {
    paddingVertical: Spacing['2xl'],
  },
  listContent: {
    paddingBottom: Spacing['2xl'] * 2,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  listHeaderContainer: {
    marginBottom: Spacing.sm,
  },
});
