import { supabase } from '@/lib/supabase';
import { Database, AttendanceRow } from '@/types/database';
import { formatDatabaseError } from './sites';
import { dataSync } from '@/lib/dataSync';
import { getWorkerById } from './workers';
import { syncWorkerPayroll } from './payroll';
import { formatInTimeZone } from 'date-fns-tz';
import { getStartOfWeek, getEndOfWeek, getStartOfMonth, getStartOfNextMonth } from '@/lib/dateUtils';
import { subDays } from 'date-fns';

export type AttendanceStatus = 'Present' | 'Absent' | 'Not Marked' | 'Half Day';
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert'];
export type AttendanceUpdate = Database['public']['Tables']['attendance']['Update'];

export function toDateString(date: Date): string {
  return formatInTimeZone(date, 'Asia/Kolkata', 'yyyy-MM-dd');
}

/**
 * Fetch all attendance records for a specific date.
 * Returns a map of worker_id -> AttendanceRow for O(1) lookup.
 */
export async function getAttendanceForDate(
  date: Date,
): Promise<Map<string, AttendanceRow>> {
  const dateStr = toDateString(date);

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', dateStr);

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to fetch attendance records.'));
  }

  const map = new Map<string, AttendanceRow>();
  for (const row of data ?? []) {
    map.set(row.worker_id, row);
  }
  return map;
}

/**
 * Upsert an attendance record for a (worker_id, date) pair.
 * Uses the unique constraint (worker_id, date) — if a row exists it's updated,
 * otherwise it's inserted. Returns the resulting row.
 */
export async function markAttendance(
  workerId: string,
  siteId: string,
  date: Date,
  status: AttendanceStatus,
): Promise<AttendanceRow> {
  const dateStr = toDateString(date);

  const upsertPayload: AttendanceInsert = {
    worker_id: workerId,
    site_id: siteId,
    date: dateStr,
    status,
  };

  const [data, worker] = await Promise.all([
    supabase
      .from('attendance')
      .upsert(upsertPayload, { onConflict: 'worker_id,date' })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) throw new Error(formatDatabaseError(error, 'Failed to mark attendance.'));
        return data as AttendanceRow;
      }),
    getWorkerById(workerId),
  ]);

  // Sync Payroll — runs after both the upsert and worker fetch complete
  if (worker) {
    const d = new Date(dateStr);
    let periodStart = dateStr;
    let periodEnd = dateStr;

    if (worker.pay_frequency === 'Weekly') {
      const startOfWeek = getStartOfWeek(d);
      const endOfWeek = getEndOfWeek(d);
      periodStart = toDateString(startOfWeek);
      periodEnd = toDateString(endOfWeek);
    } else if (worker.pay_frequency === 'Monthly') {
      const startOfMonth = getStartOfMonth(d);
      const endOfMonth = subDays(getStartOfNextMonth(d), 1);
      periodStart = toDateString(startOfMonth);
      periodEnd = toDateString(endOfMonth);
    }

    await syncWorkerPayroll(
      workerId,
      siteId,
      worker.pay_frequency,
      worker.salary_amount,
      periodStart,
      periodEnd
    );
  }

  dataSync.notify({ entity: 'attendance', action: 'update', payload: data });
  return data;
}


/**
 * Fetch attendance history for a single worker, sorted newest first.
 */
export async function getWorkerAttendanceHistory(
  workerId: string,
): Promise<AttendanceRow[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('worker_id', workerId)
    .order('date', { ascending: false });

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to fetch attendance history.'));
  }

  return data ?? [];
}
