import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { formatDatabaseError } from './sites';
import { dataSync } from '@/lib/dataSync';

export type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];

export type ExpenseWithSite = ExpenseRow & {
  sites: { name: string } | null;
};

/**
 * Returns the site name from a joined expense row, handling PostgREST array/object quirks.
 */
export function getExpenseSiteName(expense: ExpenseWithSite): string {
  if (!expense.sites) return 'Unknown Site';
  // Sometimes PostgREST returns an array for joins, sometimes a single object
  const sitesObj = expense.sites as any;
  if (Array.isArray(sitesObj)) {
    return sitesObj[0]?.name ?? 'Unknown Site';
  }
  return expense.sites.name ?? 'Unknown Site';
}

/**
 * Fetch all expenses (not soft-deleted), joined with site name.
 * Optionally filter by site_id.
 * Results are sorted newest-date first.
 */
export async function getExpenses(siteId?: string): Promise<ExpenseWithSite[]> {
  let query = supabase
    .from('expenses')
    .select(`
      *,
      sites (
        name
      )
    `)
    .is('deleted_at', null)
    .order('date', { ascending: false });

  if (siteId) {
    query = query.eq('site_id', siteId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to fetch expenses.'));
  }

  return (data as any) ?? [];
}

/**
 * Fetch a single expense by ID.
 */
export async function getExpenseById(id: string): Promise<ExpenseWithSite | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      sites (
        name
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(formatDatabaseError(error, 'Failed to fetch expense details.'));
  }

  return (data as any) ?? null;
}

/**
 * Create a new expense.
 */
export async function createExpense(expense: ExpenseInsert): Promise<ExpenseWithSite> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select(`
      *,
      sites (
        name
      )
    `)
    .single();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to add expense.'));
  }

  const created = data as ExpenseWithSite;
  dataSync.notify({ entity: 'expenses', action: 'create', payload: created });
  return created;
}

/**
 * Update an existing expense.
 */
export async function updateExpense(
  id: string,
  params: Partial<ExpenseUpdate>,
): Promise<ExpenseWithSite> {
  const updatePayload: ExpenseUpdate = {
    ...params,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('expenses')
    .update(updatePayload)
    .eq('id', id)
    .select(`
      *,
      sites (
        name
      )
    `)
    .single();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to update expense.'));
  }

  const updated = data as ExpenseWithSite;
  dataSync.notify({ entity: 'expenses', action: 'update', payload: updated });
  return updated;
}

/**
 * Soft delete an expense by setting deleted_at to current timestamp.
 */
export async function softDeleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to delete expense.'));
  }

  dataSync.notify({ entity: 'expenses', action: 'delete', payload: { id } });
}

