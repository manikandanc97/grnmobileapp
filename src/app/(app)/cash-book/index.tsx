import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Plus, BookOpen, TrendingUp, TrendingDown, X } from 'lucide-react-native';

import { useCashBook, CashTransactionWithBalance } from '@/hooks/useCashBook';
import { deleteCashTransaction, getTodayLocalDate } from '@/services/cashBook';
import { useSiteDetails } from '@/hooks/useSites';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDeleteDialog } from '@/components/actions/ConfirmDeleteDialog';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { CashTransactionCard } from '@/components/cashBook/CashTransactionCard';
import { CashBookSummaryCard } from '@/components/cashBook/CashBookSummaryCard';

import { Colors, Spacing, Typography, Radius, IconSizes } from '@/constants/theme';

type FilterType = 'ALL' | 'INWARD' | 'OUTWARD';

export default function CashBookScreen() {
  const { siteId, siteName } = useLocalSearchParams<{ siteId: string; siteName?: string }>();

  const { site } = useSiteDetails(siteId);
  const displaySiteName = siteName || site?.name || 'Site';

  // Filter state — stored as YYYY-MM-DD strings internally
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');

  // DateField onChange adapters: component passes (Date, formattedDate)
  // We store the YYYY-MM-DD ISO string to avoid UTC drift
  const handleFromDateChange = useCallback((date: Date, _formatted: string) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setFromDate(`${y}-${m}-${d}`);
  }, []);

  const handleToDateChange = useCallback((date: Date, _formatted: string) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setToDate(`${y}-${m}-${d}`);
  }, []);

  // Build filters memo to avoid unnecessary refetches
  const filters = useMemo(() => ({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    searchQuery: searchQuery || undefined,
    transactionType: filterType === 'ALL' ? undefined : filterType,
  }), [fromDate, toDate, searchQuery, filterType]);

  const { transactions, summary, periodSummary, loading, refreshing, error, refetch, onRefresh } =
    useCashBook(siteId, filters);

  // Delete flow
  const [deleteTarget, setDeleteTarget] = useState<CashTransactionWithBalance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const hasDateFilter = Boolean(fromDate && toDate);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCashTransaction(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteSuccess(true);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete transaction.');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget]);

  const handleClearDates = useCallback(() => {
    setFromDate('');
    setToDate('');
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: CashTransactionWithBalance }) => (
      <CashTransactionCard
        transaction={item}
        showRunningBalance={true}
        onEdit={() =>
          router.push({
            pathname: '/(app)/cash-book/edit',
            params: { id: item.id, siteId },
          })
        }
        onDelete={() => setDeleteTarget(item)}
      />
    ),
    [siteId],
  );

  const keyExtractor = useCallback((item: CashTransactionWithBalance) => item.id, []);

  const ListHeader = useMemo(() => {
    if (!summary) return null;
    return (
      <View>
        <CashBookSummaryCard
          summary={summary}
          periodSummary={periodSummary}
          hasDateFilter={hasDateFilter}
        />

        {/* Date filter row */}
        <View style={styles.dateFilterRow}>
          <View style={styles.dateFieldWrap}>
            <DateField
              value={fromDate || undefined}
              onChange={handleFromDateChange}
              placeholder="From Date"
              error={false}
            />
          </View>
          <View style={styles.dateFieldWrap}>
            <DateField
              value={toDate || undefined}
              onChange={handleToDateChange}
              placeholder="To Date"
              error={false}
            />
          </View>
          {hasDateFilter && (
            <Pressable style={styles.clearDateBtn} onPress={handleClearDates} hitSlop={8}>
              <X size={14} color={Colors.light.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Transaction type tabs */}
        <View style={styles.tabRow}>
          {(['ALL', 'INWARD', 'OUTWARD'] as FilterType[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, filterType === t && styles.tabActive]}
              onPress={() => setFilterType(t)}
            >
              {t === 'INWARD' && <TrendingUp size={12} color={filterType === t ? Colors.light.success : Colors.light.textSecondary} />}
              {t === 'OUTWARD' && <TrendingDown size={12} color={filterType === t ? Colors.light.error : Colors.light.textSecondary} />}
              <Text style={[styles.tabText, filterType === t && (
                t === 'INWARD' ? styles.tabTextInward :
                t === 'OUTWARD' ? styles.tabTextOutward :
                styles.tabTextActive
              )]}>
                {t === 'ALL' ? 'All' : t === 'INWARD' ? 'Inward' : 'Outward'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Results header */}
        {transactions.length > 0 && (
          <Text style={styles.resultsCount}>
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
    );
  }, [summary, periodSummary, hasDateFilter, fromDate, toDate, filterType, transactions.length, handleClearDates]);

  if (loading && transactions.length === 0) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Cash Book" subtitle={displaySiteName} showBack />
        <View style={styles.content}>
          <LoadingSkeleton type="card" height={160} />
          <LoadingSkeleton type="card" height={90} />
          <LoadingSkeleton type="card" height={90} />
          <LoadingSkeleton type="card" height={90} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error && transactions.length === 0 && !summary) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Cash Book" subtitle={displaySiteName} showBack />
        <View style={styles.errorContainer}>
          <ErrorState title="Failed to load" message={error} onRetry={refetch} retryLabel="Retry" />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScreenHeader
        title="Site Cash Book"
        subtitle={displaySiteName}
        showBack
      />

      <View style={styles.searchRow}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search particulars…"
        />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.light.brand]}
            tintColor={Colors.light.brand}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="No Transactions"
              description={
                searchQuery || hasDateFilter || filterType !== 'ALL'
                  ? 'No transactions match your current filters.'
                  : 'No cash transactions recorded yet.\nTap "+ Add Transaction" to begin.'
              }
              icon={<BookOpen size={40} color={Colors.light.textSecondary} />}
            />
          ) : null
        }
      />

      {/* Floating Add button */}
      <View style={styles.fab}>
        <Button
          title="+ Add Transaction"
          onPress={() =>
            router.push({
              pathname: '/(app)/cash-book/add',
              params: { siteId, siteName: displaySiteName },
            })
          }
          variant="primary"
          icon={<Plus size={IconSizes.sm} color="#fff" />}
        />
      </View>

      {/* Delete confirmation */}
      <ConfirmDeleteDialog
        visible={Boolean(deleteTarget)}
        title="Delete Transaction?"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.particulars}" (${deleteTarget.transaction_type === 'INWARD' ? '+' : '−'}${deleteTarget.amount})?\n\nThis will recalculate all affected balances.`
            : ''
        }
        confirmText="Delete"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <SuccessDialog
        visible={deleteSuccess}
        title="Transaction Deleted"
        message="The transaction has been removed and balances recalculated."
        buttonText="OK"
        onClose={() => setDeleteSuccess(false)}
      />

      <ErrorDialog
        visible={Boolean(deleteError)}
        message={deleteError || 'Failed to delete transaction.'}
        onClose={() => setDeleteError(null)}
        onRetry={handleDeleteConfirm}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  searchRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  dateFilterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  dateFieldWrap: {
    flex: 1,
  },
  clearDateBtn: {
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tabActive: {
    borderColor: Colors.light.brand,
    backgroundColor: Colors.light.brandBg,
  },
  tabText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: Colors.light.brand,
  },
  tabTextInward: {
    color: Colors.light.success,
  },
  tabTextOutward: {
    color: Colors.light.error,
  },
  resultsCount: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
});
