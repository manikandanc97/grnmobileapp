import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  CashTransactionRow,
  CashBookSummary,
  CashBookPeriodSummary,
  TransactionType,
  getCashTransactions,
  getCashBookSummary,
  getCashBookPeriodSummary,
  computeRunningBalance,
} from '@/services/cashBook';
import { dataSync } from '@/lib/dataSync';

export type CashTransactionWithBalance = CashTransactionRow & { runningBalance: number };

export interface UseCashBookResult {
  transactions: CashTransactionWithBalance[];
  summary: CashBookSummary | null;
  periodSummary: CashBookPeriodSummary | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: (isSilent?: boolean) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export interface CashBookFilters {
  fromDate?: string;
  toDate?: string;
  searchQuery?: string;
  transactionType?: TransactionType;
}

/**
 * Hook for fetching and subscribing to a site's cash book transactions.
 * Computes running balance and period summaries.
 */
export function useCashBook(
  siteId: string | undefined,
  filters?: CashBookFilters,
): UseCashBookResult {
  const [transactions, setTransactions] = useState<CashTransactionWithBalance[]>([]);
  const [summary, setSummary] = useState<CashBookSummary | null>(null);
  const [periodSummary, setPeriodSummary] = useState<CashBookPeriodSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadData = useCallback(
    async (isRefresh = false, isSilent = false) => {
      if (!siteId) {
        setLoading(false);
        return;
      }
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (isRefresh) {
        setRefreshing(true);
      } else if (!isSilent) {
        setLoading(true);
      }
      setError(null);

      try {
        const fromDate = filters?.fromDate;
        const toDate = filters?.toDate;

        const [rawTransactions, rawSummary] = await Promise.all([
          getCashTransactions(siteId, {
            fromDate,
            toDate,
            searchQuery: filters?.searchQuery,
            transactionType: filters?.transactionType,
          }),
          getCashBookSummary(siteId),
        ]);

        let rawPeriod: CashBookPeriodSummary | null = null;
        if (fromDate && toDate) {
          rawPeriod = await getCashBookPeriodSummary(siteId, fromDate, toDate);
        }

        if (isMountedRef.current) {
          // Compute running balance using the opening balance for the period
          const openingBal = rawPeriod?.openingBalance ?? 0;
          const withBalance = computeRunningBalance(rawTransactions, openingBal);
          setTransactions(withBalance);
          setSummary(rawSummary);
          setPeriodSummary(rawPeriod);
          dataSync.markClean('site_cash');
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load cash book.');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
        isFetchingRef.current = false;
      }
    },
    [siteId, filters],
  );

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  // Live sync subscription
  useEffect(() => {
    const unsub = dataSync.subscribe('site_cash', (event) => {
      if (event.action === 'invalidate') {
        loadData(false, true);
      } else {
        // Any mutation: re-fetch to recompute running balance and summaries
        loadData(false, true);
      }
    });
    return unsub;
  }, [loadData]);

  // Focus revalidation
  useFocusEffect(
    useCallback(() => {
      if (dataSync.isStale('site_cash')) {
        loadData(false, true);
      }
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    await loadData(true, false);
  }, [loadData]);

  const refetch = useCallback(
    async (isSilent?: boolean) => {
      const silent = isSilent ?? (transactions.length > 0);
      await loadData(false, silent);
    },
    [loadData, transactions.length],
  );

  return { transactions, summary, periodSummary, loading, refreshing, error, refetch, onRefresh };
}

/**
 * Simplified hook for just the site cash summary (for Site Details card).
 */
export function useCashBookSummary(siteId: string | undefined): {
  summary: CashBookSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [summary, setSummary] = useState<CashBookSummary | null>(null);
  const [loading, setLoading] = useState(!!siteId);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchSummary = useCallback(async () => {
    if (!siteId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getCashBookSummary(siteId);
      if (isMountedRef.current) {
        setSummary(data);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load cash summary.');
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSummary();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchSummary]);

  useEffect(() => {
    const unsub = dataSync.subscribe('site_cash', () => {
      fetchSummary();
    });
    return unsub;
  }, [fetchSummary]);

  useFocusEffect(
    useCallback(() => {
      if (dataSync.isStale('site_cash')) {
        fetchSummary();
      }
    }, [fetchSummary]),
  );

  return { summary, loading, error, refetch: fetchSummary };
}
