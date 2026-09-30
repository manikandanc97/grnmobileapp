import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMaterials } from './useMaterials';
import { useExpenses } from './useExpenses';
import { useSiteDetails } from './useSites';
import { calculateBudgetSummary, BudgetSummary } from '@/lib/finance';
import { getPayrollRecords } from '@/services/payroll';
import { dataSync } from '@/lib/dataSync';
import { parseBudgetInput } from '@/services/sites';

export interface UseSiteBudgetResult {
  budgetSummary: BudgetSummary | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useSiteBudget(siteId: string | undefined): UseSiteBudgetResult {
  const { site, loading: siteLoading, refetch: refetchSite } = useSiteDetails(siteId);
  const { materials, loading: materialsLoading, refetch: refetchMaterials } = useMaterials(siteId);
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses(siteId);
  
  const [payrollTotal, setPayrollTotal] = useState(0);
  const [payrollLoading, setPayrollLoading] = useState(true);

  const fetchPayroll = useCallback(async () => {
    if (!siteId) return;
    setPayrollLoading(true);
    try {
      const records = await getPayrollRecords(siteId);
      const total = records.reduce((acc, curr) => acc + curr.gross_amount, 0);
      setPayrollTotal(total);
    } catch (e) {
      console.warn('Could not fetch payroll records for budget:', e);
    } finally {
      setPayrollLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      if (!siteId) {
        if (isMounted) setPayrollLoading(false);
        return;
      }
      try {
        const records = await getPayrollRecords(siteId);
        if (isMounted) {
          const total = records.reduce((acc, curr) => acc + curr.gross_amount, 0);
          setPayrollTotal(total);
        }
      } catch (e) {
        console.warn('Could not fetch payroll records for budget:', e);
      } finally {
        if (isMounted) {
          setPayrollLoading(false);
        }
      }
    };
    void fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [siteId]);

  useEffect(() => {
    const unsub = dataSync.subscribe('payroll', () => {
      void fetchPayroll();
    });
    return unsub;
  }, [fetchPayroll]);

  const budgetSummary = useMemo(() => {
    if (!site) return null;

    const materialCost = materials.reduce((acc, m) => acc + m.totalCost, 0);
    const expenseCost = expenses.reduce((acc, e) => acc + e.amount, 0);

    const parsedBudget = site.budget ? parseBudgetInput(site.budget) : 0;

    return calculateBudgetSummary(
      parsedBudget || 0,
      materialCost,
      payrollTotal,
      expenseCost
    );
  }, [site, materials, expenses, payrollTotal]);

  const loading = siteLoading || materialsLoading || expensesLoading || payrollLoading;

  const refetch = async () => {
    await Promise.all([
      refetchSite(),
      refetchMaterials(),
      refetchExpenses(),
      fetchPayroll()
    ]);
  };

  return { budgetSummary, loading, refetch };
}
