import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  CashTransactionRow,
  CashBookSummary,
  CashBookPeriodSummary,
  TransactionType,
  getCashTransactionsWithCache,
  getCashBookSummaryWithCache,
  getCashBookPeriodSummary,
  computeRunningBalance,
} from '@/services/cashBook';
import { dataSync } from '@/lib/dataSync';
import { useAuth } from '@/providers/AuthProvider';
import { useNetworkStatus } from './useNetworkStatus';

export type CashTransactionWithBalance = CashTransactionRow & { runningBalance: number };

export interface UseCashBookResult {
  transactions: CashTransactionWithBalance[];
  summary: CashBookSummary | null;
  periodSummary: CashBookPeriodSummary | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isOffline: boolean;
  isCached: boolean;
  lastUpdated: string | null;
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
  const { userId } = useAuth();
  const { isOffline } = useNetworkStatus();

  const [transactions, setTransactions] = useState<CashTransactionWithBalance[]>([]);
  const [summary, setSummary] = useState<CashBookSummary | null>(null);
  const [periodSummary, setPeriodSummary] = useState<CashBookPeriodSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

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

        const [txRes, summaryRes] = await Promise.all([
          getCashTransactionsWithCache(
            siteId,
            {
              fromDate,
              toDate,
              searchQuery: filters?.searchQuery,
              transactionType: filters?.transactionType,
            },
            userId,
          ),
          getCashBookSummaryWithCache(siteId, userId),
        ]);

        let rawPeriod: CashBookPeriodSummary | null = null;
        if (fromDate && toDate) {
          rawPeriod = await getCashBookPeriodSummary(siteId, fromDate, toDate).catch(() => null);
        }

        if (isMountedRef.current) {
          const openingBal = rawPeriod?.openingBalance ?? 0;
          const withBalance = computeRunningBalance(txRes.data, openingBal);
          setTransactions(withBalance);
          setSummary(summaryRes.data);
          setPeriodSummary(rawPeriod);
          setIsCached(txRes.isCached || summaryRes.isCached);
          setLastUpdated(txRes.cachedAt || summaryRes.cachedAt);
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
    [siteId, filters, userId],
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

  return { transactions, summary, periodSummary, loading, refreshing, error, isOffline, isCached, lastUpdated, refetch, onRefresh };
}

/**
 * Simplified hook for just the site cash summary (for Site Details card).
 */
export function useCashBookSummary(siteId: string | undefined): {
  summary: CashBookSummary | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  isCached: boolean;
  lastUpdated: string | null;
  refetch: () => Promise<void>;
} {
  const { userId } = useAuth();
  const { isOffline } = useNetworkStatus();

  const [summary, setSummary] = useState<CashBookSummary | null>(null);
  const [loading, setLoading] = useState(!!siteId);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchSummary = useCallback(async () => {
    if (!siteId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getCashBookSummaryWithCache(siteId, userId);
      if (isMountedRef.current) {
        setSummary(res.data);
        setIsCached(res.isCached);
        setLastUpdated(res.cachedAt);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load cash summary.');
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [siteId, userId]);

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

  return { summary, loading, error, isOffline, isCached, lastUpdated, refetch: fetchSummary };
}
