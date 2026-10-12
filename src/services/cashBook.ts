import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { formatDatabaseError } from './sites';
import { dataSync } from '@/lib/dataSync';
import { createNotification } from './notifications';
import { offlineStorage } from './offlineStorage';
import { offlineQueue, generateUUID } from './offlineQueue';
import { networkStatus } from './networkStatus';

async function resolveUserId(userId?: string): Promise<string> {
  if (userId) return userId;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || '';
  } catch {
    return '';
  }
}

export type CashTransactionRow = Database['public']['Tables']['site_cash_transactions']['Row'];
export type CashTransactionInsert = Database['public']['Tables']['site_cash_transactions']['Insert'];
export type CashTransactionUpdate = Database['public']['Tables']['site_cash_transactions']['Update'];

export type TransactionType = 'INWARD' | 'OUTWARD';

export interface CashBookSummary {
  totalInward: number;
  totalOutward: number;
  cashOnHand: number;
}

export interface CashBookPeriodSummary extends CashBookSummary {
  openingBalance: number;
  closingBalance: number;
  periodInward: number;
  periodOutward: number;
}

export interface CashTransactionsFetchResult {
  data: CashTransactionRow[];
  isCached: boolean;
  cachedAt: string | null;
}

export interface CashBookSummaryFetchResult {
  data: CashBookSummary;
  isCached: boolean;
  cachedAt: string | null;
}

/**
 * Returns today's date as a YYYY-MM-DD string in Asia/Kolkata timezone.
 * Never uses toISOString() to avoid UTC offset shifting business dates.
 */
export function getTodayLocalDate(): string {
  const now = new Date();
  // Use Intl for IST-safe local date parts
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  // en-CA format is already YYYY-MM-DD
  return parts;
}

/**
 * Formats a YYYY-MM-DD date string into a human-readable display string.
 * e.g. "2026-10-06" → "06 Oct 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  // Parse as local date (treat as IST, avoid UTC midnight shift)
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Fetch all non-deleted cash transactions for a site with offline caching
 */
export async function getCashTransactionsWithCache(
  siteId: string,
  options?: {
    fromDate?: string;
    toDate?: string;
    searchQuery?: string;
    transactionType?: TransactionType;
  },
  userId?: string,
): Promise<CashTransactionsFetchResult> {
  const currentUserId = await resolveUserId(userId);
  const cacheKey = `cash_tx_${siteId}_${options?.fromDate || 'all'}_${options?.toDate || 'all'}_${options?.transactionType || 'all'}`;
  const isConnected = networkStatus.getNetworkState().isConnected;

  if (isConnected) {
    try {
      const data = await getCashTransactions(siteId, options);
      if (currentUserId && !options?.searchQuery) {
        await offlineStorage.set(currentUserId, cacheKey, data);
      }
      return { data, isCached: false, cachedAt: null };
    } catch (err) {
      if (__DEV__) {
        console.warn('[cashBook] Remote fetch failed, trying cache:', err);
      }
      if (currentUserId) {
        const cached = await offlineStorage.get<CashTransactionRow[]>(currentUserId, cacheKey);
        if (cached && cached.data) {
          let filtered = cached.data;
          if (options?.searchQuery?.trim()) {
            const q = options.searchQuery.trim().toLowerCase();
            filtered = filtered.filter((t) => t.particulars.toLowerCase().includes(q));
          }
          return { data: filtered, isCached: true, cachedAt: cached.cachedAt };
        }
      }
      throw new Error(formatDatabaseError(err, 'Failed to fetch cash transactions.'));
    }
  }

  // Offline
  if (currentUserId) {
    const cached = await offlineStorage.get<CashTransactionRow[]>(currentUserId, cacheKey);
    if (cached && cached.data) {
      let filtered = cached.data;
      if (options?.searchQuery?.trim()) {
        const q = options.searchQuery.trim().toLowerCase();
        filtered = filtered.filter((t) => t.particulars.toLowerCase().includes(q));
      }
      return { data: filtered, isCached: true, cachedAt: cached.cachedAt };
    }
  }

  throw new Error('No offline cash records available for this site. Connect to internet to download.');
}

/**
 * Compute Cash Book summary with offline cache fallback
 */
export async function getCashBookSummaryWithCache(
  siteId: string,
  userId?: string,
): Promise<CashBookSummaryFetchResult> {
  const currentUserId = await resolveUserId(userId);
  const cacheKey = `cash_summary_${siteId}`;
  const isConnected = networkStatus.getNetworkState().isConnected;

  if (isConnected) {
    try {
      const summary = await getCashBookSummary(siteId);
      if (currentUserId) {
        await offlineStorage.set(currentUserId, cacheKey, summary);
      }
      return { data: summary, isCached: false, cachedAt: null };
    } catch (err) {
      if (__DEV__) {
        console.warn('[cashBook] Remote summary failed, trying cache:', err);
      }
      if (currentUserId) {
        const cached = await offlineStorage.get<CashBookSummary>(currentUserId, cacheKey);
        if (cached && cached.data) {
          return { data: cached.data, isCached: true, cachedAt: cached.cachedAt };
        }
      }
      throw new Error(formatDatabaseError(err, 'Failed to compute cash book summary.'));
    }
  }

  // Offline
  if (currentUserId) {
    const cached = await offlineStorage.get<CashBookSummary>(currentUserId, cacheKey);
    if (cached && cached.data) {
      return { data: cached.data, isCached: true, cachedAt: cached.cachedAt };
    }
  }

  return {
    data: { totalInward: 0, totalOutward: 0, cashOnHand: 0 },
    isCached: true,
    cachedAt: null,
  };
}

/**
 * Fetch all non-deleted cash transactions for a site, ordered by date descending.
 * Optionally filtered by date range.
 */
export async function getCashTransactions(
  siteId: string,
  options?: {
    fromDate?: string;
    toDate?: string;
    searchQuery?: string;
    transactionType?: TransactionType;
  },
): Promise<CashTransactionRow[]> {
  let query = supabase
    .from('site_cash_transactions')
    .select('*')
    .eq('site_id', siteId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (options?.fromDate) {
    query = query.gte('transaction_date', options.fromDate);
  }
  if (options?.toDate) {
    query = query.lte('transaction_date', options.toDate);
  }
  if (options?.transactionType) {
    query = query.eq('transaction_type', options.transactionType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to fetch cash transactions.'));
  }

  let result: CashTransactionRow[] = data ?? [];

  // Partial-match search on particulars (client-side for simplicity and flexibility)
  if (options?.searchQuery && options.searchQuery.trim()) {
    const q = options.searchQuery.trim().toLowerCase();
    result = result.filter((t) => t.particulars.toLowerCase().includes(q));
  }

  return result;
}

/**
 * Fetch a single cash transaction by ID.
 */
export async function getCashTransactionById(id: string): Promise<CashTransactionRow | null> {
  const { data, error } = await supabase
    .from('site_cash_transactions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to fetch cash transaction.'));
  }

  return data;
}

/**
 * Compute Cash Book summary (totalInward, totalOutward, cashOnHand)
 * from all transactions for a site. RLS ensures account isolation.
 */
export async function getCashBookSummary(siteId: string): Promise<CashBookSummary> {
  const { data, error } = await supabase
    .from('site_cash_transactions')
    .select('transaction_type, amount')
    .eq('site_id', siteId);

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to compute cash book summary.'));
  }

  const rows = data ?? [];
  const totalInward = rows
    .filter((r) => r.transaction_type === 'INWARD')
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const totalOutward = rows
    .filter((r) => r.transaction_type === 'OUTWARD')
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return {
    totalInward,
    totalOutward,
    cashOnHand: totalInward - totalOutward,
  };
}

/**
 * Compute cash balance as of (before) a specific date.
 * Used for opening balance calculations.
 * Returns total inward minus total outward for transactions BEFORE the given date.
 */
async function getBalanceBeforeDate(siteId: string, date: string): Promise<number> {
  const { data, error } = await supabase
    .from('site_cash_transactions')
    .select('transaction_type, amount')
    .eq('site_id', siteId)
    .lt('transaction_date', date);

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to compute opening balance.'));
  }

  const rows = data ?? [];
  const inward = rows
    .filter((r) => r.transaction_type === 'INWARD')
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const outward = rows
    .filter((r) => r.transaction_type === 'OUTWARD')
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return inward - outward;
}

/**
 * Compute cash book period summary for a date range.
 * Includes opening balance (before fromDate), period movement, and closing balance.
 */
export async function getCashBookPeriodSummary(
  siteId: string,
  fromDate: string,
  toDate: string,
): Promise<CashBookPeriodSummary> {
  const [openingBalance, periodData] = await Promise.all([
    getBalanceBeforeDate(siteId, fromDate),
    supabase
      .from('site_cash_transactions')
      .select('transaction_type, amount')
      .eq('site_id', siteId)
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate),
  ]);

  if (periodData.error) {
    throw new Error(formatDatabaseError(periodData.error, 'Failed to compute period summary.'));
  }

  const rows = periodData.data ?? [];
  const periodInward = rows
    .filter((r) => r.transaction_type === 'INWARD')
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const periodOutward = rows
    .filter((r) => r.transaction_type === 'OUTWARD')
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);

  const closingBalance = openingBalance + periodInward - periodOutward;

  return {
    openingBalance,
    totalInward: periodInward,
    totalOutward: periodOutward,
    cashOnHand: closingBalance,
    periodInward,
    periodOutward,
    closingBalance,
  };
}

/**
 * Create a new cash transaction with offline queue support and client-generated UUID.
 * owner_id is derived from active session.
 */
export async function createCashTransaction(
  params: Omit<CashTransactionInsert, 'owner_id' | 'id'>,
  userId?: string,
): Promise<CashTransactionRow> {
  const currentUserId = await resolveUserId(userId);
  const isConnected = networkStatus.getNetworkState().isConnected;
  const clientUUID = generateUUID();

  if (!isConnected) {
    if (!currentUserId) {
      throw new Error('You must be signed in to record cash transactions offline.');
    }

    const localRecord: CashTransactionRow = {
      id: clientUUID,
      owner_id: currentUserId,
      site_id: params.site_id,
      transaction_date: params.transaction_date,
      transaction_type: params.transaction_type,
      particulars: params.particulars,
      amount: params.amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await offlineQueue.enqueue({
      owner_id: currentUserId,
      entity_type: 'site_cash',
      entity_id: clientUUID,
      operation_type: 'create',
      payload: params,
      parent_id: params.site_id,
    });

    // Update offline cache for this site's general transactions list
    const cacheKey = `cash_tx_${params.site_id}_all_all_all`;
    const cached = await offlineStorage.get<CashTransactionRow[]>(currentUserId, cacheKey);
    const existing = cached?.data ?? [];
    await offlineStorage.set(currentUserId, cacheKey, [localRecord, ...existing]);

    dataSync.notify({ entity: 'site_cash', action: 'create', payload: localRecord });
    return localRecord;
  }

  try {
    const { data, error } = await supabase
      .from('site_cash_transactions')
      .upsert({ id: clientUUID, ...params }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      throw new Error(formatDatabaseError(error, 'Failed to add cash transaction.'));
    }

    if (currentUserId) {
      const cacheKey = `cash_tx_${params.site_id}_all_all_all`;
      const cached = await offlineStorage.get<CashTransactionRow[]>(currentUserId, cacheKey);
      const existing = (cached?.data ?? []).filter((t) => t.id !== data.id);
      await offlineStorage.set(currentUserId, cacheKey, [data, ...existing]);
    }

    dataSync.notify({ entity: 'site_cash', action: 'create', payload: data });

    createNotification({
      title: params.transaction_type === 'INWARD' ? 'Cash Inward Received' : 'Cash Outward Payment',
      message: `₹${Number(data.amount || 0).toLocaleString('en-IN')} - ${data.particulars || 'Transaction'}`,
      type: 'expense',
      site_id: data.site_id,
    }).catch(() => {});

    return data;
  } catch (err: any) {
    if (currentUserId && !networkStatus.getNetworkState().isConnected) {
      await offlineQueue.enqueue({
        owner_id: currentUserId,
        entity_type: 'site_cash',
        entity_id: clientUUID,
        operation_type: 'create',
        payload: params,
        parent_id: params.site_id,
      });
      const localRecord: CashTransactionRow = {
        id: clientUUID,
        owner_id: currentUserId,
        site_id: params.site_id,
        transaction_date: params.transaction_date,
        transaction_type: params.transaction_type,
        particulars: params.particulars,
        amount: params.amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      dataSync.notify({ entity: 'site_cash', action: 'create', payload: localRecord });
      return localRecord;
    }
    throw err;
  }
}

/**
 * Update an existing cash transaction.
 * owner_id cannot be changed — only date, particulars, amount, type.
 */
export async function updateCashTransaction(
  id: string,
  params: Pick<CashTransactionUpdate, 'transaction_type' | 'transaction_date' | 'particulars' | 'amount'>,
  userId?: string,
): Promise<CashTransactionRow> {
  const currentUserId = await resolveUserId(userId);
  const isConnected = networkStatus.getNetworkState().isConnected;

  if (!isConnected) {
    if (!currentUserId) throw new Error('Offline update requires active login.');
    await offlineQueue.enqueue({
      owner_id: currentUserId,
      entity_type: 'site_cash',
      entity_id: id,
      operation_type: 'update',
      payload: params,
    });
    dataSync.notify({ entity: 'site_cash', action: 'update', payload: { id, ...params } as any });
    return { id, ...params } as any;
  }

  try {
    const { data, error } = await supabase
      .from('site_cash_transactions')
      .update({ ...params, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(formatDatabaseError(error, 'Failed to update cash transaction.'));
    }

    dataSync.notify({ entity: 'site_cash', action: 'update', payload: data });
    return data;
  } catch (err: any) {
    if (currentUserId && !networkStatus.getNetworkState().isConnected) {
      await offlineQueue.enqueue({
        owner_id: currentUserId,
        entity_type: 'site_cash',
        entity_id: id,
        operation_type: 'update',
        payload: params,
      });
      dataSync.notify({ entity: 'site_cash', action: 'update', payload: { id, ...params } as any });
      return { id, ...params } as any;
    }
    throw err;
  }
}

/**
 * Delete a cash transaction (hard delete — cash ledger should be accurate).
 * Balance recalculates automatically on next query.
 */
export async function deleteCashTransaction(id: string, userId?: string): Promise<void> {
  const currentUserId = await resolveUserId(userId);
  const isConnected = networkStatus.getNetworkState().isConnected;

  if (!isConnected) {
    if (!currentUserId) throw new Error('Offline delete requires active login.');
    await offlineQueue.enqueue({
      owner_id: currentUserId,
      entity_type: 'site_cash',
      entity_id: id,
      operation_type: 'delete',
      payload: {},
    });
    dataSync.notify({ entity: 'site_cash', action: 'delete', payload: { id } });
    return;
  }

  const { error } = await supabase
    .from('site_cash_transactions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to delete cash transaction.'));
  }

  dataSync.notify({ entity: 'site_cash', action: 'delete', payload: { id } });
}

/**
 * Compute running balance array for a list of transactions ordered oldest→newest.
 * Returns transactions annotated with their running balance at each point.
 */
export function computeRunningBalance(
  transactions: CashTransactionRow[],
  openingBalance: number = 0,
): (CashTransactionRow & { runningBalance: number })[] {
  // Sort oldest first for running balance computation
  const sorted = [...transactions].sort((a, b) => {
    const dateDiff = a.transaction_date.localeCompare(b.transaction_date);
    if (dateDiff !== 0) return dateDiff;
    return a.created_at.localeCompare(b.created_at);
  });

  let balance = openingBalance;
  const result = sorted.map((t) => {
    if (t.transaction_type === 'INWARD') {
      balance += t.amount;
    } else {
      balance -= t.amount;
    }
    return { ...t, runningBalance: balance };
  });

  // Return in display order: newest first
  return result.reverse();
}
