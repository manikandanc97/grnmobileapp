import { supabase } from '@/lib/supabase';
import { Database, AttendanceRow } from '@/types/database';
import { formatDatabaseError } from './sites';

export type AttendanceStatus = 'Present' | 'Absent' | 'Not Marked' | 'Half Day';
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert'];
export type AttendanceUpdate = Database['public']['Tables']['attendance']['Update'];

/**
 * Format a JS Date to a date-only string (YYYY-MM-DD) in local time,
 * avoiding timezone offset bugs.
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  const { data, error } = await supabase
    .from('attendance')
    .upsert(upsertPayload, { onConflict: 'worker_id,date' })
    .select()
    .single();

  if (error) {
    throw new Error(formatDatabaseError(error, 'Failed to mark attendance.'));
  }

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
