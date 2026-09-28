import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { ExpenseWithSite, getExpenses, getExpenseById } from '@/services/expenses';
import { dataSync } from '@/lib/dataSync';

export interface UseExpensesResult {
  expenses: ExpenseWithSite[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: (isSilent?: boolean) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function useExpenses(siteId?: string): UseExpensesResult {
  const [expenses, setExpenses] = useState<ExpenseWithSite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);

  const loadData = useCallback(
    async (isRefresh = false, isSilent = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (isRefresh) {
        setRefreshing(true);
      } else if (!isSilent) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await getExpenses(siteId);
        setExpenses(data);
        dataSync.markClean('expenses');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load expenses.';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [siteId],
  );

  // Initial load
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getExpenses(siteId);
        if (isMounted) {
          setExpenses(data);
          dataSync.markClean('expenses');
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load expenses.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [siteId]);


  // Live synchronization subscription
  useEffect(() => {
    const unsubscribe = dataSync.subscribe('expenses', (event) => {
      if (event.action === 'create') {
        const newExpense = event.payload;
        if (!siteId || newExpense.site_id === siteId) {
          setExpenses((prev) => {
            const exists = prev.some((e) => e.id === newExpense.id);
            if (exists) {
              return prev.map((e) => (e.id === newExpense.id ? newExpense : e));
            }
            return [newExpense, ...prev];
          });
        }
      } else if (event.action === 'update') {
        const updated = event.payload;
        if (!siteId || updated.site_id === siteId) {
          setExpenses((prev) =>
            prev.map((e) => (e.id === updated.id ? updated : e))
          );
        } else {
          setExpenses((prev) => prev.filter((e) => e.id !== updated.id));
        }
      } else if (event.action === 'delete') {
        setExpenses((prev) => prev.filter((e) => e.id !== event.payload.id));
      } else if (event.action === 'invalidate') {
        loadData(false, true);
      }
    });

    return unsubscribe;
  }, [siteId, loadData]);

  // Intelligent navigation focus revalidation (only if marked stale)
  useFocusEffect(
    useCallback(() => {
      if (dataSync.isStale('expenses')) {
        loadData(false, true);
      }
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    await loadData(true, false);
  }, [loadData]);

  const refetch = useCallback(
    async (isSilent?: boolean) => {
      const silent = isSilent ?? (expenses.length > 0);
      await loadData(false, silent);
    },
    [loadData, expenses.length],
  );

  return { expenses, loading, refreshing, error, refetch, onRefresh };
}

export interface UseExpenseDetailsResult {
  expense: ExpenseWithSite | null;
  loading: boolean;
  error: string | null;
  refetch: (isSilent?: boolean) => Promise<void>;
}

export function useExpenseDetails(id: string | undefined): UseExpenseDetailsResult {
  const [expense, setExpense] = useState<ExpenseWithSite | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(id ? null : 'Invalid expense ID.');

  const isFetchingRef = useRef(false);

  const loadDetail = useCallback(async (targetId: string, isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isSilent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getExpenseById(targetId);
      if (!data) {
        setExpense(null);
        setError('Expense not found.');
      } else {
        setExpense(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load expense details.';
      setError(message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    (async () => {
      try {
        const data = await getExpenseById(id);
        if (isMounted) {
          if (!data) {
            setExpense(null);
            setError('Expense not found.');
          } else {
            setExpense(data);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load expense details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id]);


  // Live synchronization for detail view
  useEffect(() => {
    if (!id) return;

    const unsubscribe = dataSync.subscribe('expenses', (event) => {
      if (event.action === 'update' && event.payload.id === id) {
        setExpense(event.payload);
      } else if (event.action === 'delete' && event.payload.id === id) {
        setExpense(null);
        setError('Expense has been deleted.');
      } else if (event.action === 'invalidate') {
        loadDetail(id, true);
      }
    });

    return unsubscribe;
  }, [id, loadDetail]);

  // Revalidate on focus if stale
  useFocusEffect(
    useCallback(() => {
      if (id && dataSync.isStale('expenses')) {
        loadDetail(id, true);
      }
    }, [id, loadDetail])
  );

  const refetch = useCallback(
    async (isSilent?: boolean) => {
      if (!id) return;
      const silent = isSilent ?? (expense !== null);
      await loadDetail(id, silent);
    },
    [id, loadDetail, expense],
  );

  return { expense, loading, error, refetch };
}

