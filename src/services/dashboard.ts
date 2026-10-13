import { supabase } from '@/lib/supabase';
import { ActivityItem } from '@/types/dashboard';
import { calculateRecordLaborCount } from '@/services/siteLabor';
import { offlineStorage } from './offlineStorage';
import { networkStatus } from './networkStatus';
import { formatDatabaseError } from './sites';

export interface DashboardMetrics {
  activeSites: number;
  totalProjects: number;
  totalActiveLabor: number;
  thisMonthExpenses: number;
}

async function resolveUserId(userId?: string): Promise<string> {
  if (userId) return userId;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || '';
  } catch {
    return '';
  }
}

export interface DashboardMetricsResult {
  data: DashboardMetrics;
  isCached: boolean;
  cachedAt: string | null;
}

export async function getDashboardMetricsWithCache(userId?: string): Promise<DashboardMetricsResult> {
  const currentUserId = await resolveUserId(userId);
  const isConnected = networkStatus.getNetworkState().isConnected;

  if (isConnected) {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      const todayStr = `${year}-${month}-${day}`;
      const firstDayOfMonthStr = `${year}-${month}-01`;
      const nextMonthNum = today.getMonth() === 11 ? 1 : today.getMonth() + 2;
      const nextMonthYear = today.getMonth() === 11 ? year + 1 : year;
      const firstDayOfNextMonthStr = `${nextMonthYear}-${String(nextMonthNum).padStart(2, '0')}-01`;

      const fetchThisMonthExpenses = async () => {
          return await supabase
            .from('expenses')
            .select('amount')
            .gte('expense_date', firstDayOfMonthStr)
            .lt('expense_date', firstDayOfNextMonthStr)
            .is('deleted_at', null);
      };

      const [
        totalProjectsResult,
        activeSitesResult,
        expensesResult,
        laborResult
      ] = await Promise.all([
        supabase.from('sites').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('sites').select('*', { count: 'exact', head: true }).is('deleted_at', null).not('status', 'in', '("Completed","On Hold")'),
        fetchThisMonthExpenses(),
        supabase.from('site_labor_daily').select('*').eq('work_date', todayStr)
      ]);

      if (totalProjectsResult.error) throw totalProjectsResult.error;
      if (activeSitesResult.error) throw activeSitesResult.error;
      if (expensesResult.error) throw expensesResult.error;
      if (laborResult.error) throw laborResult.error;

      const thisMonthExpenses = expensesResult.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const totalActiveLabor = laborResult.data?.reduce((sum, item) => {
        return sum + calculateRecordLaborCount(item);
      }, 0) || 0;

      const metrics: DashboardMetrics = {
        activeSites: activeSitesResult.count || 0,
        totalProjects: totalProjectsResult.count || 0,
        totalActiveLabor,
        thisMonthExpenses,
      };

      if (currentUserId) {
        await offlineStorage.set(currentUserId, 'dashboard_metrics', metrics);
      }

      return { data: metrics, isCached: false, cachedAt: null };
    } catch (err) {
      if (__DEV__) {
        console.warn('[dashboard] Remote metrics fetch failed, trying cache:', err);
      }
      if (currentUserId) {
        const cached = await offlineStorage.get<DashboardMetrics>(currentUserId, 'dashboard_metrics');
        if (cached && cached.data) {
          return { data: cached.data, isCached: true, cachedAt: cached.cachedAt };
        }
      }
      throw new Error(formatDatabaseError(err, 'Failed to fetch dashboard metrics.'));
    }
  }

  // Offline
  if (currentUserId) {
    const cached = await offlineStorage.get<DashboardMetrics>(currentUserId, 'dashboard_metrics');
    if (cached && cached.data) {
      return { data: cached.data, isCached: true, cachedAt: cached.cachedAt };
    }
  }

  throw new Error('Unable to connect. No cached dashboard metrics available.');
}

export async function getDashboardMetrics(userId?: string): Promise<DashboardMetrics> {
  const res = await getDashboardMetricsWithCache(userId);
  return res.data;
}

export async function getRecentActivity(userId?: string): Promise<ActivityItem[]> {
  const currentUserId = await resolveUserId(userId);
  const isConnected = networkStatus.getNetworkState().isConnected;

  if (isConnected) {
    try {
      const [
        materialsResult,
        expensesResult,
        laborResult
      ] = await Promise.all([
        supabase.from('materials').select('id, name, created_at, sites(name)').is('deleted_at', null).order('created_at', { ascending: false }).limit(3),
        supabase.from('expenses').select('id, title, created_at, sites(name)').is('deleted_at', null).order('created_at', { ascending: false }).limit(3),
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

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const top5 = activities.slice(0, 5);

      if (currentUserId) {
        await offlineStorage.set(currentUserId, 'dashboard_activity', top5);
      }

      return top5;
    } catch (err) {
      if (__DEV__) {
        console.warn('[dashboard] Activity fetch failed, checking cache:', err);
      }
      if (currentUserId) {
        const cached = await offlineStorage.get<ActivityItem[]>(currentUserId, 'dashboard_activity');
        if (cached && cached.data) {
          return cached.data;
        }
      }
      return [];
    }
  }

  // Offline
  if (currentUserId) {
    const cached = await offlineStorage.get<ActivityItem[]>(currentUserId, 'dashboard_activity');
    if (cached && cached.data) {
      return cached.data;
    }
  }

  return [];
}
