import { supabase } from '@/lib/supabase';
import { ActivityItem } from '@/types/dashboard';
import { calculateRecordLaborCount } from '@/services/siteLabor';

export interface DashboardMetrics {
  activeSites: number;
  totalProjects: number;
  totalActiveLabor: number;
  thisMonthExpenses: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  // Format dates locally to avoid UTC timezone drift
  const todayStr = `${year}-${month}-${day}`;
  const firstDayOfMonthStr = `${year}-${month}-01`;
  const nextMonthNum = today.getMonth() === 11 ? 1 : today.getMonth() + 2;
  const nextMonthYear = today.getMonth() === 11 ? year + 1 : year;
  const firstDayOfNextMonthStr = `${nextMonthYear}-${String(nextMonthNum).padStart(2, '0')}-01`;

  // 3. This Month Expenses query
  const fetchThisMonthExpenses = async () => {
    try {
      return await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', firstDayOfMonthStr)
        .lt('expense_date', firstDayOfNextMonthStr)
        .is('deleted_at', null);
    } catch {
      return { data: [], error: null };
    }
  };

  const [
    totalProjectsResult,
    activeSitesResult,
    expensesResult,
    laborResult
  ] = await Promise.all([
    // 1. Total Projects (non-deleted)
    supabase.from('sites').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    
    // 2. Active Sites (non-deleted, not Completed/On Hold)
    supabase.from('sites').select('*', { count: 'exact', head: true }).is('deleted_at', null).not('status', 'in', '("Completed","On Hold")'),
    
    // 3. This Month Expenses
    fetchThisMonthExpenses(),
    
    // 4. Total Active Labor for Today
    supabase.from('site_labor_daily').select('*').eq('work_date', todayStr)
  ]);

  if (totalProjectsResult.error) throw totalProjectsResult.error;
  if (activeSitesResult.error) throw activeSitesResult.error;
  if (expensesResult.error) {
    console.warn('[dashboard] Non-critical error fetching monthly expenses:', expensesResult.error);
  }
  if (laborResult.error) {
    console.warn('[dashboard] Non-critical error fetching labor data:', laborResult.error);
  }

  const thisMonthExpenses = expensesResult.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const totalActiveLabor = laborResult.data?.reduce((sum, item) => {
    return sum + calculateRecordLaborCount(item);
  }, 0) || 0;

  return {
    activeSites: activeSitesResult.count || 0,
    totalProjects: totalProjectsResult.count || 0,
    totalActiveLabor,
    thisMonthExpenses,
  };
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  const [
    materialsResult,
    expensesResult,
    laborResult
  ] = await Promise.all([
    // Fetch recent material added
    supabase.from('materials').select('id, name, created_at, sites(name)').is('deleted_at', null).order('created_at', { ascending: false }).limit(3),
    
    // Fetch recent expenses
    supabase.from('expenses').select('id, title, created_at, sites(name)').is('deleted_at', null).order('created_at', { ascending: false }).limit(3),
    
    // Fetch recent labor updates
    supabase.from('site_labor_daily').select('*, sites(name)').order('updated_at', { ascending: false }).limit(3)
  ]);

  const activities: ActivityItem[] = [];

  if (materialsResult.data) {
    materialsResult.data.forEach(m => {
      activities.push({
        id: `mat-${m.id}`,
        title: `Material added: ${m.name}`,
        siteName: (m.sites as any)?.name || 'Unknown Site',
        timestamp: m.created_at,
        type: 'material'
      });
    });
  }

  if (expensesResult.data) {
    expensesResult.data.forEach(e => {
      activities.push({
        id: `exp-${e.id}`,
        title: `Expense logged: ${e.title}`,
        siteName: (e.sites as any)?.name || 'Unknown Site',
        timestamp: e.created_at,
        type: 'progress' 
      });
    });
  }

  if (laborResult.data) {
    laborResult.data.forEach(l => {
      const totalWorkers = calculateRecordLaborCount(l as any);
      activities.push({
        id: `labor-${l.id}`,
        title: `Labor logged: ${totalWorkers} workers`,
        siteName: (l.sites as any)?.name || 'Unknown Site',
        timestamp: l.updated_at,
        type: 'labor'
      });
    });
  }

  // Sort chronologically (newest first)
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Return top 5
  return activities.slice(0, 5);
}
