import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { formatDatabaseError } from './sites';
import { dataSync } from '@/lib/dataSync';
import { createNotification } from './notifications';
import { offlineStorage } from './offlineStorage';
import { offlineQueue, generateUUID } from './offlineQueue';
import { networkStatus } from './networkStatus';
import { normalizeExpenseCategory, toLegacyExpenseCategory } from '@/lib/constants/expenses';

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

async function resolveUserId(userId?: string): Promise<string> {
  if (userId) return userId;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || '';
  } catch {
    return '';
  }
}

export interface ExpensesFetchResult {
  data: ExpenseWithSite[];
  isCached: boolean;
  cachedAt: string | null;
}

/**
 * Fetch all expenses with offline cache fallback
 */
export async function getExpensesWithCache(siteId?: string, userId?: string): Promise<ExpensesFetchResult> {
  const currentUserId = await resolveUserId(userId);
  const cacheKey = `expenses_${siteId || 'all'}`;
  const isConnected = networkStatus.getNetworkState().isConnected;

  if (isConnected) {
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          sites (
            name
          )
        `)
        .is('deleted_at', null)
        .order('expense_date', { ascending: false });

      if (siteId) {
        query = query.eq('site_id', siteId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const items = (data as any) ?? [];
      if (currentUserId) {
        await offlineStorage.set(currentUserId, cacheKey, items);
      }
      return { data: items, isCached: false, cachedAt: null };
    } catch (err) {
      if (__DEV__) {
        console.warn('[expenses] Remote fetch failed, trying cache:', err);
      }
      if (currentUserId) {
        const cached = await offlineStorage.get<ExpenseWithSite[]>(currentUserId, cacheKey);
        if (cached && cached.data) {
          return { data: cached.data, isCached: true, cachedAt: cached.cachedAt };
        }
      }
      throw new Error(formatDatabaseError(err, 'Failed to fetch expenses.'));
    }
  }

  // Offline
  if (currentUserId) {
    const cached = await offlineStorage.get<ExpenseWithSite[]>(currentUserId, cacheKey);
    if (cached && cached.data) {
      return { data: cached.data, isCached: true, cachedAt: cached.cachedAt };
    }
  }

  throw new Error('Unable to connect. No cached expenses available.');
}

export async function getExpenses(siteId?: string, userId?: string): Promise<ExpenseWithSite[]> {
  const res = await getExpensesWithCache(siteId, userId);
  return res.data;
}

/**
 * Fetch a single expense by ID with offline cache fallback
 */
export async function getExpenseById(id: string, userId?: string): Promise<ExpenseWithSite | null> {
  const currentUserId = await resolveUserId(userId);
  const isConnected = networkStatus.getNetworkState().isConnected;

  if (isConnected) {
    try {
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
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      if (data && currentUserId) {
        await offlineStorage.set(currentUserId, `expense_${id}`, data);
      }
      return (data as any) ?? null;
    } catch (err) {
      if (currentUserId) {
        const cached = await offlineStorage.get<ExpenseWithSite>(currentUserId, `expense_${id}`);
        if (cached) return cached.data;
      }
      throw new Error(formatDatabaseError(err, 'Failed to fetch expense details.'));
    }
  }

  // Offline
  if (currentUserId) {
    const cached = await offlineStorage.get<ExpenseWithSite>(currentUserId, `expense_${id}`);
    if (cached) return cached.data;
  }

  throw new Error('Unable to connect to fetch expense details.');
}

/**
 * Create a new expense with offline queue support
 */
export async function createExpense(expense: ExpenseInsert, userId?: string): Promise<ExpenseWithSite> {
  const currentUserId = await resolveUserId(userId || expense.owner_id);
  const expenseId = generateUUID();

  const insertPayload: ExpenseInsert = {
    ...expense,
    id: expenseId,
    owner_id: currentUserId,
    category: normalizeExpenseCategory(expense.category),
  };

  const isConnected = networkStatus.getNetworkState().isConnected;

  if (!isConnected && currentUserId) {
    const optimisticRow: ExpenseWithSite = {
      ...(insertPayload as any),
      id: expenseId,
      owner_id: currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      sites: { name: 'Site' },
    };

    await offlineQueue.enqueue({
      owner_id: currentUserId,
      entity_type: 'expenses',
      entity_id: expenseId,
      operation_type: 'create',
      payload: insertPayload,
      parent_id: expense.site_id,
    });

    const cacheKey = `expenses_${expense.site_id}`;
    const cached = await offlineStorage.get<ExpenseWithSite[]>(currentUserId, cacheKey);
    const list = cached?.data || [];
    await offlineStorage.set(currentUserId, cacheKey, [optimisticRow, ...list]);

    dataSync.notify({ entity: 'expenses', action: 'create', payload: optimisticRow });
    return optimisticRow;
  }

  try {
    let finalPayload: ExpenseInsert = insertPayload;
    let { data, error } = await supabase
      .from('expenses')
      .upsert(finalPayload, { onConflict: 'id' })
      .select(`
        *,
        sites (
          name
        )
      `)
      .single();

    // Fallback: If remote DB only allows Migration 001 categories ('Materials', 'Labor', 'Transport', 'Equipment', 'Other')
    if (error && (error.code === '23514' || error.message?.includes('expenses_category_check'))) {
      const legacyCategory = toLegacyExpenseCategory(finalPayload.category);
      finalPayload = { ...finalPayload, category: legacyCategory };
      const retryRes = await supabase
        .from('expenses')
        .upsert(finalPayload, { onConflict: 'id' })
        .select(`
          *,
          sites (
            name
          )
        `)
        .single();
      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) throw error;

    const created = data as ExpenseWithSite;
    if (currentUserId) {
      await offlineStorage.set(currentUserId, `expense_${created.id}`, created);
    }

    dataSync.notify({ entity: 'expenses', action: 'create', payload: created });

    const siteName = getExpenseSiteName(created);
    createNotification({
      title: 'New Expense Added',
      message: `₹${Number(created.amount || 0).toLocaleString('en-IN')} added for ${created.category || 'project'} (${siteName})`,
      type: 'expense',
      site_id: created.site_id,
    }).catch(() => {});

    return created;
  } catch (err: any) {
    const isNetwork =
      err?.message?.includes('Network request failed') ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('timeout');

    if (isNetwork && currentUserId) {
      const optimisticRow: ExpenseWithSite = {
        ...(insertPayload as any),
        id: expenseId,
        owner_id: currentUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        sites: { name: 'Site' },
      };

      await offlineQueue.enqueue({
        owner_id: currentUserId,
        entity_type: 'expenses',
        entity_id: expenseId,
        operation_type: 'create',
        payload: insertPayload,
        parent_id: expense.site_id,
      });

      dataSync.notify({ entity: 'expenses', action: 'create', payload: optimisticRow });
      return optimisticRow;
    }

    throw new Error(formatDatabaseError(err, 'Failed to add expense.'));
  }
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  id: string,
  params: Partial<ExpenseUpdate>,
  userId?: string,
): Promise<ExpenseWithSite> {
  const currentUserId = await resolveUserId(userId);
  const updatePayload: ExpenseUpdate = {
    ...params,
    ...(params.category ? { category: normalizeExpenseCategory(params.category) } : {}),
    updated_at: new Date().toISOString(),
  };

  const isConnected = networkStatus.getNetworkState().isConnected;

  if (!isConnected && currentUserId) {
    await offlineQueue.enqueue({
      owner_id: currentUserId,
      entity_type: 'expenses',
      entity_id: id,
      operation_type: 'update',
      payload: updatePayload,
      parent_id: params.site_id,
    });

    const cached = await offlineStorage.get<ExpenseWithSite>(currentUserId, `expense_${id}`);
    const updatedRow = { ...(cached?.data || {}), ...updatePayload, id } as ExpenseWithSite;
    await offlineStorage.set(currentUserId, `expense_${id}`, updatedRow);

    dataSync.notify({ entity: 'expenses', action: 'update', payload: updatedRow });
    return updatedRow;
  }

  let { data, error } = await supabase
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

  if (error && (error.code === '23514' || error.message?.includes('expenses_category_check')) && updatePayload.category) {
    const legacyCategory = toLegacyExpenseCategory(updatePayload.category);
    const retryRes = await supabase
      .from('expenses')
      .update({ ...updatePayload, category: legacyCategory })
      .eq('id', id)
      .select(`
        *,
        sites (
          name
        )
      `)
      .single();
    data = retryRes.data;
    error = retryRes.error;
  }

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to update expense.'));
  }

  const updated = data as ExpenseWithSite;
  if (currentUserId) {
    await offlineStorage.set(currentUserId, `expense_${id}`, updated);
  }

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

  const currentUserId = await resolveUserId();
  if (currentUserId) {
    await offlineStorage.remove(currentUserId, `expense_${id}`);
  }

  dataSync.notify({ entity: 'expenses', action: 'delete', payload: { id } });
}

