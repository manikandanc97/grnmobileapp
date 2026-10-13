import type { Database } from '@/types/database';
type SiteLaborDailyRow = Database['public']['Tables']['site_labor_daily']['Row'];
export interface WorkerRoleConfig {
  key: string;
  label: string;
  countKey: keyof SiteLaborDailyRow;
  rateKey: keyof SiteLaborDailyRow;
  defaultRate: number;
}

export const WORKER_ROLES = [
  { key: 'mason', label: 'Masons', countKey: 'mason_count', rateKey: 'mason_rate', defaultRate: 1200 },
  { key: 'men_helper', label: 'Men Helpers', countKey: 'men_helper_count', rateKey: 'men_helper_rate', defaultRate: 800 },
  { key: 'women_helper', label: 'Women Helpers', countKey: 'women_helper_count', rateKey: 'women_helper_rate', defaultRate: 650 },
  { key: 'painter', label: 'Painters', countKey: 'painter_count', rateKey: 'painter_rate', defaultRate: 1000 },
  { key: 'carpenter', label: 'Carpenters', countKey: 'carpenter_count', rateKey: 'carpenter_rate', defaultRate: 1100 },
  { key: 'plumber', label: 'Plumbers', countKey: 'plumber_count', rateKey: 'plumber_rate', defaultRate: 1000 },
  { key: 'electrician', label: 'Electricians', countKey: 'electrician_count', rateKey: 'electrician_rate', defaultRate: 1000 },
  { key: 'bar_bender', label: 'Bar Benders', countKey: 'bar_bender_count', rateKey: 'bar_bender_rate', defaultRate: 1050 },
  { key: 'welder', label: 'Welders', countKey: 'welder_count', rateKey: 'welder_rate', defaultRate: 1000 },
  { key: 'flooring', label: 'Tile / Flooring', countKey: 'flooring_count', rateKey: 'flooring_rate', defaultRate: 1150 },
] as const;


export const EXTRA_SHIFTS = ['0.5', '1.5', '2'] as const;
export type ExtraShift = typeof EXTRA_SHIFTS[number];
export type ExtraShiftDraft = Partial<Record<ExtraShift, string>>;
export type LaborShiftDraft = Record<string, ExtraShiftDraft>;
type LaborRecord = Partial<SiteLaborDailyRow>;

function safeNumber(value: unknown): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) && result >= 0 ? result : 0;
}

function readExtras(record: LaborRecord | null | undefined, roleKey: string): Record<ExtraShift, number> {
  const json = record?.shift_counts;
  const role = json && typeof json === 'object' && !Array.isArray(json) ? json[roleKey] : undefined;
  return Object.fromEntries(EXTRA_SHIFTS.map(shift => [shift, role && typeof role === 'object' && !Array.isArray(role) ? safeNumber(role[shift]) : 0])) as Record<ExtraShift, number>;
}

export function readLaborShiftDraft(record: LaborRecord | null | undefined) {
  const counts: Record<string, string> = {};
  const extras: LaborShiftDraft = {};
  for (const role of WORKER_ROLES) {
    const values = readExtras(record, role.key);
    const specialWorkers = EXTRA_SHIFTS.reduce((sum, shift) => sum + values[shift], 0);
    counts[role.key] = String(Math.max(0, safeNumber(record?.[role.countKey]) - specialWorkers));
    extras[role.key] = Object.fromEntries(EXTRA_SHIFTS.map(shift => [shift, String(values[shift])]));
  }
  return { counts, extras };
}

export function getDraftRoleTotals(count: string, extras: ExtraShiftDraft = {}) {
  let workers = safeNumber(count);
  let shifts = workers;
  for (const shift of EXTRA_SHIFTS) {
    workers += safeNumber(extras[shift]);
    shifts += safeNumber(extras[shift]) * Number(shift);
  }
  return { workers, shifts };
}

export function getRecordRoleShifts(record: LaborRecord | null | undefined, roleKey: string): number {
  const role = WORKER_ROLES.find(item => item.key === roleKey);
  if (!role) return 0;
  const extras = readExtras(record, roleKey);
  const extraWorkers = EXTRA_SHIFTS.reduce((sum, shift) => sum + extras[shift], 0);
  const fullWorkers = Math.max(0, safeNumber(record?.[role.countKey]) - extraWorkers);
  return fullWorkers + EXTRA_SHIFTS.reduce((sum, shift) => sum + extras[shift] * Number(shift), 0);
}

export function calculateRecordLaborCost(record: LaborRecord | null | undefined): number {
  if (!record) return 0;
  const total = WORKER_ROLES.reduce((sum, role) => sum + getRecordRoleShifts(record, role.key) * safeNumber(record[role.rateKey]), 0);
  return Math.round((total + Number.EPSILON) * 100) / 100;
}

export function calculateRecordLaborCount(record: LaborRecord | null | undefined): number {
  if (!record) return 0;
  return WORKER_ROLES.reduce((sum, role) => sum + safeNumber(record[role.countKey]), 0);
}

export function calculateRecordLaborShifts(record: LaborRecord | null | undefined): number {
  return WORKER_ROLES.reduce((sum, role) => sum + getRecordRoleShifts(record, role.key), 0);
}

export function getLaborShiftSummary(record: LaborRecord | null | undefined, roleKey: string): string {
  const draft = readLaborShiftDraft(record);
  const entries = [['1', draft.counts[roleKey]], ...EXTRA_SHIFTS.map(shift => [shift, draft.extras[roleKey]?.[shift]])];
  return entries.filter(([, count]) => Number(count) > 0).map(([shift, count]) => count + ' × ' + shift + ' shift' + (shift === '1' || shift === '0.5' ? '' : 's')).join(' · ');
}

export function createLaborDraft(counts: Record<string,string>, rates: Record<string,string>, extras: LaborShiftDraft): LaborRecord {
  const record: LaborRecord = { shift_counts: {} };
  for (const role of WORKER_ROLES) {
    record[role.countKey] = getDraftRoleTotals(counts[role.key], extras[role.key]).workers;
    record[role.rateKey] = safeNumber(rates[role.key]);
    const values = Object.fromEntries(EXTRA_SHIFTS.map(shift => [shift, safeNumber(extras[role.key]?.[shift])]));
    if (Object.values(values).some(value => value > 0)) {
      (record.shift_counts as Record<string, unknown>)[role.key] = values;
    }
  }
  return record;
}

export function buildLaborPayload(counts: Record<string,string>, rates: Record<string,string>, extras: LaborShiftDraft): LaborRecord {
  for (const role of WORKER_ROLES) {
    const values = [counts[role.key], ...EXTRA_SHIFTS.map(shift => extras[role.key]?.[shift])];
    if (values.some(value => !Number.isSafeInteger(Number(value || '0')) || Number(value || '0') < 0)) {
      throw new Error(role.label + ': enter whole worker counts of zero or more.');
    }
    const rate = Number(rates[role.key] || '0');
    if (!Number.isFinite(rate) || rate < 0) throw new Error(role.label + ': enter a valid rate per shift.');
    const total = getDraftRoleTotals(counts[role.key], extras[role.key]).workers;
    if (total > 2147483647) throw new Error(role.label + ': worker count is too large.');
    if (!Number.isFinite(getDraftRoleTotals(counts[role.key], extras[role.key]).shifts * rate)) throw new Error(role.label + ': wage amount is too large.');
  }
  return createLaborDraft(counts, rates, extras);
}

export function hasExtraLaborShifts(record: LaborRecord): boolean {
  return WORKER_ROLES.some(role => EXTRA_SHIFTS.some(shift => readExtras(record, role.key)[shift] > 0));
}
