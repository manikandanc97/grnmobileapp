import { supabase } from '@/lib/supabase';
import { ActivityItem } from '@/types/dashboard';

export interface DashboardMetrics {
  activeSites: number;
  totalProjects: number;
  workersPresent: number;
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

  const [
    totalProjectsResult,
    activeSitesResult,
    expensesResult,
    attendanceResult
  ] = await Promise.all([
    // 1. Total Projects (non-deleted)
    supabase.from('sites').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    
    // 2. Active Sites (non-deleted, not Completed/On Hold)
    supabase.from('sites').select('*', { count: 'exact', head: true }).is('deleted_at', null).not('status', 'in', '("Completed","On Hold")'),
    
    // 3. This Month Expenses
    supabase.from('expenses').select('amount').gte('date', firstDayOfMonthStr).is('deleted_at', null),
    
    // 4. Workers Present Today
    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', todayStr).eq('status', 'Present')
  ]);

  if (totalProjectsResult.error) throw totalProjectsResult.error;
  if (activeSitesResult.error) throw activeSitesResult.error;
  if (expensesResult.error) throw expensesResult.error;
  if (attendanceResult.error) throw attendanceResult.error;

  const thisMonthExpenses = expensesResult.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

  return {
    activeSites: activeSitesResult.count || 0,
    totalProjects: totalProjectsResult.count || 0,
    workersPresent: attendanceResult.count || 0,
    thisMonthExpenses,
  };
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  const [
    materialsResult,
    workersResult,
    expensesResult,
    attendanceResult
  ] = await Promise.all([
    // Fetch recent material added
    supabase.from('materials').select('id, name, created_at, sites(name)').is('deleted_at', null).order('created_at', { ascending: false }).limit(3),
    
    // Fetch recent workers added
    supabase.from('workers').select('id, name, created_at, sites(name)').is('deleted_at', null).order('created_at', { ascending: false }).limit(3),
    
    // Fetch recent expenses
    supabase.from('expenses').select('id, title, created_at, sites(name)').is('deleted_at', null).order('created_at', { ascending: false }).limit(3),
    
    // Fetch recent attendance
    supabase.from('attendance').select('id, date, created_at, sites(name)').order('created_at', { ascending: false }).limit(3)
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

  if (workersResult.data) {
    workersResult.data.forEach(w => {
      activities.push({
        id: `work-${w.id}`,
        title: `New worker joined: ${w.name}`,
        siteName: (w.sites as any)?.name || 'Unknown Site',
        timestamp: w.created_at,
        type: 'labor'
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

  if (attendanceResult.data) {
    attendanceResult.data.forEach(a => {
      activities.push({
        id: `att-${a.id}`,
        title: `Attendance marked for ${a.date}`,
        siteName: (a.sites as any)?.name || 'Unknown Site',
        timestamp: a.created_at,
        type: 'labor'
      });
    });
  }

  // Sort chronologically (newest first)
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Return top 5
  return activities.slice(0, 5);
}
