import { supabase } from '@/lib/supabase';
import { Database, PayrollRecordRow } from '@/types/database';
import { formatDatabaseError } from './sites';
import { dataSync } from '@/lib/dataSync';

export type PayrollInsert = Database['public']['Tables']['payroll_records']['Insert'];

/**
 * Fetch payroll records for a site.
 */
export async function getPayrollRecords(siteId: string): Promise<PayrollRecordRow[]> {
  const { data, error } = await supabase
    .from('payroll_records')
    .select('*')
    .eq('site_id', siteId)
    .order('pay_period_start', { ascending: false });

  if (error) {
    if (
      error.code === 'PGRST205' ||
      error.message?.includes('schema cache') ||
      error.message?.includes('does not exist')
    ) {
      console.warn(
        '[Payroll] Note: Table "payroll_records" not found in Supabase database. Apply migration 003_financial_architecture.sql to activate labor cost tracking.'
      );
      return [];
    }
    console.error('getPayrollRecords error:', error);
    throw new Error(formatDatabaseError(error, 'Failed to fetch payroll records.'));
  }

  return (data || []) as PayrollRecordRow[];
}

/**
 * Sync payroll records for a worker based on attendance and their salary configuration.
 * This is the payroll calculation layer.
 */
export async function syncWorkerPayroll(
  workerId: string, 
  siteId: string, 
  payFrequency: 'Daily' | 'Weekly' | 'Monthly', 
  salaryAmount: number,
  periodStart: string,
  periodEnd: string
): Promise<void> {
  // Fetch attendance for the period
  const { data: attendanceData, error: attError } = await supabase
    .from('attendance')
    .select('*')
    .eq('worker_id', workerId)
    .gte('date', periodStart)
    .lte('date', periodEnd);
    
  if (attError) throw new Error(formatDatabaseError(attError, 'Failed to fetch attendance for payroll.'));
  
  let daysPresent = 0;
  let halfDays = 0;
  let daysAbsent = 0;
  
  for (const att of attendanceData) {
    if (att.status === 'Present') daysPresent++;
    else if (att.status === 'Half Day') halfDays++;
    else if (att.status === 'Absent') daysAbsent++;
  }
  
  let grossAmount = 0;
  let effectiveDailyRate = salaryAmount;

  if (payFrequency === 'Weekly') {
    effectiveDailyRate = salaryAmount / 7;
  } else if (payFrequency === 'Monthly') {
    effectiveDailyRate = salaryAmount / 30;
  }

  grossAmount = (daysPresent * effectiveDailyRate) + (halfDays * (effectiveDailyRate / 2));
  
  // Upsert the payroll record
  const payload: PayrollInsert = {
    worker_id: workerId,
    site_id: siteId,
    pay_frequency: payFrequency,
    pay_period_start: periodStart,
    pay_period_end: periodEnd,
    rate: salaryAmount,
    days_present: daysPresent,
    half_days: halfDays,
    days_absent: daysAbsent,
    gross_amount: grossAmount,
    status: 'Paid'
  };

  const { error: upsertError } = await supabase
    .from('payroll_records')
    .upsert(payload, { onConflict: 'worker_id, pay_period_start, pay_period_end' });
    
  if (upsertError) {
    if (
      upsertError.code === 'PGRST205' ||
      upsertError.message?.includes('schema cache') ||
      upsertError.message?.includes('does not exist')
    ) {
      console.warn(
        '[Payroll] Note: Table "payroll_records" not found in Supabase database. Attendance was saved, but labor payroll record was skipped. Apply migration 003_financial_architecture.sql to activate.'
      );
      return;
    }
    console.error('syncWorkerPayroll error:', upsertError);
    throw new Error(formatDatabaseError(upsertError, 'Failed to generate payroll record.'));
  }
  
  dataSync.notify({ entity: 'payroll', action: 'invalidate' });
}
