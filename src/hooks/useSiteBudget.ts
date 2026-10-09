import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMaterials } from './useMaterials';
import { useExpenses } from './useExpenses';
import { useSiteDetails } from './useSites';
import { calculateBudgetSummary, BudgetSummary } from '@/lib/finance';
import { getSiteLaborHistory } from '@/services/siteLabor';
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
      const history = await getSiteLaborHistory(siteId);
      const totalLaborCost = history.reduce((sum, record) => {
        return sum + (record.mason_count * record.mason_rate) +
                     (record.men_helper_count * record.men_helper_rate) +
                     (record.women_helper_count * record.women_helper_rate);
      }, 0);
      setPayrollTotal(totalLaborCost);
    } catch (e) {
      console.warn('Could not fetch site labor history for budget:', e);
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
        const history = await getSiteLaborHistory(siteId);
        if (isMounted) {
          const totalLaborCost = history.reduce((sum, record) => {
            return sum + (record.mason_count * record.mason_rate) +
                         (record.men_helper_count * record.men_helper_rate) +
                         (record.women_helper_count * record.women_helper_rate);
          }, 0);
          setPayrollTotal(totalLaborCost);
        }
      } catch (e) {
        console.warn('Could not fetch site labor history for budget:', e);
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
    const unsub = dataSync.subscribe('site_labor', () => {
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
