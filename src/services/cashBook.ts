import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { formatDatabaseError } from './sites';
import { dataSync } from '@/lib/dataSync';

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
 * Create a new cash transaction.
 * owner_id is NOT accepted from the UI — it's set via the RLS default.
 */
export async function createCashTransaction(
  params: Omit<CashTransactionInsert, 'owner_id' | 'id'>,
): Promise<CashTransactionRow> {
  const { data, error } = await supabase
    .from('site_cash_transactions')
    .insert(params)
    .select()
    .single();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to add cash transaction.'));
  }

  dataSync.notify({ entity: 'site_cash', action: 'create', payload: data });
  return data;
}

/**
 * Update an existing cash transaction.
 * owner_id cannot be changed — only date, particulars, amount, type.
 */
export async function updateCashTransaction(
  id: string,
  params: Pick<CashTransactionUpdate, 'transaction_type' | 'transaction_date' | 'particulars' | 'amount'>,
): Promise<CashTransactionRow> {
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
}

/**
 * Delete a cash transaction (hard delete — cash ledger should be accurate).
 * Balance recalculates automatically on next query.
 */
export async function deleteCashTransaction(id: string): Promise<void> {
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
