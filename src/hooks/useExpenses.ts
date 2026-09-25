import { useState, useEffect, useCallback } from 'react';
import { ExpenseWithSite, getExpenses, getExpenseById } from '@/services/expenses';

export interface UseExpensesResult {
  expenses: ExpenseWithSite[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function useExpenses(siteId?: string): UseExpensesResult {
  const [expenses, setExpenses] = useState<ExpenseWithSite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) setRefreshing(true);
      setError(null);

      try {
        const data = await getExpenses(siteId);
        setExpenses(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load expenses.';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [siteId],
  );

  useEffect(() => {
    let isMounted = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      try {
        const data = await getExpenses(siteId);
        if (isMounted) setExpenses(data);
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unable to load expenses.';
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [siteId]);

  const onRefresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await loadData(false);
  }, [loadData]);

  return { expenses, loading, refreshing, error, refetch, onRefresh };
}

export interface UseExpenseDetailsResult {
  expense: ExpenseWithSite | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useExpenseDetails(id: string | undefined): UseExpenseDetailsResult {
  const [expense, setExpense] = useState<ExpenseWithSite | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(id ? null : 'Invalid expense ID.');

  const loadDetail = useCallback(async (targetId: string) => {
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
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
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
          const message = err instanceof Error ? err.message : 'Unable to load expense details.';
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    await loadDetail(id);
  }, [id, loadDetail]);

  return { expense, loading, error, refetch };
}
